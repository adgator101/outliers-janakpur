from app.models.user_model import User
from app.utils.auth import hash_password, verify_password
from app.utils.jwt_utils import create_access_token
from fastapi import HTTPException

async def create_user_service(email: str, password: str, role: str):
    existing_user = await User.find_one(User.email == email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = hash_password(password)
    user_doc = User(email=email, password=hashed_password, role=role)
    await user_doc.insert()
    return user_doc

async def login_user_service(email: str, password: str):
    user_doc = await User.find_one(User.email == email)
    if not user_doc or not verify_password(password, user_doc.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token_data = {"user_id": str(user_doc.id), "email": user_doc.email, "role": user_doc.role}
    access_token = create_access_token(token_data)

    return {"access_token": access_token, "token_type": "bearer"}