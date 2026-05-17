"""
Database Layer: MySQL/MariaDB connection pool (READ-ONLY)
FastAPI chỉ có quyền SELECT — không INSERT/UPDATE/DELETE.
"""
import pymysql
import pymysql.cursors
from core.config import settings


def get_connection():
    """
    Tạo một kết nối mới tới MariaDB.
    Dùng DictCursor để kết quả trả về là list[dict] thay vì tuple.
    READ-ONLY: FastAPI không có quyền ghi vào DB này.
    """
    return pymysql.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        database=settings.DB_NAME,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        # Đảm bảo không thể ghi dữ liệu (defense in depth)
        autocommit=True,
    )
