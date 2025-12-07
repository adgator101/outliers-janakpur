from fastapi import APIRouter, HTTPException
from app.models.user_model import User
from app.schemas.user_schema import UserCreate, UserResponse, TokenResponse, UserLogin
from app.utils.auth import hash_password, verify_password
from app.utils.jwt_utils import create_access_token


router = APIRouter()

@router.post("/", response_model=UserResponse)
async def create_user(user: UserCreate):
    existing_user = await User.find_one(User.email == user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = hash_password(user.password)
    user_doc = User(email=user.email, password=hashed_password, role=user.role)
    await user_doc.insert()
    return UserResponse(id=str(user_doc.id), email=user_doc.email, role=user_doc.role)


@router.post("/login", response_model=TokenResponse)
async def login_user(user: UserLogin):
    user_doc = await User.find_one(User.email == user.email)
    if not user_doc or not verify_password(user.password, user_doc.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token_data = {"user_id": str(user_doc.id), "email": user_doc.email, "role": user_doc.role}
    access_token = create_access_token(token_data)

    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "email": user_doc.email,
        "role": user_doc.role
    }
