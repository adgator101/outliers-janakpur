import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.user_model import User
from app.models.incident_model import Incident
from app.models.region_model import Region
from app.routes.user_route import router as user_router
from app.routes.incident_route import router as incident_router
from typing import cast

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("DB_NAME")


@asynccontextmanager
async def lifespan(app: FastAPI):
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[cast(str, DB_NAME)]
    await init_beanie(database=db, document_models=[User, Incident, Region])
    
    yield  # app is ready

    client.close()

# Only one FastAPI instance with lifespan
app = FastAPI(title="Hackathon Backend", lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles

# Include routers
app.include_router(user_router, prefix="/api/users", tags=["users"])
app.include_router(incident_router, prefix="/api", tags=["incidents"])

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
