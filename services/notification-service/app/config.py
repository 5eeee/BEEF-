from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "notification-service"
    debug: bool = False
    database_url: str = "postgresql+asyncpg://beefshteks:changeme@localhost:5432/notification_db"
    rabbitmq_url: str = "amqp://guest:guest@localhost:5672/"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"


settings = Settings()
