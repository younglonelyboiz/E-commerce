import json
import os
import sys

# Để script hiểu được folder src
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from src.database.chroma_client import get_collection

def main():
    # Sửa lại đường dẫn nếu file JSON nằm ngoài root
    json_path = os.path.join(os.path.dirname(__file__), '..', 'RAGWEB.json')
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    collection = get_collection()
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
    
    # Dùng upsert để nếu chạy lại nó sẽ cập nhật chứ không ghi đè trùng
    collection.upsert(
        documents=documents, 
        ids=ids,
        metadatas=metadatas
    )
    print(f" Đã nạp thành công {len(documents)} sản phẩm vào Vector DB!")

if __name__ == "__main__":
    main()