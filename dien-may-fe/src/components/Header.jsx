import React, { useEffect, useState, useContext, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Header.scss";
import CategoryMenu from "./CategoryMenu.jsx";
import { getCategories } from "../services/categoryService.js";
import { UserContext } from "../context/UserContext.jsx"; // Import Context
import { logoutUser } from "../services/userService.js"; // Import hàm logout API
import { getCartApi } from "../services/cartService.js"; // Import API lấy giỏ hàng
import { toast } from "react-toastify";
import { getUserOrdersApi } from "../services/userOrderService.js";
import { getSearchSuggestionsApi } from "../services/product.api.js";

// Debounce utility function
const debounce = (func, delay) => {
    let timeout;
    return function executed(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, delay);
    };
};

function Header() {
    const [categories, setCategories] = useState([]);
    const { user, logoutContext, cartCount, setCartCount } = useContext(UserContext); // Lấy thêm setCartCount
    const navigate = useNavigate();
    const location = useLocation();
    const [activeOrderCount, setActiveOrderCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchSuggestions, setSearchSuggestions] = useState([]); // Gợi ý tìm kiếm
    const [showSuggestions, setShowSuggestions] = useState(false); // Hiển thị/ẩn gợi ý

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await getCategories();
                setCategories(res.DT || []);
            } catch (err) {
                console.error("Lỗi header fetch:", err);
            }
        };
        fetchCategories();
    }, []);

    // Lấy số lượng giỏ hàng thực tế từ DB mỗi khi tải trang (F5) hoặc vừa đăng nhập
    useEffect(() => {
        const fetchCartCount = async () => {
            if (user && user.auth && setCartCount) {
                try {
                    let res = await getCartApi();
                    if (res && res.EC === 0) {
                        // Cộng dồn tổng số lượng các sản phẩm đang có trong giỏ
                        let totalQty = res.DT.reduce((sum, item) => sum + item.quantity, 0);
                        setCartCount(totalQty);
                    }
                } catch (error) {
                    console.error("Lỗi đếm giỏ hàng:", error);
                    if (error?.response?.status === 401) {
                        logoutContext();
                    }
                }
            }
        };
        fetchCartCount();
    }, [user]); // Chạy lại mỗi khi user thay đổi (đăng nhập/đăng xuất)

    // Lấy số lượng đơn hàng đang xử lý/chờ giao
    useEffect(() => {
        const fetchOrderCount = async () => {
            if (user && user.auth) {
                try {
                    let res = await getUserOrdersApi();
                    if (res && res.EC === 0) {
                        let activeCount = res.DT.filter(o => ['pending', 'processing', 'shipped'].includes(o.order_status)).length;
                        setActiveOrderCount(activeCount);
                    }
                } catch (error) {
                    console.error("Lỗi đếm đơn hàng:", error);
                    if (error?.response?.status === 401) {
                        logoutContext();
                    }
                }
            } else {
                setActiveOrderCount(0);
            }
        };
        fetchOrderCount();
    }, [user, location.pathname]); // Cập nhật lại khi đăng nhập hoặc chuyển trang

    const handleLogout = async () => {
        try {
            let res = await logoutUser(); // Gọi API xóa cookie ở Backend
            if (res && +res.EC === 0) {
                logoutContext(); // Xóa data trong Context ở Frontend
                toast.success("Đăng xuất thành công!");
                navigate("/login");
            } else {
                toast.error(res.EM || "Lỗi khi đăng xuất");
            }
        } catch (error) {
            console.error(error);
            if (error?.response?.status === 401) {
                logoutContext();
                toast.success("Đăng xuất thành công!");
                navigate("/login");
            } else {
                toast.error("Lỗi kết nối server!");
            }
        }
    };

    // Hàm gọi API gợi ý tìm kiếm (debounced)
    const fetchSuggestions = useCallback(
        debounce(async (keyword) => {
            if (keyword.trim().length > 0) {
                try {
                    const res = await getSearchSuggestionsApi(keyword.trim());
                    if (res && res.EC === 0) {
                        setSearchSuggestions(res.DT || []);
                        setShowSuggestions(true);
                    } else {
                        setSearchSuggestions([]);
                        setShowSuggestions(false);
                    }
                } catch (error) {
                    console.error("Lỗi fetch suggestions:", error);
                    setSearchSuggestions([]);
                    setShowSuggestions(false);
                }
            } else {
                setSearchSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300), // Debounce 300ms
        []
    );

    // Xử lý thay đổi input tìm kiếm
    const handleSearchInputChange = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
        fetchSuggestions(value); // Gọi hàm debounced
    };

    // Xử lý sự kiện tìm kiếm
    const handleSearch = (e) => {
        navigate(`/search?keyword=${encodeURIComponent(searchQuery.trim())}`);
        setShowSuggestions(false); // Ẩn gợi ý khi tìm kiếm
    };

    return (
        <header className="main-header">
            {/* Top bar */}
            <div className="top-bar text-center py-1">
                <Link to="/promotion">
                    Mua đồ điện tử tới ngay Điện Máy HĐ
                </Link>
            </div>

            {/* Main navbar */}
            <nav className="navbar navbar-expand-lg sticky-top py-2">
                <div className="container px-0">
                    <Link className="navbar-brand" to="/">Điện Máy HĐ</Link>

                    <div className="category-wrapper">
                        <div className="btn category-btn">
                            <i className="bi bi-grid-fill me-2"></i>
                            Danh mục
                            <CategoryMenu data={categories} />
                        </div>
                    </div>

                    {/* Search */}
                    <div className="flex-grow-1 mx-3">
                        <div className="input-group position-relative"> {/* Thêm position-relative */}
                            <span
                                className="input-group-text bg-white border-0"
                                style={{ cursor: 'pointer' }}
                                onClick={handleSearch}
                            >
                                <i className="bi bi-search"></i>
                            </span>
                            <input
                                type="text"
                                className="form-control border-0"
                                placeholder="Bạn muốn mua gì hôm nay?"
                                value={searchQuery}
                                onChange={handleSearchInputChange} // Dùng hàm mới
                                onKeyDown={handleSearch}
                                onFocus={() => searchQuery.trim().length > 0 && searchSuggestions.length > 0 && setShowSuggestions(true)} // Hiện gợi ý khi focus
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 100)} // Ẩn gợi ý khi blur (có delay để click vào gợi ý)
                            />
                            {showSuggestions && searchSuggestions.length > 0 && (
                                <div className="search-suggestions dropdown-menu show w-100 position-absolute" style={{ top: '100%', left: 0, zIndex: 1000 }}>
                                    {searchSuggestions.map(product => (
                                        <Link
                                            key={product.id}
                                            to={`/product/${product.slug}`}
                                            className="dropdown-item d-flex align-items-center py-2"
                                            onClick={() => setShowSuggestions(false)} // Ẩn gợi ý khi click
                                        >
                                            <img src={product.thumbnailUrl || "https://via.placeholder.com/50"} alt={product.name} style={{ width: '40px', height: '40px', objectFit: 'contain', marginRight: '10px' }} />
                                            <span>{product.name}</span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Utilities */}
                    <div className="d-flex align-items-center">
                        <Link to="/order-history" className="position-relative me-3 text-center text-decoration-none text-dark">
                            <i className="bi bi-box-seam fs-4"></i>
                            {activeOrderCount > 0 && (
                                <span className="badge bg-danger text-white position-absolute top-0 start-100 translate-middle rounded-pill border border-light">
                                    {activeOrderCount}
                                </span>
                            )}
                            <div className="small">Đơn hàng</div>
                        </Link>

                        <Link to="/cart" className="position-relative me-3 text-center text-decoration-none text-dark">
                            <i className="bi bi-cart3 fs-4"></i>
                            <span className="badge bg-warning text-dark position-absolute top-0 start-100 translate-middle">
                                {cartCount || 0}
                            </span>
                            <div className="small">Giỏ hàng</div>
                        </Link>

                        {/* Logic hiển thị Auth */}
                        <div className="auth-section">
                            {user && user.auth === true ? (
                                <div className="dropdown">
                                    <button
                                        className="btn btn-outline-custom dropdown-toggle border-0 d-flex align-items-center"
                                        type="button"
                                        id="userMenu"
                                        data-bs-toggle="dropdown"
                                        aria-expanded="false"
                                    >
                                        <i className="bi bi-person-circle me-2 fs-5"></i>
                                        <span className="me-1">Xin chào,</span>
                                        <strong className="text-primary">{user.userName} </strong>
                                    </button>

                                    <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2" aria-labelledby="userMenu">
                                        <li>
                                            <Link className="dropdown-item py-2" to="/profile">
                                                <i className="bi bi-person me-2"></i>Thông tin cá nhân
                                            </Link>
                                        </li>
                                        {user.roles && user.roles.includes("ADMIN") && (
                                            <li>
                                                <Link className="dropdown-item py-2 text-primary" to="/admin">
                                                    <i className="bi bi-shield-lock me-2"></i>Quản trị Admin
                                                </Link>
                                            </li>
                                        )}
                                        <li><hr className="dropdown-divider" /></li>
                                        <li>
                                            <button className="dropdown-item py-2 text-danger" onClick={handleLogout}>
                                                <i className="bi bi-box-arrow-right me-2"></i>Đăng xuất
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            ) : (
                                <div className="auth-buttons">
                                    <Link to="/login" className="btn btn-outline-custom me-2">
                                        Đăng nhập
                                    </Link>
                                    <Link to="/register" className="btn btn-outline-custom register-btn">
                                        Đăng ký
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    );
}

export default Header;