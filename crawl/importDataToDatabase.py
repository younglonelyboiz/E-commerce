import pandas as pd
from sqlalchemy import create_engine
import os

# --- CẤU HÌNH ---
DB_NAME = "e-commerce"  # Tên Database của bạn
DB_USER = "root"
DB_PASS = ""
DB_HOST = "localhost"

# Thứ tự BẮT BUỘC: Cha trước - Con sau để không bị lỗi Foreign Key
FILES_TO_IMPORT = [
    {"file": "brands.csv", "table": "brands"},
    {"file": "users.csv", "table": "users"},
    {"file": "products.csv", "table": "products"},
    {"file": "product_images.csv", "table": "product_images"},
    {"file": "orders.csv", "table": "orders"},
    {"file": "order_products.csv", "table": "order_products"},
    {"file": "reviews.csv", "table": "reviews"}
]

def import_all_csv_to_mysql():
    try:
        # 1. Kết nối Database
        # Cần cài đặt: pip install mysql-connector-python sqlalchemy pandas
        connection_str = f"mysql+mysqlconnector://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}"
        engine = create_engine(connection_str)
        
        print(f"🔗 Đã kết nối tới Database: {DB_NAME}")

        for item in FILES_TO_IMPORT:
            file_path = item["file"]
            table_name = item["table"]

            if os.path.exists(file_path):
                print(f" Đang đọc file: {file_path}...")
                
                # Đọc CSV (Sử dụng utf-8-sig để nhận diện tiếng Việt từ script ETL trước)
                df = pd.read_csv(file_path, encoding='utf-8-sig')

                # GIỮ NGUYÊN ID: 
                # Script ETL của chúng ta đã tạo ID liên kết rất chặt chẽ giữa các bảng.
                # Nếu bạn xóa ID, các bảng như 'reviews' sẽ bị trỏ sai sản phẩm.
                
                print(f" Đang nạp {len(df)} dòng vào bảng '{table_name}'...")
                
                # if_exists='append': Thêm vào bảng đã có cấu trúc
                # index=False: Không lấy cột index mặc định của Pandas
                df.to_sql(name=table_name, con=engine, if_exists='append', index=False)
                
                print(f" Thành công bảng: {table_name}")
            else:
                print(f" Bỏ qua: Không tìm thấy file {file_path}")

        print("\n HOÀN TẤT: Toàn bộ dữ liệu đã được đưa vào MySQL XAMPP!")

    except Exception as e:
        print(f" Lỗi hệ thống: {e}")
        print(" Gợi ý: Hãy đảm bảo bạn đã chạy lệnh SQL tạo bảng trước khi chạy script này.")

if __name__ == "__main__":
    import_all_csv_to_mysql()