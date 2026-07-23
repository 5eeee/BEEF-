from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "integration-service"
    debug: bool = False
    database_url: str = "postgresql+asyncpg://beefshteks:changeme@localhost:5432/integration_db"
    rabbitmq_url: str = "amqp://guest:guest@localhost:5672/"
    crm_max_retries: int = 3
    crm_base_backoff_seconds: float = 1.0


settings = Settings()
