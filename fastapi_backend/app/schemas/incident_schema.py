from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class IncidentCreate(BaseModel):
    """Schema for creating a new incident"""

    area_type: str  # "polygon", "point", "circle"
    coordinates: dict  # GeoJSON format
    incident_type: str  # "gbv", "unsafe_area", "no_lights", "other"
    description: str
    severity: Optional[str] = "medium"
    images: Optional[List[str]] = []
    region_id: Optional[str] = None  # Optional: if adding to existing region


class IncidentUpdate(BaseModel):
    """Schema for updating an incident (admin/reviewer)"""

    status: Optional[str] = None
    severity: Optional[str] = None
    alert_level: Optional[str] = None


class IncidentValidation(BaseModel):
    """Schema for validating an incident (admin/NGO)"""

    validation_notes: Optional[str] = None
    s_env: float = 1.0  # Default to 1.0 (high risk/confirmed)


class CommentCreate(BaseModel):
    """Schema for adding a comment"""

    text: str


class CommentResponse(BaseModel):
    """Schema for comment response"""

    id: str
    user_id: str
    user_email: str
    text: str
    created_at: datetime

    class Config:
        from_attributes = True


class AuditResponse(BaseModel):
    """Schema for audit response"""

    auditor_id: str
    auditor_email: str
    s_env: float
    notes: Optional[str] = None
    created_at: datetime
    multiplier: float


class IncidentResponse(BaseModel):
    """Schema for incident response"""

    id: str
    user_id: str
    user_email: str
    area_type: str
    coordinates: dict
    incident_type: str
    description: str
    severity: str
    status: str
    images: List[str]
    comments: List[CommentResponse]
    alert_level: str
    region_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    # New Weight Fields
    initial_weight: float = 1.0
    effective_multiplier: float = 1.0
    time_decay_factor: float = 1.0
    contribution_score: float = 0.0
    audits: List[AuditResponse] = []

    # Legacy fields (kept for compatibility)
    comment_count: int = 0
    has_sufficient_description: bool = False
    image_count: int = 0
    engagement_score: float = 0.0
    base_weight: float = 1.0
    final_weight: float = 1.0
    admin_validated: bool = False
    admin_validated_by: Optional[str] = None
    ngo_validated: bool = False
    ngo_validated_by: Optional[str] = None
    validation_score: float = 0.0
    validation_notes: Optional[str] = None

    class Config:
        from_attributes = True


class IncidentListResponse(BaseModel):
    """Schema for listing incidents"""

    incidents: List[IncidentResponse]
    total: int
