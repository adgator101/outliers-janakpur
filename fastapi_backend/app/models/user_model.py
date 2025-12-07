from beanie import Document
from pydantic import EmailStr
from app.schemas.role_schema import Role

class User(Document):
    email: EmailStr
    password: str  # hashed password
    role: Role
    
    # Auditor specific fields
    auditor_credibility: float = 0.5  # Start with 0.5 (probation)
    verified_count: int = 0
    flagged_count: int = 0

    class Settings:
        name = "users"  # MongoDB collection name
