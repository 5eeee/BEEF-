from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "order-service"
    debug: bool = False
    database_url: str = "postgresql+asyncpg://beefshteks:changeme@localhost:5432/order_db"
    redis_url: str = "redis://localhost:6379/1"
    rabbitmq_url: str = "amqp://guest:guest@localhost:5672/"

    catalog_service_url: str = "http://catalog-service:8001"
    promotion_service_url: str = "http://promotion-service:8008"
    delivery_service_url: str = "http://delivery-service:8006"
    payment_service_url: str = "http://payment-service:8004"

    cart_ttl_seconds: int = 86400  # 24h
    jwt_secret: str = "dev-secret"
    jwt_algorithm: str = "HS256"


settings = Settings()
