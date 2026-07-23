from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "media-service"
    debug: bool = False
    database_url: str = "postgresql+asyncpg://beefshteks:changeme@localhost:5432/media_db"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    s3_endpoint: str = "http://localhost:9000"
    s3_access_key: str = "minioadmin"
    s3_secret_key: str = "minioadmin"
    s3_bucket: str = "beefshteks-media"
    s3_region: str = "us-east-1"

    public_base_url: str = "http://localhost:8000"
    webp_quality: int = 85
    max_upload_bytes: int = 10 * 1024 * 1024


settings = Settings()
