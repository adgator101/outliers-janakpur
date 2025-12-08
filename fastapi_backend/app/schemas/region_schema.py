from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime


class RegionCommentCreate(BaseModel):
    """Schema for adding a comment to a region"""
    text: str


class RegionCommentResponse(BaseModel):
    """Schema for region comment response"""
    id: str
    user_id: str
    user_email: str
    text: str
    created_at: datetime

    class Config:
        from_attributes = True


class RegionCreate(BaseModel):
    name: Optional[str] = "Unnamed Region"
    area_type: str
    coordinates: dict

class RegionResponse(BaseModel):
    id: str
    name: str
    area_type: str
    coordinates: dict
    incident_count: int
    safety_score: float
    average_severity: Optional[str]
    high_severity_count: int
    incident_types: Dict[str, int]
    comments: List[RegionCommentResponse] = []
    created_at: datetime
    updated_at: datetime
    
    # New Score Fields
    cluster_factor: float = 1.0
    raw_score: float = 0.0
    normalized_score: float = 0.0
    
    # Safety score breakdown (Legacy)
    incident_weighted_score: float = 10.0
    validation_weighted_score: float = 10.0
    total_incident_weight: float = 0.0
    total_validation_weight: float = 0.0
    validated_incident_count: int = 0
    incident_weightage_percent: float = 30.0
    validation_weightage_percent: float = 70.0

class RegionListResponse(BaseModel):
    regions: List[RegionResponse]
    total: int
