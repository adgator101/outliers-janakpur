from beanie import Document
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId


class GeoJSONCoordinates(BaseModel):
    """Coordinates for GeoJSON format"""
    type: str  # "Point", "Polygon", "Circle"
    coordinates: List  # Can be [lng, lat] or [[lng, lat], ...] for polygon


class Comment(BaseModel):
    """Comment on an incident"""
    id: str = Field(default_factory=lambda: str(ObjectId()))
    user_id: str
    user_email: str
    text: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Incident(Document):
    """Main incident/report model"""
    user_id: str  # User who reported
    user_email: str  # For display purposes
    area_type: str  # "polygon", "point", "circle"
    coordinates: dict  # GeoJSON format
    incident_type: str  # "gbv", "unsafe_area", "no_lights", "other"
    description: str
    severity: Optional[str] = "medium"  # "low", "medium", "high", "critical"
    status: str = "pending"  # "pending", "verified", "resolved", "invalid"
    images: Optional[List[str]] = []  # URLs to uploaded images
    comments: Optional[List[Comment]] = []
    verified_by: Optional[str] = None  # Admin/reviewer ID who verified
    resolved_by: Optional[str] = None  # Admin/reviewer ID who resolved
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # For high alert tracking
    alert_level: Optional[str] = "normal"  # "normal", "warning", "high_alert"
    notified_authorities: bool = False
    
    region_id: Optional[str] = None # Link to parent Region
    
    # Engagement metrics (for weight calculation)
    comment_count: int = 0
    has_sufficient_description: bool = False  # True if description > 50 chars
    image_count: int = 0
    engagement_score: float = 0.0  # 0-100 based on interactions
    
    # Weight calculation (contributes to region safety score)
    base_weight: float = 1.0  # Default low weight
    final_weight: float = 1.0  # After applying engagement multipliers
    
    # Admin/NGO validation (majority of safety score impact)
    admin_validated: bool = False
    admin_validated_by: Optional[str] = None
    admin_validation_date: Optional[datetime] = None
    
    ngo_validated: bool = False
    ngo_validated_by: Optional[str] = None
    ngo_validation_date: Optional[datetime] = None
    
    validation_score: float = 0.0  # 0-100 based on validations
    validation_notes: Optional[str] = None

    class Settings:
        name = "incidents"
