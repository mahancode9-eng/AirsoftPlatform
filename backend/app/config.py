from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Airsoft Platform API"
    DATABASE_URL: str = "postgresql+psycopg://airsoft:airsoft@localhost:5432/airsoft"
    SECRET_KEY: str = "dev-secret-change-me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    SITE_URL: str = "http://localhost"
    BACKEND_CORS_ORIGINS: str = "http://localhost,http://localhost:3000"

    ADMIN_PHONE: str = "09120000000"
    ADMIN_PASSWORD: str = "admin1234"
    ADMIN_NAME: str = "Admin"

    KAVENEGAR_API_KEY: str = ""
    SMS_SENDER: str = ""

    UPLOAD_DIR: str = "/app/uploads"

    class Config:
        env_file = ".env"
        extra = "ignore"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.BACKEND_CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
