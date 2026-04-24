from database.chroma_client import get_collection

class VectorRepository:
    def __init__(self):
        self.collection = get_collection()

    def search_similar(self, query_text: str, n_results: int = 15):
        return self.collection.query(query_texts=[query_text], n_results=n_results)