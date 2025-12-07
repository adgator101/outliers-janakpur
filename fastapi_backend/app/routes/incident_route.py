from fastapi import APIRouter, HTTPException, Depends, File, UploadFile
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
import shutil
import os
import uuid

from app.models.incident_model import Incident, Comment
from app.schemas.incident_schema import (
    IncidentCreate, 
    IncidentResponse, 
    IncidentUpdate,
    CommentCreate,
    CommentResponse,
    IncidentListResponse
)
from app.dependencies.auth_dependencies import get_current_user
from app.models.user_model import User


router = APIRouter(prefix="/incidents", tags=["incidents"])


@router.post("/upload")
async def upload_image(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    """Upload an image file"""
    try:
        # Create uploads directory if it doesn't exist
        UPLOAD_DIR = "uploads"
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1]
        filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Return URL (relative path that will be served by static mount)
        return {"url": f"/uploads/{filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=IncidentResponse)
async def create_incident(
    incident_data: IncidentCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new incident report"""
    incident = Incident(
        user_id=str(current_user.id),
        user_email=current_user.email,
        area_type=incident_data.area_type,
        coordinates=incident_data.coordinates,
        incident_type=incident_data.incident_type,
        description=incident_data.description,
        severity=incident_data.severity,
        images=incident_data.images or []
    )
    
    await incident.insert()
    
    return IncidentResponse(
        id=str(incident.id),
        user_id=incident.user_id,
        user_email=incident.user_email,
        area_type=incident.area_type,
        coordinates=incident.coordinates,
        incident_type=incident.incident_type,
        description=incident.description,
        severity=incident.severity,
        status=incident.status,
        images=incident.images,
        comments=[],
        alert_level=incident.alert_level,
        created_at=incident.created_at,
        updated_at=incident.updated_at
    )


@router.get("/", response_model=IncidentListResponse)
async def get_incidents(
    status: Optional[str] = None,
    incident_type: Optional[str] = None,
    alert_level: Optional[str] = None,
    limit: int = 100
):
    """Get all incidents with optional filters"""
    query = {}
    
    if status:
        query["status"] = status
    if incident_type:
        query["incident_type"] = incident_type
    if alert_level:
        query["alert_level"] = alert_level
    
    incidents = await Incident.find(query).limit(limit).to_list()
    total = await Incident.find(query).count()
    
    incident_responses = []
    for inc in incidents:
        incident_responses.append(
            IncidentResponse(
                id=str(inc.id),
                user_id=inc.user_id,
                user_email=inc.user_email,
                area_type=inc.area_type,
                coordinates=inc.coordinates,
                incident_type=inc.incident_type,
                description=inc.description,
                severity=inc.severity,
                status=inc.status,
                images=inc.images,
                comments=[CommentResponse(**c.dict()) for c in inc.comments] if inc.comments else [],
                alert_level=inc.alert_level,
                created_at=inc.created_at,
                updated_at=inc.updated_at
            )
        )
    
    return IncidentListResponse(incidents=incident_responses, total=total)


@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident(incident_id: str):
    """Get a specific incident by ID"""
    try:
        incident = await Incident.get(ObjectId(incident_id))
        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found")
        
        return IncidentResponse(
            id=str(incident.id),
            user_id=incident.user_id,
            user_email=incident.user_email,
            area_type=incident.area_type,
            coordinates=incident.coordinates,
            incident_type=incident.incident_type,
            description=incident.description,
            severity=incident.severity,
            status=incident.status,
            images=incident.images,
            comments=[CommentResponse(**c.dict()) for c in incident.comments] if incident.comments else [],
            alert_level=incident.alert_level,
            created_at=incident.created_at,
            updated_at=incident.updated_at
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{incident_id}", response_model=IncidentResponse)
async def update_incident(
    incident_id: str,
    update_data: IncidentUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update incident status/severity (for reviewers/admins)"""
    # Only reviewers and bureaucrats can update
    if current_user.role not in ["reviewers", "bureaucrat"]:
        raise HTTPException(status_code=403, detail="Not authorized to update incidents")
    
    try:
        incident = await Incident.get(ObjectId(incident_id))
        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found")
        
        # Update fields
        if update_data.status:
            incident.status = update_data.status
            if update_data.status == "verified":
                incident.verified_by = str(current_user.id)
            elif update_data.status == "resolved":
                incident.resolved_by = str(current_user.id)
        
        if update_data.severity:
            incident.severity = update_data.severity
        
        if update_data.alert_level:
            incident.alert_level = update_data.alert_level
        
        incident.updated_at = datetime.utcnow()
        
        await incident.save()
        
        return IncidentResponse(
            id=str(incident.id),
            user_id=incident.user_id,
            user_email=incident.user_email,
            area_type=incident.area_type,
            coordinates=incident.coordinates,
            incident_type=incident.incident_type,
            description=incident.description,
            severity=incident.severity,
            status=incident.status,
            images=incident.images,
            comments=[CommentResponse(**c.dict()) for c in incident.comments] if incident.comments else [],
            alert_level=incident.alert_level,
            created_at=incident.created_at,
            updated_at=incident.updated_at
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{incident_id}/comments", response_model=IncidentResponse)
async def add_comment(
    incident_id: str,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user)
):
    """Add a comment to an incident"""
    try:
        incident = await Incident.get(ObjectId(incident_id))
        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found")
        
        comment = Comment(
            user_id=str(current_user.id),
            user_email=current_user.email,
            text=comment_data.text
        )
        
        if not incident.comments:
            incident.comments = []
        
        incident.comments.append(comment)
        incident.updated_at = datetime.utcnow()
        
        await incident.save()
        
        return IncidentResponse(
            id=str(incident.id),
            user_id=incident.user_id,
            user_email=incident.user_email,
            area_type=incident.area_type,
            coordinates=incident.coordinates,
            incident_type=incident.incident_type,
            description=incident.description,
            severity=incident.severity,
            status=incident.status,
            images=incident.images,
            comments=[CommentResponse(**c.dict()) for c in incident.comments],
            alert_level=incident.alert_level,
            created_at=incident.created_at,
            updated_at=incident.updated_at
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{incident_id}")
async def delete_incident(
    incident_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete an incident (only by creator or admin)"""
    try:
        incident = await Incident.get(ObjectId(incident_id))
        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found")
        
        # Only creator or bureaucrat can delete
        if incident.user_id != str(current_user.id) and current_user.role != "bureaucrat":
            raise HTTPException(status_code=403, detail="Not authorized to delete this incident")
        
        await incident.delete()
        
        return {"message": "Incident deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
