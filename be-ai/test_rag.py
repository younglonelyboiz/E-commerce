import asyncio
from src.services.rag_service import RAGService

async def test():
    service = RAGService()
    print("🤖 Đang hỏi Bot...")
    result = await service.get_answer("Tôi muốn mua iphone 17 promax")
    
    print("\n--- CÂU TRẢ LỜI ---")
    print(result['answer'])
    print("\n--- SẢN PHẨM GỢI Ý (ID) ---")
    print(result['source_products'])

if __name__ == "__main__":
    asyncio.run(test())