from fastapi import APIRouter, HTTPException, Depends, File, UploadFile
from typing import Optional
from datetime import datetime
from bson import ObjectId
import shutil
import os
import uuid

from app.models.incident_model import Incident, Comment, Audit
from app.schemas.incident_schema import (
    IncidentCreate,
    IncidentResponse,
    IncidentUpdate,
    IncidentValidation,
    CommentCreate,
    CommentResponse,
    IncidentListResponse,
    AuditResponse,
)
from app.schemas.region_schema import (
    RegionListResponse,
    RegionResponse,
    RegionCommentCreate,
    RegionCommentResponse,
)
from app.models.region_model import Region, RegionComment
from app.dependencies.auth_dependencies import get_current_user
from app.models.user_model import User
from app.utils.incident_weight import calculate_time_decay, calculate_audit_multiplier


router = APIRouter(prefix="/incidents", tags=["incidents"])


# ===== HELPER FUNCTIONS =====


async def update_incident_weights(incident: Incident):
    """
    Recalculate and update incident weights.
    Should be called after any interaction (audit, update).
    """
    # 1. Initial Weight (simplified logic for now, can be expanded)
    # Base weight 1.0, boosted by severity
    severity_map = {"low": 1.0, "medium": 1.5, "high": 2.5, "critical": 4.0}
    incident.initial_weight = severity_map.get(incident.severity, 1.0)

    # 2. Effective Multiplier from Audits
    if not incident.audits:
        incident.effective_multiplier = 1.0
    else:
        # Average of multipliers
        incident.effective_multiplier = sum(
            a.multiplier for a in incident.audits
        ) / len(incident.audits)

    # 3. Time Decay
    incident.time_decay_factor = calculate_time_decay(incident.created_at)

    # 4. Final Contribution
    incident.contribution_score = (
        incident.initial_weight
        * incident.effective_multiplier
        * incident.time_decay_factor
    )

    incident.updated_at = datetime.utcnow()

    await incident.save()

    # Trigger region recalculation
    if incident.region_id:
        try:
            region = await Region.get(ObjectId(incident.region_id))
            if region:
                await region.recalculate_stats()
                await region.save()
        except Exception as e:
            print(f"Error recalculating region stats: {e}")


def build_incident_response(incident: Incident) -> IncidentResponse:
    """Helper to build IncidentResponse from Incident model"""
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
        images=incident.images or [],
        comments=(
            [CommentResponse(**c.dict()) for c in incident.comments]
            if incident.comments
            else []
        ),
        alert_level=incident.alert_level,
        region_id=incident.region_id,
        created_at=incident.created_at,
        updated_at=incident.updated_at,
        # New fields
        initial_weight=getattr(incident, "initial_weight", 1.0),
        effective_multiplier=getattr(incident, "effective_multiplier", 1.0),
        time_decay_factor=getattr(incident, "time_decay_factor", 1.0),
        contribution_score=getattr(incident, "contribution_score", 0.0),
        audits=[
            AuditResponse(
                auditor_id=a.auditor_id,
                auditor_email=a.auditor_email,
                s_env=a.s_env,
                notes=a.notes,
                created_at=a.created_at,
                multiplier=a.multiplier
            )
            for a in getattr(incident, "audits", [])
        ],
        # Legacy fields mapping
        comment_count=getattr(incident, "comment_count", 0),
        has_sufficient_description=getattr(incident, "has_sufficient_description", False),
        image_count=getattr(incident, "image_count", 0),
        engagement_score=getattr(incident, "engagement_score", 0.0),
        base_weight=getattr(incident, "initial_weight", 1.0),  # Map to initial_weight
        final_weight=getattr(incident, "contribution_score", 1.0),  # Map to contribution_score
        admin_validated=getattr(incident, "admin_validated", False),
        admin_validated_by=getattr(incident, "admin_validated_by", None),
        ngo_validated=getattr(incident, "ngo_validated", False),
        ngo_validated_by=getattr(incident, "ngo_validated_by", None),
        validation_score=getattr(incident, "validation_score", 0.0),
        validation_notes=getattr(incident, "validation_notes", None),
    )


def build_region_response(region: Region) -> RegionResponse:
    """Helper to build RegionResponse from Region model"""
    return RegionResponse(
        id=str(region.id),
        name=region.name,
        area_type=region.area_type,
        coordinates=region.coordinates,
        incident_count=region.incident_count,
        safety_score=region.safety_score,
        average_severity=region.average_severity,
        high_severity_count=region.high_severity_count,
        incident_types=region.incident_types,
        comments=(
            [RegionCommentResponse(**c.dict()) for c in region.comments]
            if region.comments
            else []
        ),
        created_at=region.created_at,
        updated_at=region.updated_at,
        incident_weighted_score=region.incident_weighted_score,
        validation_weighted_score=region.validation_weighted_score,
        total_incident_weight=region.total_incident_weight,
        total_validation_weight=region.total_validation_weight,
        validated_incident_count=region.validated_incident_count,
        incident_weightage_percent=region.incident_weightage_percent,
        validation_weightage_percent=region.validation_weightage_percent,
    )


