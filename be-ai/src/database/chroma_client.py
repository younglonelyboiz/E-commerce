import chromadb
from chromadb.utils import embedding_functions
from src.core.config import settings

# Khởi tạo các biến global để lưu giữ kết nối
_client = None
_emb_fn = None

def get_collection():
    global _client, _emb_fn
    
    # 1. Chỉ khởi tạo Client một lần duy nhất
    if _client is None:
        # Dùng đường dẫn từ file settings cho chuyên nghiệp
        _client = chromadb.PersistentClient(path=settings.CHROMA_DB_DIR)
    
    # 2. Chỉ load Model Embedding một lần duy nhất (Nặng nhất ở đây)
    if _emb_fn is None:
        print(" Loading Embedding Model (MiniLM)...") 
        _emb_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name=settings.EMBEDDING_MODEL
        )
    
    # 3. Trả về collection (Tên collection nên khớp với lúc ông Ingest data)
    return _client.get_or_create_collection(
        name="products", 
        embedding_function=_emb_fn
    )