from fastapi import FastAPI
from contextlib import asynccontextmanager
from api.endpoints import router as chat_router
from services.rag_service import RAGService

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- KHỞI ĐỘNG: Nạp model vào RAM ---
    print(" Đang khởi động AI Service & Nạp MiniLM Model...")
    # Khởi tạo và lưu trực tiếp vào app.state luôn cho chắc
    app.state.rag_service = RAGService() 
    
    yield
    # --- TẮT MÁY ---
    print("Shutting down AI Service...")

# Khởi tạo App với lifespan
app = FastAPI(title="Dien May AI Service", lifespan=lifespan)

# Kết nối Router
app.include_router(chat_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "AI Service is online!"}