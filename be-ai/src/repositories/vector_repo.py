from database.pinecone_client import get_pinecone_index, get_embedding_helper

class VectorRepository:
    def __init__(self):
        self.index = get_pinecone_index()
        self.embedding_helper = get_embedding_helper()

    def search_similar(self, query_text: str, n_results: int = 15):
        # 1. Tạo embedding cho câu query
        query_vector = self.embedding_helper.embed_query(query_text)
        
        # 2. Truy vấn Pinecone
        response = self.index.query(
            vector=query_vector,
            top_k=n_results,
            include_metadata=True
        )
        
        # Trả về kết quả trực tiếp từ Pinecone
        return response