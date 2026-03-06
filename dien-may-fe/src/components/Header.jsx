import { Link } from "react-router-dom";
import "./Header.scss";
import CategoryMenu from "./CategoryMenu.jsx";
import { useEffect, useState } from "react";
import { getCategories } from "../services/categoryService.js";

function Header() {
    const [categories, setCategories] = useState([]);

    // 2. Gọi API ở đây (chỉ chạy 1 lần khi Header mount)
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await getCategories();
                // Giả sử res.DT là mảng danh mục
                setCategories(res.DT || []);
            } catch (err) {
                console.error("Lỗi header fetch:", err);

            }
        };

        fetchCategories();
    }, []);
    return (
        <header className="main-header">
            {/* Top bar */}
            <div className="top-bar text-center py-1">
                <Link to="/promotion">
                    Tết "ANT" 2026 sắp trở lại - Đăng ký ngay!
                </Link>
            </div>

            {/* Main navbar */}
            <nav className="navbar navbar-expand-lg sticky-top py-2">
                <div className="container px-0">
                    {/* Logo */}
                    <Link className="navbar-brand" to="/">
                        Điện Máy HĐ
                    </Link>

                    <div className="category-wrapper">
                        {/* Lưu ý: Button chứa div là không hợp lệ HTML, nhưng tạm thời giữ logic của bạn */}
                        <div className="btn category-btn">
                            <i className="bi bi-grid-fill me-2"></i>
                            Danh mục

                            {/* 3. Truyền dữ liệu xuống CategoryMenu */}
                            <CategoryMenu
                                data={categories}
                            />
                        </div>
                    </div>



                    {/* Search */}
                    <div className="flex-grow-1 mx-3">
                        <div className="input-group">
                            <span className="input-group-text bg-white border-0">
                                <i className="bi bi-search"></i>
                            </span>
                            <input
                                type="text"
                                className="form-control border-0"
                                placeholder="Bạn muốn mua gì hôm nay?"
                            />
                        </div>
                    </div>

                    {/* Utilities */}
                    <div className="d-flex align-items-center">
                        <Link to="/cart" className="position-relative me-3 text-center">
                            <i className="bi bi-cart3 fs-4"></i>
                            <span className="badge bg-warning text-dark position-absolute top-0 start-100 translate-middle">
                                0
                            </span>
                            <div className="small">Giỏ hàng</div>
                        </Link>

                        {/* Sửa nút Đăng nhập ở đây */}
                        <div className="auth-buttons">
                            <Link to="/login" className="btn btn-outline-custom me-2">
                                Đăng nhập
                            </Link>
                            <Link to="/register" className="btn btn-outline-custom me-2 register-btn">
                                Đăng ký
                            </Link>
                        </div>
                    </div>


                </div>
            </nav>


        </header >
    );
}

export default Header;
