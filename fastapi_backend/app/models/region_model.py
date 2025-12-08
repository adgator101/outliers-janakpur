from beanie import Document
from pydantic import Field, BaseModel
from typing import Optional, Dict, List
from datetime import datetime
from shapely.geometry import shape

class RegionComment(BaseModel):
    """Comment on a region"""
    id: str = Field(default_factory=lambda: str(__import__('uuid').uuid4()))
    user_id: str
    user_email: str
    text: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Region(Document):
    """
    Region parent model.
    Represents a specific geographic area (Polygon/Point) that contains multiple incidents.
    """
    name: Optional[str] = "Unnamed Region"
    area_type: str # "polygon", "point", "circle"
    coordinates: dict # GeoJSON
    
    # Aggregated Stats
    incident_count: int = 0
    safety_score: float = 10.0  # 0-10, lower is more dangerous
    average_severity: Optional[str] = None  # "low", "medium", "high", "critical"
    high_severity_count: int = 0  # Count of high/critical incidents
    incident_types: Dict[str, int] = {}  # {"gbv": 2, "unsafe_area": 1}
    
    # New Scoring System
    cluster_factor: float = 1.0
    raw_score: float = 0.0
    normalized_score: float = 0.0 # 0-100, shown in UI
    
    # Legacy fields (kept for compatibility if needed)
    incident_weighted_score: float = 10.0
    validation_weighted_score: float = 10.0
    total_incident_weight: float = 0.0
    total_validation_weight: float = 0.0
    validated_incident_count: int = 0
    incident_weightage_percent: float = 30.0
    validation_weightage_percent: float = 70.0
    
    # Discussion
    comments: List[RegionComment] = []
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "regions"
    
    @staticmethod
    def calculate_overlap(coords1: dict, coords2: dict) -> float:
        """
        Calculate overlap percentage between two GeoJSON coordinates.
        Returns 0-100 indicating overlap percentage.
        """
        try:
            geom1 = shape(coords1)
            geom2 = shape(coords2)
            
            if not geom1.is_valid or not geom2.is_valid:
                return 0.0
            
            # Handle point geometries with buffer
            if geom1.geom_type == 'Point':
                geom1 = geom1.buffer(0.001)  # ~111 meters
            if geom2.geom_type == 'Point':
                geom2 = geom2.buffer(0.001)
            
            # Check intersection
            if not geom1.intersects(geom2):
                return 0.0
            
            intersection = geom1.intersection(geom2)
            smaller_area = min(geom1.area, geom2.area)
            
            if smaller_area == 0:
                return 0.0
            
            overlap_pct = (intersection.area / smaller_area) * 100
            return min(overlap_pct, 100.0)
            
        except Exception as e:
            print(f"Error calculating overlap: {e}")
            return 0.0
    
    async def recalculate_stats(self):
        """
        Recalculate aggregated statistics based on linked incidents.
        Should be called after adding/updating incidents.
        """
        from app.models.incident_model import Incident
        from app.utils.incident_weight import calculate_region_score
        
        incidents = await Incident.find({"region_id": str(self.id)}).to_list()
        
        self.incident_count = len(incidents)
        
        if not incidents:
            self.raw_score = 0.0
            self.normalized_score = 0.0
            self.average_severity = None
            self.high_severity_count = 0
            self.incident_types = {}
            self.safety_score = 10.0 # Legacy
        else:
            # Calculate severity stats
            severity_map = {"low": 1, "medium": 2, "high": 3, "critical": 4}
            severity_scores = [severity_map.get(inc.severity, 2) for inc in incidents]
            avg_severity_score = sum(severity_scores) / len(severity_scores)
            
            if avg_severity_score <= 1.5:
                self.average_severity = "low"
            elif avg_severity_score <= 2.5:
                self.average_severity = "medium"
            elif avg_severity_score <= 3.5:
                self.average_severity = "high"
            else:
                self.average_severity = "critical"
            
            # Count high severity incidents
            self.high_severity_count = sum(1 for inc in incidents if inc.severity in ["high", "critical"])
            
            # Count incident types
            self.incident_types = {}
            for inc in incidents:
                self.incident_types[inc.incident_type] = self.incident_types.get(inc.incident_type, 0) + 1
            
            # Calculate new scores
            self.raw_score, self.normalized_score = calculate_region_score(incidents, self.cluster_factor)
            
            # Update legacy safety_score (map normalized score 0-100 to 10-0)
            # 0 normalized (safe) -> 10 safety score
            # 100 normalized (unsafe) -> 0 safety score
            self.safety_score = max(0.0, 10.0 - (self.normalized_score / 10.0))
        
        self.updated_at = datetime.utcnow()
        await self.save()
