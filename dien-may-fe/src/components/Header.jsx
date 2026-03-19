import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Header.scss";
import CategoryMenu from "./CategoryMenu.jsx";
import { useEffect, useState, useContext } from "react"; // Thêm useContext
import { getCategories } from "../services/categoryService.js";
import { UserContext } from "../context/UserContext.jsx"; // Import Context
import { logoutUser } from "../services/userService.js"; // Import hàm logout API
import { getCartApi } from "../services/cartService.js"; // Import API lấy giỏ hàng
import { toast } from "react-toastify";
import { getUserOrdersApi } from "../services/userOrderService.js";

function Header() {
    const [categories, setCategories] = useState([]);
    const { user, logoutContext, cartCount, setCartCount } = useContext(UserContext); // Lấy thêm setCartCount
    const navigate = useNavigate();
    const location = useLocation();
    const [activeOrderCount, setActiveOrderCount] = useState(0);

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
            toast.error("Lỗi kết nối server!");
        }
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