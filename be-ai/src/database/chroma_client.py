import chromadb
import time
from chromadb.api.types import Documents, Embeddings, EmbeddingFunction
from core.config import settings
from google import genai
from google.genai.errors import ClientError

# Khởi tạo các biến global để lưu giữ kết nối
_client = None
_emb_fn = None

class GoogleGenAIEmbeddingFunction(EmbeddingFunction):
    def __init__(self, api_key: str, model_name: str):
        self.client = genai.Client(api_key=api_key)
        self.model_name = model_name
        # Giới hạn gói miễn phí: 100 requests/phút => nghỉ ~0.75s/request cho an toàn
        self.delay = 60.0 / 80  # 80 requests/phút để có margin

    def name(self) -> str:
        return "google_genai_embedding_function"

    def _embed_one(self, text: str, max_retries: int = 5) -> list:
        """Embed một đoạn văn bản, tự retry khi bị 429."""
        for attempt in range(max_retries):
            try:
                response = self.client.models.embed_content(
                    model=self.model_name,
                    contents=text
                )
                return response.embeddings[0].values
            except ClientError as e:
                if e.status_code == 429:
                    wait = 60 * (attempt + 1)  # 60s, 120s, 180s...
                    print(f"    [Rate Limit] Bị chặn, chờ {wait}s rồi thử lại (lần {attempt+1}/{max_retries})...")
                    time.sleep(wait)
                else:
                    raise
        raise RuntimeError(f"Vẫn bị 429 sau {max_retries} lần thử!")

    def __call__(self, input: Documents) -> Embeddings:
        return self._do_embed(input)

    def embed_query(self, input: Documents) -> Embeddings:
        return self._do_embed(input)

    def embed_documents(self, input: Documents) -> Embeddings:
        return self._do_embed(input)

    def _do_embed(self, input: Documents) -> Embeddings:
        embeddings = []
        total = len(input)
        for i, text in enumerate(input):
            print(f"    Đang embed sản phẩm {i+1}/{total}...", end="\r")
            embedding = self._embed_one(text)
            embeddings.append(embedding)
            # Nghỉ giữa các request để không vượt rate limit
            if i < total - 1:
                time.sleep(self.delay)
        print(f"    Đã embed xong {total} sản phẩm!            ")
        return embeddings

def get_collection():
    global _client, _emb_fn

    # 1. Chỉ khởi tạo Client một lần duy nhất
    if _client is None:
        _client = chromadb.PersistentClient(path=settings.CHROMA_DB_DIR)

    # 2. Khởi tạo Google Embedding Function (kèm rate limiter)
    if _emb_fn is None:
        print(" Loading Google GenAI Embedding Function (with rate limiter)...")
        _emb_fn = GoogleGenAIEmbeddingFunction(
            api_key=settings.GEMINI_API_KEY,
            model_name=settings.EMBEDDING_MODEL
        )

    # 3. Trả về collection
    return _client.get_or_create_collection(
        name="products",
        embedding_function=_emb_fn
    )
