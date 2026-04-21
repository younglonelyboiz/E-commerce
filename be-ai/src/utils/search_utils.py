import re

def simple_rerank(query: str, results: dict):
    # 1. Trích xuất các số quan trọng (đời máy: 17, 16...)
    query_numbers = re.findall(r'\b\d+\b', query.lower())
    query_lower = query.lower()
    
    docs = results['documents'][0]
    metas = results['metadatas'][0]
    combined = []

    for d, m in zip(docs, metas):
        score = 0
        
        # TÁCH TÊN SẢN PHẨM:
        # Dựa vào format ông nạp: "Sản phẩm: iPhone 17 Pro Max. Danh mục: ..."
        # Ta lấy đoạn nằm giữa "Sản phẩm: " và ". Danh mục:"
        try:
            # Cách tách an toàn:
            product_part = d.split("Danh mục:")[0] # Lấy phần trước Danh mục
            product_name = product_part.replace("Sản phẩm:", "").strip().lower()
        except:
            product_name = d.lower() # Fallback nếu format lạ

        # --- LOGIC RERANK CHỈ TRÊN TÊN ---
        
        # 1. Khớp số đời máy (17, 16, 15...)
        for num in query_numbers:
            if re.search(r'\b' + num + r'\b', product_name):
                score += 100  # Ưu tiên cực cao cho đúng đời máy
        
        # 2. Khớp dòng máy (Pro Max, Plus, Ultra...)
        keywords = ['pro max', 'promax', 'plus', 'ultra', 'mini', 'pro']
        for kw in keywords:
            if kw in query_lower and kw in product_name:
                score += 50
        
        combined.append({"doc": d, "meta": m, "score": score})

    # 2. Sắp xếp lại danh sách
    # Thằng nào score cao lên đầu. Nếu bằng score, giữ nguyên thứ tự của ChromaDB
    sorted_res = sorted(combined, key=lambda x: x['score'], reverse=True)
    
    return [x['doc'] for x in sorted_res], [x['meta'] for x in sorted_res]