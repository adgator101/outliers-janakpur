from pydantic import BaseModel, EmailStr
from app.schemas.role_schema import Role

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: Role

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    role: Role 

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    email: EmailStr
    role: Role