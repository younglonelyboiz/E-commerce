"""
API Layer: Chat endpoint.
Nhận request từ Node.js, validate bằng Pydantic, gọi RAGService.
"""
from fastapi import APIRouter, Request
from pydantic import BaseModel


class ChatRequest(BaseModel):
    question: str
    history: list = []  # [{role: "user"|"ai", content: "..."}]


router = APIRouter()


@router.post("/chat")
async def chat(request: Request, payload: ChatRequest):
    """
    Endpoint nhận câu hỏi từ Node.js và trả về câu trả lời từ AI.

    Node.js gửi:
        { "question": "...", "history": [...] }

    Trả về:
        { "answer": "...", "source_products": [...] }
    """
    service = request.app.state.rag_service
    return await service.get_answer(payload.question, payload.history)