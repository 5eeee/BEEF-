from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "payment-service"
    debug: bool = False
    database_url: str = "postgresql+asyncpg://beefshteks:changeme@localhost:5432/payment_db"
    rabbitmq_url: str = "amqp://guest:guest@localhost:5672/"

    payment_gateway_secret: str = "dev-secret"
    auto_complete_payments: bool = True
    base_url: str = "http://localhost:8000"


settings = Settings()
