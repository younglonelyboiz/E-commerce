import os

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Khai báo các biến khớp với file .env của ông
    # Pydantic sẽ tự động convert sang kiểu dữ liệu tương ứng (int, str)
    GEMINI_API_KEY: str
    PORT: int  
    
    # Các cấu hình mặc định cho RAG
    CHROMA_DB_DIR: str = "chroma_db"
    EMBEDDING_MODEL: str = "paraphrase-multilingual-MiniLM-L12-v2"

    # Cấu hình Pydantic để đọc .env
    model_config = SettingsConfigDict(
        env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),      # Cực kỳ quan trọng: Cho phép bỏ qua các biến thừa trong .env không được khai báo ở trên
        extra="ignore" 
    )

settings = Settings()