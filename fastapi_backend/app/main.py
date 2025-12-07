import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.user_model import User
from app.routes.user_route import router as user_router
from app.middleware.middleware import CustomHeaderMiddleware
from app.middleware.auth_middleware import AuthMiddleware
from typing import cast

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("DB_NAME")


@asynccontextmanager
async def lifespan(app: FastAPI):
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[cast(str, DB_NAME)]
    await init_beanie(database=db, document_models=[User])
    
    yield

    client.close()


# Create FastAPI instance
app = FastAPI(title="Hackathon Backend", lifespan=lifespan)

# CORS middleware (adjust origins as needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Set your allowed origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth middleware (order matters: after CORSMiddleware)
app.add_middleware(AuthMiddleware)

# Custom headers middleware
app.add_middleware(CustomHeaderMiddleware)

# Include routers
app.include_router(user_router)
