from fastapi import FastAPI
from src.api.chat import router as chat_router

app = FastAPI(title="Dien May AI Service")

# Kết nối API chat
app.include_router(chat_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "AI Service is online!"}