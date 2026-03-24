import React, { useContext } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import './AdminLayout.scss';
import { UserContext } from '../context/UserContext';

const AdminLayout = () => {

    const { logoutContext } = useContext(UserContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logoutContext(); // Xóa context
        navigate('/login'); // Chuyển hướng về trang login
    };

    return (
        <div className="admin-container">
            {/* SIDEBAR BÊN TRÁI */}
            <aside className="admin-sidebar">
                <div className="sidebar-brand">
                    <h4 className="m-0">ADMIN </h4>
                </div>
                <nav className="sidebar-nav">
                    <NavLink to="/admin" end className="nav-item">
                        <i className="bi bi-speedometer2 me-2"></i> Dashboard
                    </NavLink>
                    <NavLink to="/admin/products" className="nav-item">
                        <i className="bi bi-box-seam me-2"></i> Sản phẩm
                    </NavLink>
                    <NavLink to="/admin/orders" className="nav-item">
                        <i className="bi bi-cart-check me-2"></i> Đơn hàng
                    </NavLink>
                    <NavLink to="/admin/users" className="nav-item">
                        <i className="bi bi-people me-2"></i> Users
                    </NavLink>
                    <NavLink to="/admin/reviews" className="nav-item">
                        <i className="bi bi-star me-2"></i> Đánh giá
                    </NavLink>
                    <NavLink to="/admin/chat" className="nav-item">
                        <i className="bi bi-chat-dots me-2"></i> Tin nhắn
                    </NavLink>
                </nav>
                <div className="sidebar-footer">
                    <Link to="/" className="nav-item text-warning">
                        <i className="bi bi-house-door me-2"></i> Về trang chủ
                    </Link>
                </div>
            </aside>

            {/* NỘI DUNG CHÍNH BÊN PHẢI */}
            <main className="admin-main">
                <header className="admin-topbar shadow-sm">
                    <div className="d-flex align-items-center">
                        {/* <i className="bi bi-list fs-4 me-3"></i> */}
                        <span className="fw-bold">Hệ thống quản trị Điện Máy</span>
                    </div>
                    <div className="admin-user-info">
                        <span className="me-2">Xin chào, Admin</span>
                        <i className="bi bi-person-circle fs-5"></i>

                        <div className="logout-button" onClick={handleLogout} title='Đăng xuất'>
                            <i className="bi bi-box-arrow-right ms-3 fs-5 text-danger"></i>
                        </div>
                    </div>
                </header>

                <div className="admin-content p-4">
                    <Outlet /> {/* Nơi hiển thị AdminProduct, AdminDashboard... */}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;