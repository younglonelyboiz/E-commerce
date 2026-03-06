import { Link } from "react-router-dom";
import "./CategoryMenu.scss";

// Nhận props từ Header: data (danh sách category phẳng)
function CategoryMenu({ data = [] }) {

    // Nếu data không tồn tại hoặc rỗng, không hiển thị gì cả
    if (!data || data.length === 0) return null;

    return (
        <div className="category-menu-container">
            <ul className="parent-list">
                {data.map(category => (
                    <li key={category.id} className="parent-item">
                        <div className="parent-content">
                            <Link to={`/category/${category.id}`} className="parent-link">
                                {category.name}
                            </Link>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default CategoryMenu;