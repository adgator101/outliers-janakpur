import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.user_model import User
from app.routes.user_route import router as user_router
from typing import cast

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("DB_NAME")


@asynccontextmanager
async def lifespan(app: FastAPI):
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[cast(str, DB_NAME)]
    await init_beanie(database=db, document_models=[User])
    
    yield  # app is ready

    client.close()

# Only one FastAPI instance with lifespan
app = FastAPI(title="Hackathon Backend", lifespan=lifespan)

# Include routers
app.include_router(user_router)
