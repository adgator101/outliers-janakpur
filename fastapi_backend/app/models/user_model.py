from beanie import Document
from pydantic import EmailStr
from app.schemas.role_schema import Role

class User(Document):
    email: EmailStr
    password: str  # hashed password
    role: Role

    class Settings:
        name = "users"  # MongoDB collection name
