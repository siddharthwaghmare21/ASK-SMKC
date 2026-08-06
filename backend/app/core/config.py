from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, EmailStr, validator
from typing import List, Optional, Union

class Settings(BaseSettings):
    PROJECT_NAME: str = "Municipal AI Knowledge Management System (MAIKMS)"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    # Database
    MYSQL_USER: str = "root"
    MYSQL_PASSWORD: str = "password"
    MYSQL_HOST: str = "localhost"
    MYSQL_PORT: str = "3306"
    MYSQL_DB: str = "maikms"
    
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        # Fallback to SQLite if Docker/MySQL is not available for local dev
        return "sqlite:///./maikms.db"
        
    # Security
    SECRET_KEY: str = "CHANGE_THIS_SECRET_KEY_IN_PRODUCTION"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # Qdrant
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_COLLECTION: str = "maikms_documents"
    
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

settings = Settings()
