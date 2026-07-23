from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "identity-service"
    debug: bool = False
    database_url: str = "postgresql+asyncpg://beefshteks:changeme@localhost:5432/identity_db"
    redis_url: str = "redis://localhost:6379/2"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    jwt_secret: str = "dev-secret"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    otp_ttl_seconds: int = 300
    otp_mock_code: str = "1234"
    otp_rate_limit_seconds: int = 60
    otp_max_attempts: int = 5


settings = Settings()
