import chromadb
from sentence_transformers import SentenceTransformer
import google.generativeai as genai
from src.core.config import settings

def test():
    try:
        # Check Embedding
        model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
        print(" Sentence Transformers: OK")
        
        # Check Chroma
        client = chromadb.PersistentClient(path="./test_db")
        print(" ChromaDB: OK")
        
        # Check Gemini (Chỉ check xem thư viện có load được không)
        print(" Google Generative AI: OK")
        
    except Exception as e:
        print(f" Lỗi: {e}")

if __name__ == "__main__":
    test()