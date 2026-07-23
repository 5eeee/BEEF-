from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "catalog-service"
    debug: bool = False
    database_url: str = "postgresql+asyncpg://beefshteks:changeme@localhost:5432/catalog_db"
    meilisearch_url: str = "http://localhost:7700"
    meilisearch_key: str = "masterKey"
    meilisearch_index: str = "products"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    media_service_url: str = "http://media-service:8010"
    public_api_url: str = "http://localhost:8000"
    admin_import_key: str = "dev-import-key"


settings = Settings()
