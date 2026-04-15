import pandas as pd
import json
import re
import random
import glob
import os
from datetime import datetime, timedelta

# --- CẤU HÌNH ---
FOLDER_PATH = './dataCellPhone/'
MAJOR_BRANDS = ["Apple", "Samsung", "Xiaomi", "Oppo", "Honor", "Huawei"]

def clean_price(price_str):
    if not price_str: return 0
    cleaned = re.sub(r'\D', '', str(price_str))
    return int(cleaned) if cleaned else 0

def get_random_date():
    start = datetime(2025, 1, 1)
    end = datetime.now()
    return start + timedelta(days=random.randint(0, max(0, (end - start).days)))

def run_etl():
    json_files = glob.glob(os.path.join(FOLDER_PATH, "*.json"))
    
    # 1. Tạo bảng Brands
    brands_data = []
    brand_map = {name: i+1 for i, name in enumerate(MAJOR_BRANDS)}
    brand_map["Khác"] = len(MAJOR_BRANDS) + 1
    for name, b_id in brand_map.items():
        brands_data.append({"id": b_id, "name": name, "slug": name.lower()})

    products, users, orders, order_products, reviews, product_images = [], [], [], [], [], []
    user_tracker = {} 
    global_p_id = 0

    # 2. Xử lý từng file JSON
    for file_path in json_files:
        with open(file_path, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
            except: continue

            for item in data:
                global_p_id += 1
                p_id = global_p_id
                des1, des2 = item.get('des1', {}), item.get('des2', {})
                p_name = des1.get('name', 'Sản phẩm không tên')
                
                # Logic xác định Brand
                current_brand_id = brand_map["Khác"]
                for b in MAJOR_BRANDS:
                    if b.lower() in p_name.lower() or (b == "Apple" and "iPhone" in p_name):
                        current_brand_id = brand_map[b]
                        break

                s_price = clean_price(des1.get('sale_price'))
                qty = random.randint(0, 50) 
                
                # --- GIỮ NGUYÊN FULL SPECS Ở ĐÂY ---
                full_specs_json = json.dumps(des2.get('full_specs', {}), ensure_ascii=False)

                products.append({
                    "id": p_id,
                    "sku": f"SP-{p_id:05d}",
                    "name": p_name,
                    "slug": item.get('url', '').split('/')[-1].replace('.html', '') + f"-{p_id}",
                    "description": full_specs_json, # <--- ĐÂY LÀ NƠI LƯU FULL SPECS
                    "regular_price": clean_price(des1.get('original_price')) or s_price,
                    "discount_price": s_price,
                    "quantity": qty,
                    "brand_id": current_brand_id,
                    "status": 'active' if qty > 0 else 'out_of_stock'
                })

                # --- XỬ LÝ ẢNH (Bỏ qua ảnh placeholder) ---
                raw_images = des2.get('images', [])
                thumbnail = des1.get('thumbnail', '')
                if thumbnail:
                    product_images.append({"product_id": p_id, "url": thumbnail, "is_thumbnail": 1})
                
                for img_url in raw_images:
                    if "placehoder.png" in img_url or img_url == thumbnail: continue
                    product_images.append({"product_id": p_id, "url": img_url, "is_thumbnail": 0})

                # Review -> Tạo Đơn hàng giả lập cho Dashboard
                for rev in item.get('reviews', []):
                    u_name = rev.get('user') or "Khách ẩn danh"
                    if u_name not in user_tracker:
                        u_id = len(user_tracker) + 1
                        user_tracker[u_name] = u_id
                        users.append({"id": u_id, "user_name": u_name, "email": f"user{u_id}@gmail.com"})
                    
                    u_id = user_tracker[u_name]
                    o_id = len(orders) + 1
                    o_date = get_random_date()

                    orders.append({
                        "id": o_id, "code": f"ORD{o_id:05d}", "user_id": u_id, 
                        "grand_total": s_price, "order_date": o_date,
                        "payment_status": "paid", "order_status": "delivered", "payment_method": "VNPAY"
                    })
                    order_products.append({"order_id": o_id, "product_id": p_id, "name": p_name, "price": s_price, "quantity": 1, "subtotal": s_price})
                    reviews.append({"product_id": p_id, "user_id": u_id, "order_id": o_id, "rating": rev.get('stars', 5), "content": rev.get('content', ''), "created_at": o_date})

    # 3. Xuất CSV
    for name, df_list in [('brands', brands_data), ('products', products), ('users', users), 
                          ('orders', orders), ('order_products', order_products), 
                          ('reviews', reviews), ('product_images', product_images)]:
        pd.DataFrame(df_list).to_csv(f'{name}.csv', index=False, encoding='utf-8-sig')
    print(f"Xong! Đã xử lý {global_p_id} sản phẩm. Full Specs đã được lưu vào products.csv")

if __name__ == "__main__":
    run_etl()