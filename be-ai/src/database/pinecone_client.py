from pinecone import Pinecone
import time
from core.config import settings
from google import genai
from google.genai.errors import ClientError

# Khởi tạo các biến global
_pc_client = None
_index = None
_emb_fn = None

class PineconeInferenceHelper:
    def __init__(self, api_key: str, model_name: str):
        self.pc = Pinecone(api_key=api_key)
        self.model_name = model_name

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        """Tạo embedding cho danh sách văn bản (hỗ trợ batching)."""
        batch_size = 90
        embeddings = []
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            print(f"    Đang tạo embedding cho batch {i//batch_size + 1}...", end="\r")
            response = self.pc.inference.embed(
                model=self.model_name,
                inputs=batch,
                parameters={"dimension": 768, "input_type": "passage", "truncate": "END"}
            )
            embeddings.extend([e['values'] for e in response])
        print(f"    Đã tạo xong embedding cho {len(texts)} sản phẩm!            ")
        return embeddings

    def embed_query(self, text: str) -> list[float]:
        """Tạo embedding cho câu truy vấn."""
        response = self.pc.inference.embed(
            model=self.model_name,
            inputs=[text],
            parameters={"dimension": 768, "input_type": "query", "truncate": "END"}
        )
        return response[0]['values']

def get_pinecone_index():
    global _pc_client, _index
    if _pc_client is None:
        _pc_client = Pinecone(api_key=settings.PINECONE_API_KEY)
        _index = _pc_client.Index(settings.PINECONE_INDEX_NAME)
    return _index

def get_embedding_helper():
    global _emb_fn
    if _emb_fn is None:
        _emb_fn = PineconeInferenceHelper(
            api_key=settings.PINECONE_API_KEY,
            model_name=settings.EMBEDDING_MODEL
        )
    return _emb_fn