# ===== ENDPOINTS =====


@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...), current_user: User = Depends(get_current_user)
):
    """Upload an image file"""
    # Verify user is authenticated (current_user dependency ensures this)
    _ = current_user  # Mark as used

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
    incident_data: IncidentCreate, current_user: User = Depends(get_current_user)
):
    """
    Create a new incident report.
    Automatically finds overlapping region or creates new one.
    """
    region = None

    # Check if user provided region_id
    if incident_data.region_id:
        try:
            region = await Region.get(ObjectId(incident_data.region_id))
        except:
            raise HTTPException(status_code=404, detail="Region not found")
    else:
        # Find overlapping region (>50% overlap threshold)
        all_regions = await Region.find().to_list()

        for existing_region in all_regions:
            overlap = Region.calculate_overlap(
                incident_data.coordinates, existing_region.coordinates
            )

            # If significant overlap (>50%), use this region
            if overlap > 50:
                region = existing_region
                break

        # No overlapping region found, create new one
        if not region:
            region = Region(
                name=f"Region {incident_data.area_type}",
                area_type=incident_data.area_type,
                coordinates=incident_data.coordinates,
            )
            await region.insert()

    # Create incident linked to region
    incident = Incident(
        user_id=str(current_user.id),
        user_email=current_user.email,
        area_type=incident_data.area_type,
        coordinates=incident_data.coordinates,
        incident_type=incident_data.incident_type,
        description=incident_data.description,
        severity=incident_data.severity,
        images=incident_data.images or [],
        region_id=str(region.id),
    )

    await incident.insert()

    # Calculate initial weights and engagement metrics
    await update_incident_weights(incident)

    return build_incident_response(incident)


