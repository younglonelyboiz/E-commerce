import json
import os
import sys

# Để script hiểu được folder src
be_ai_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(be_ai_dir)
sys.path.append(os.path.join(be_ai_dir, 'src'))
from src.database.pinecone_client import get_pinecone_index, get_embedding_helper

def main():
    # Sửa lại đường dẫn nếu file JSON nằm ngoài root
    json_path = os.path.join(os.path.dirname(__file__), '..', 'RAGWEB.json')
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    index = get_pinecone_index()
    embedding_helper = get_embedding_helper()
    rows = data['rows']
    
    documents = []
    ids = []
    metadatas = [] # Thêm metadata để lưu ID và Category
    
    for item in rows:
        # CHỈ đưa những thông tin ít thay đổi vào content để AI học
        content = f"Sản phẩm: {item['product_name']}. Danh mục: {item['category_name']}. Thông số kỹ thuật: {item['specifications']}"
        
        documents.append(content)
        ids.append(str(item['id']))
        
        # Metadata giúp ông query ngược lại DB hoặc filter nhanh
        metadatas.append({
            "product_id": item['id'],
            "category": item['category_name'],
            "status": item['status']
        })
    
    # 1. Tạo embeddings cho tất cả documents
    print(" Dang tao embeddings cho san pham...")
    embeddings = embedding_helper.embed_documents(documents)
    
    # 2. Chuẩn bị dữ liệu cho Pinecone
    vectors_to_upsert = []
    for id_str, vector, document, meta in zip(ids, embeddings, documents, metadatas):
        meta_with_doc = dict(meta)
        meta_with_doc['text'] = document # Lưu document vào metadata
        vectors_to_upsert.append((id_str, vector, meta_with_doc))
        
    # 3. Upsert lên Pinecone
    print(" Dang day du lieu len Pinecone...")
    index.upsert(vectors=vectors_to_upsert)
    print(f" Da nap thanh cong {len(documents)} san pham vao Vector DB!")

if __name__ == "__main__":
    main()