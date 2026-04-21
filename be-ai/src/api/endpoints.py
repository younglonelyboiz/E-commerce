from fastapi import APIRouter, Depends
from src.services.rag_service import RAGService

router = APIRouter()

@router.post("/chat")
async def chat(payload: dict, service: RAGService = Depends()):
    question = payload.get("question")
    return await service.get_answer(question)