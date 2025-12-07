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

    class Settings:
        name = "incidents"