@router.get("/", response_model=IncidentListResponse)
async def get_incidents(
    status: Optional[str] = None,
    incident_type: Optional[str] = None,
    alert_level: Optional[str] = None,
    limit: int = 100,
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

    incident_responses = [build_incident_response(inc) for inc in incidents]

    return IncidentListResponse(incidents=incident_responses, total=total)


# ===== REGION ENDPOINTS (must be before /{incident_id} to avoid path conflicts) =====


@router.get("/regions", response_model=RegionListResponse)
async def get_regions():
    """Get all regions with aggregated statistics for map display"""
    regions = await Region.find().to_list()
    region_responses = [build_region_response(region) for region in regions]
    return RegionListResponse(regions=region_responses, total=len(region_responses))


@router.get("/regions/{region_id}", response_model=RegionResponse)
async def get_region(region_id: str):
    """Get a specific region by ID"""
    try:
        region = await Region.get(ObjectId(region_id))
        if not region:
            raise HTTPException(status_code=404, detail="Region not found")
        return build_region_response(region)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/regions/{region_id}/comments", response_model=RegionResponse)
async def add_region_comment(
    region_id: str,
    comment_data: RegionCommentCreate,
    current_user: User = Depends(get_current_user),
):
    """Add a comment/discussion to a region"""
    try:
        region = await Region.get(ObjectId(region_id))
        if not region:
            raise HTTPException(status_code=404, detail="Region not found")

        comment = RegionComment(
            user_id=str(current_user.id),
            user_email=current_user.email,
            text=comment_data.text,
        )

        if not region.comments:
            region.comments = []

        region.comments.append(comment)
        region.updated_at = datetime.utcnow()

        await region.save()

        return build_region_response(region)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/regions/{region_id}/incidents", response_model=IncidentListResponse)
async def get_region_incidents(region_id: str):
    """Get all incidents for a specific region"""
    try:
        region = await Region.get(ObjectId(region_id))
        if not region:
            raise HTTPException(status_code=404, detail="Region not found")

        incidents = await Incident.find({"region_id": region_id}).to_list()
        incident_responses = [build_incident_response(inc) for inc in incidents]

        return IncidentListResponse(
            incidents=incident_responses, total=len(incident_responses)
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident(incident_id: str):
    """Get a specific incident by ID"""
    try:
        incident = await Incident.get(ObjectId(incident_id))
        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found")
        return build_incident_response(incident)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{incident_id}", response_model=IncidentResponse)
async def update_incident(
    incident_id: str,
    update_data: IncidentUpdate,
    current_user: User = Depends(get_current_user),
):
    """Update incident status/severity (for ngos/admins)"""
    # Only ngos and admins can update
    if current_user.role not in ["ngo", "admin"]:
        raise HTTPException(
            status_code=403, detail="Not authorized to update incidents"
        )

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

        # Recalculate weights if severity changed
        if update_data.severity:
            await update_incident_weights(incident)

        return build_incident_response(incident)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{incident_id}/comments", response_model=IncidentResponse)
async def add_comment(
    incident_id: str,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user),
):
    """Add a comment to an incident"""
    try:
        incident = await Incident.get(ObjectId(incident_id))
        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found")

        comment = Comment(
            user_id=str(current_user.id),
            user_email=current_user.email,
            text=comment_data.text,
        )

        if not incident.comments:
            incident.comments = []

        incident.comments.append(comment)
        incident.updated_at = datetime.utcnow()

        await incident.save()

        # Recalculate weights as comment count changed
        await update_incident_weights(incident)

        return build_incident_response(incident)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{incident_id}")
async def delete_incident(
    incident_id: str, current_user: User = Depends(get_current_user)
):
    """Delete an incident (only by creator or admin)"""
    try:
        incident = await Incident.get(ObjectId(incident_id))
        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found")

        # Only creator or admin can delete
        if incident.user_id != str(current_user.id) and current_user.role != "admin":
            raise HTTPException(
                status_code=403, detail="Not authorized to delete this incident"
            )

        region_id = incident.region_id
        await incident.delete()

        # Recalculate region stats after deletion
        if region_id:
            try:
                region = await Region.get(ObjectId(region_id))
                if region:
                    await region.recalculate_stats()
            except Exception:
                pass  # Ignore errors when updating region stats

        return {"message": "Incident deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ===== VALIDATION ENDPOINTS (Admin/NGO) =====


@router.post("/{incident_id}/validate/admin", response_model=IncidentResponse)
async def admin_validate_incident(
    incident_id: str,
    validation_data: IncidentValidation,
    current_user: User = Depends(get_current_user),
):
    """
    Admin validation of an incident.
    Creates an audit entry.
    """
    # Only admins can admin-validate
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403, detail="Only admins can validate incidents"
        )

    try:
        incident = await Incident.get(ObjectId(incident_id))
        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found")

        # Calculate multiplier
        # Admins have high credibility (e.g. 1.0)
        c_a = getattr(current_user, "auditor_credibility", 1.0)
        multiplier = calculate_audit_multiplier(validation_data.s_env, c_a)

        # Create Audit
        audit = Audit(
            auditor_id=str(current_user.id),
            auditor_email=current_user.email,
            s_env=validation_data.s_env,
            notes=validation_data.validation_notes,
            multiplier=multiplier,
        )

        if not incident.audits:
            incident.audits = []
        incident.audits.append(audit)

        # Legacy flags
        incident.admin_validated = True
        incident.admin_validated_by = str(current_user.id)
        incident.validation_notes = validation_data.validation_notes

        incident.updated_at = datetime.utcnow()
        await incident.save()

        # Recalculate weights
        await update_incident_weights(incident)

        return build_incident_response(incident)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{incident_id}/validate/ngo", response_model=IncidentResponse)
async def ngo_validate_incident(
    incident_id: str,
    validation_data: IncidentValidation,
    current_user: User = Depends(get_current_user),
):
    """
    NGO validation of an incident.
    Creates an audit entry.
    """
    # Only ngos can NGO-validate
    if current_user.role != "ngo":
        raise HTTPException(
            status_code=403, detail="Only NGO reviewers can validate incidents"
        )

    try:
        incident = await Incident.get(ObjectId(incident_id))
        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found")

        # Calculate multiplier
        c_a = getattr(current_user, "auditor_credibility", 0.5)
        multiplier = calculate_audit_multiplier(validation_data.s_env, c_a)

        # Create Audit
        audit = Audit(
            auditor_id=str(current_user.id),
            auditor_email=current_user.email,
            s_env=validation_data.s_env,
            notes=validation_data.validation_notes,
            multiplier=multiplier,
        )

        if not incident.audits:
            incident.audits = []
        incident.audits.append(audit)

        # Legacy flags
        incident.ngo_validated = True
        incident.ngo_validated_by = str(current_user.id)
        incident.validation_notes = validation_data.validation_notes

        incident.updated_at = datetime.utcnow()
        await incident.save()

        # Recalculate weights
        await update_incident_weights(incident)

        return build_incident_response(incident)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{incident_id}/validate/admin", response_model=IncidentResponse)
async def remove_admin_validation(
    incident_id: str, current_user: User = Depends(get_current_user)
):
    """Remove admin validation from an incident"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403, detail="Only admins can remove admin validation"
        )

    try:
        incident = await Incident.get(ObjectId(incident_id))
        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found")

        incident.admin_validated = False
        incident.admin_validated_by = None
        incident.admin_validation_date = None
        incident.updated_at = datetime.utcnow()

        await incident.save()
        await update_incident_weights(incident)

        return build_incident_response(incident)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{incident_id}/validate/ngo", response_model=IncidentResponse)
async def remove_ngo_validation(
    incident_id: str, current_user: User = Depends(get_current_user)
):
    """Remove NGO validation from an incident"""
    if current_user.role not in ["ngo", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Only NGO reviewers or admins can remove NGO validation",
        )

    try:
        incident = await Incident.get(ObjectId(incident_id))
        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found")

        incident.ngo_validated = False
        incident.ngo_validated_by = None
        incident.ngo_validation_date = None
        incident.updated_at = datetime.utcnow()

        await incident.save()
        await update_incident_weights(incident)

        return build_incident_response(incident)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
