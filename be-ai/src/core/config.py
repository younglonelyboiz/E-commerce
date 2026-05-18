import os

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Khai báo các biến khớp với file .env
    GEMINI_API_KEY: str
    PORT: int

    # Cấu hình RAG
    PINECONE_API_KEY: str
    PINECONE_INDEX_NAME: str
    EMBEDDING_MODEL: str = "llama-text-embed-v2"

    # MariaDB — READ-ONLY (dùng cùng credentials với Node, chỉ SELECT)
    DB_HOST: str = "db"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = "root"
    DB_NAME: str = "e-commerce"

    # Cấu hình Pydantic để đọc .env
    model_config = SettingsConfigDict(
        env_file=os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"
        ),
        extra="ignore"
    )

settings = Settings()