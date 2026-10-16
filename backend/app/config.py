import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "PodLens (CiteCast)"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Google Cloud Settings
    GCP_PROJECT_ID: str = os.getenv("GCP_PROJECT_ID", os.getenv("GOOGLE_CLOUD_PROJECT", ""))
    GCP_LOCATION: str = os.getenv("GCP_LOCATION", "us-central1")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash-001")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # Firestore & Storage
    FIRESTORE_DATABASE: str = os.getenv("FIRESTORE_DATABASE", "(default)")
    GCS_BUCKET_NAME: str = os.getenv("GCS_BUCKET_NAME", "podlens-media-staging")
    
    # Operational Mode
    # If True, serves rich pre-grounded podcast episodes if Vertex AI or credentials are unavailable
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() in ("true", "1", "yes")
    
    # CORS
    CORS_ORIGINS: List[str] = ["*"]
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"

settings = Settings()
