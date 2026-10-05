from functools import lru_cache
from typing import Annotated

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "SME-Twin"
    environment: str = "development"
    frontend_port: int = 5173
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/sme_twin"
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5500"])
    gemini_api_key: SecretStr | None = None
    gemini_model: str = "gemini-1.5-flash"
    twilio_account_sid: str | None = None
    twilio_auth_token: SecretStr | None = None
    twilio_from_phone: str | None = None
    twilio_whatsapp_from: str = "whatsapp:+14155238886"

    @property
    def twilio_whatsapp_from_normalized(self) -> str:
        """Strip spaces from the WhatsApp number (common copy-paste issue)."""
        return self.twilio_whatsapp_from.replace(" ", "")
    max_upload_bytes: Annotated[int, Field(gt=0)] = 10 * 1024 * 1024
    peak_demand_power_factor: Annotated[float, Field(gt=0, le=1)] = 0.9

    @field_validator("database_url", mode="before")
    @classmethod
    def use_asyncpg_driver(cls, value: object) -> object:
        if isinstance(value, str):
            for scheme in ("postgres://", "postgresql://"):
                if value.startswith(scheme):
                    return "postgresql+asyncpg://" + value[len(scheme):]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()