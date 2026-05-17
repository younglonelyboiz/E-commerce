"""
Repository Layer: Product data access (READ-ONLY).
Chỉ SELECT từ bảng products + product_images.
"""
from database.mysql_client import get_connection


class ProductRepository:
    def get_products_by_ids(self, product_ids: list) -> list:
        """
        Lấy thông tin sản phẩm (giá, tồn kho, thumbnail) theo danh sách ID.
        JOIN với product_images để lấy ảnh thumbnail.
        Chỉ lấy sản phẩm active, chưa bị xóa.

        Returns:
            list[dict]: [{id, name, slug, regular_price, discount_price, quantity, thumbnail}]
        """
        if not product_ids:
            return []

        # Đảm bảo ids là integer (phòng chống injection)
        safe_ids = [int(pid) for pid in product_ids if str(pid).isdigit()]
        if not safe_ids:
            return []

        placeholders = ", ".join(["%s"] * len(safe_ids))

        query = f"""
            SELECT
                p.id,
                p.name,
                p.slug,
                p.regular_price,
                p.discount_price,
                p.quantity,
                pi.url AS thumbnail
            FROM products p
            LEFT JOIN product_images pi
                ON pi.product_id = p.id AND pi.is_thumbnail = 1
            WHERE
                p.id IN ({placeholders})
                AND p.status = 'active'
            LIMIT 5
        """

        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, safe_ids)
                rows = cursor.fetchall()

        # Convert Decimal → float để JSON serializable
        products = []
        for row in rows:
            products.append({
                "id": row["id"],
                "name": row["name"],
                "slug": row["slug"],
                "regular_price": float(row["regular_price"] or 0),
                "discount_price": float(row["discount_price"] or 0),
                "quantity": row["quantity"] or 0,
                "thumbnail": row["thumbnail"],
            })

        return products
