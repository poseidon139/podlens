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
    
    # Operational Mode & Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "production")  # production, staging, development
    # If True, serves rich pre-grounded podcast episodes if Vertex AI or credentials are unavailable
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() in ("true", "1", "yes")
    
    # Responsible AI & Safety Thresholds (Google Cloud AUP Compliance)
    SAFETY_BLOCK_THRESHOLD: str = os.getenv("SAFETY_BLOCK_THRESHOLD", "BLOCK_LOW_AND_ABOVE")
    MIN_GROUNDING_CONFIDENCE_VERIFIED: float = float(os.getenv("MIN_GROUNDING_CONFIDENCE_VERIFIED", "0.75"))
    MIN_GROUNDING_CONFIDENCE_CONTESTED: float = float(os.getenv("MIN_GROUNDING_CONFIDENCE_CONTESTED", "0.60"))
    
    # Ingestion Controls & Rate Limiting Guardrails
    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
    VERIFY_RATE_LIMIT_PER_MINUTE: int = int(os.getenv("VERIFY_RATE_LIMIT_PER_MINUTE", "15"))
    REQUEST_TIMEOUT_SECONDS: int = int(os.getenv("REQUEST_TIMEOUT_SECONDS", "45"))
    MAX_INPUT_TEXT_LENGTH: int = int(os.getenv("MAX_INPUT_TEXT_LENGTH", "1500"))
    
    # CORS
    CORS_ORIGINS: List[str] = ["*"]
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"

settings = Settings()
