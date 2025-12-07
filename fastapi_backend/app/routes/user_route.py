from fastapi import APIRouter, Request, HTTPException
from app.models.user_model import User
from app.schemas.user_schema import UserCreate, UserResponse, TokenResponse, UserLogin
from app.utils.auth import hash_password, verify_password
from app.utils.jwt_utils import create_access_token
from app.services.auth_services import create_user_service, login_user_service


router = APIRouter()

@router.post("/", response_model=UserResponse)
async def create_user(user: UserCreate):
    user_doc = await create_user_service(user.email, user.password, user.role)
    return UserResponse(id=str(user_doc.id), email=user_doc.email, role=user_doc.role)


@router.post("/login", response_model=TokenResponse)
async def login_user(user: UserLogin):
    return await login_user_service(user.email, user.password)


@router.get("/profile")
async def get_profile(request: Request):
    if not request.access.user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # request.access.user contains the decoded token payload
    user_data = request.access.user
    return {"message": "Profile data", "user": user_data}
