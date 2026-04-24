# src/api/chat.py
from fastapi import APIRouter, Request

router = APIRouter()

@router.post("/chat")
async def chat(request: Request, payload: dict):
    question = payload.get("question")
    history = payload.get("history", []) # Nhận thêm history từ Node.js
    
    # Lấy service từ state đã khởi tạo ở main.py (như tôi hướng dẫn lúc nãy)
    service = request.app.state.rag_service
    
    return await service.get_answer(question, history)