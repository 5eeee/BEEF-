from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "delivery-service"
    debug: bool = False
    redis_url: str = "redis://localhost:6379/3"
    dadata_api_key: str = ""
    dadata_suggest_url: str = "https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address"
    suggest_cache_ttl: int = 3600
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"


settings = Settings()
