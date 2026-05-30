import os
from typing import List, Optional
from pydantic import AnyHttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    # Core API Settings
    PROJECT_NAME: str = "Tree Adoption Platform"
    API_V1_STR: str = "/api/v1"
    FASTAPI_ENV: str = os.getenv("FASTAPI_ENV", "development")
    
    # Security
    SECRET_KEY: str = "supersecretjwtkeyforcinematictreeadoptionplatform2026"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 days
    ALGORITHM: str = "HS256"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:1234@localhost:5432/farmTree"
    DB_SCHEMA: str = "farmTree"

    # Caching and Realtime Broker
    REDIS_URL: str = "redis://localhost:6379/0"

    # Third Party Integrations
    # Razorpay
    RAZORPAY_KEY_ID: str = "rzp_test_mockkeyid123"
    RAZORPAY_KEY_SECRET: str = "mockkeysecret456"

    # Firebase OTP (for verification simulations or true calls)
    FIREBASE_API_KEY: Optional[str] = None
    FIREBASE_PROJECT_ID: Optional[str] = None

    # Google Gemini AI
    GEMINI_API_KEY: Optional[str] = None

    # Storage (AWS S3 or Cloudinary)
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_STORAGE_BUCKET_NAME: Optional[str] = None
    CLOUDINARY_URL: Optional[str] = None
    CLOUDINARY_CLOUD_NAME: Optional[str] = None
    CLOUDINARY_API_KEY: Optional[str] = None
    CLOUDINARY_API_SECRET: Optional[str] = None
    CLOUDINARY_FOLDER: Optional[str] = None

    # CORS Origins
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
    ]

settings = Settings()
