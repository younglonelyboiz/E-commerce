import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.scss';
import { loginApi, getGoogleAuthUrlApi, quickLoginApi } from '../services/userService';
import { toast } from 'react-toastify';
import { UserContext } from '../context/UserContext';

const Login = () => {
    const navigate = useNavigate();
    const { loginContext } = useContext(UserContext);

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { email, password } = formData;

        if (!email || !password) {
            toast.error("Vui lòng nhập đầy đủ thông tin!");
            return;
        }

        try {
            setLoading(true);
            let res = await loginApi(email, password);
            if (res && +res.EC === 0) {
                loginContext(res.DT);
                toast.success("Đăng nhập thành công!");

                if (res.DT.roles && res.DT.roles.includes("ADMIN")) {
                    navigate("/admin");
                } else {
                    navigate("/");
                }
            } else {
                toast.error(res.EM || "Đăng nhập thất bại!");
            }
        } catch (error) {
            console.error(">>> Login Error:", error);
            toast.error("Lỗi kết nối server!");
        } finally {
            setLoading(false);
        }
    };

    // Quick Login Handler
    const handleQuickLogin = async (accountType) => {
        try {
            setLoading(true);
            let res = await quickLoginApi(accountType);

            if (res && +res.EC === 0) {
                loginContext(res.DT);
                toast.success(`Đăng nhập ${accountType === 'admin' ? 'Admin' : 'Khách hàng'} thành công!`);

                if (res.DT.roles && res.DT.roles.includes("ADMIN")) {
                    navigate("/admin");
                } else {
                    navigate("/");
                }
            } else {
                toast.error(res.EM || "Đăng nhập thất bại!");
            }
        } catch (error) {
            console.error(">>> Quick Login Error:", error);
            toast.error("Lỗi kết nối server!");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            let res = await getGoogleAuthUrlApi();
            if (res && +res.EC === 0 && res.DT) {
                window.location.href = res.DT;
            } else {
                toast.error("Không thể kết nối Server Google OAuth!");
            }
        } catch (error) {
            toast.error("Lỗi hệ thống khi gọi Google Auth!");
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="text-center mb-4">
                    <h3 className="login-title">Đăng nhập</h3>
                    <p className="text-muted">Chào mừng bạn quay trở lại!</p>
                </div>

                <div className="social-group">
                    <button className="btn-social google" type="button" onClick={handleGoogleLogin} disabled={loading}>
                        <i className="fa-brands fa-google"></i>
                        <span>Google</span>
                    </button>
                    <button className="btn-social facebook" type="button" disabled={loading}>
                        <i className="fa-brands fa-facebook"></i>
                        <span>Facebook</span>
                    </button>
                </div>

                <div className="divider">
                    <span>Hoặc đăng nhập bằng tài khoản đã được đăng kí</span>
                </div>

                {/* Quick Login Buttons */}
                <div className="quick-login-section mb-4">
                    <p className="text-muted small mb-2">Đăng nhập nhanh (dùng thử):</p>
                    <div className="d-flex gap-2">
                        <button
                            type="button"
                            className="btn btn-outline-primary flex-grow-1 btn-sm quick-login-btn"
                            onClick={() => handleQuickLogin('user')}
                            disabled={loading}
                            title="Tài khoản khách hàng"
                        >
                            <i className="bi bi-person-circle me-1"></i>
                            {loading ? "Đang tải..." : "Khách hàng"}
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-danger flex-grow-1 btn-sm quick-login-btn"
                            onClick={() => handleQuickLogin('admin')}
                            disabled={loading}
                            title="Tài khoản quản trị"
                        >
                            <i className="bi bi-shield-lock me-1"></i>
                            {loading ? "Đang tải..." : "Admin"}
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input
                            type="text"
                            className="custom-input"
                            placeholder="Nhập email của bạn"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Mật khẩu</label>
                        <div className="input-wrapper">
                            <input
                                type={showPass ? "text" : "password"}
                                className="custom-input"
                                placeholder="Nhập mật khẩu"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                disabled={loading}
                                required
                            />
                            <span
                                className="eye-icon"
                                onClick={() => setShowPass(!showPass)}
                                style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
                            >
                                <i className={`bi ${showPass ? 'bi-eye' : 'bi-eye-slash'}`}></i>
                            </span>
                        </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mb-4 options-group">
                        <Link to="/forgot-password" title="Quên mật khẩu?" className="forgot-link">Quên mật khẩu?</Link>
                    </div>

                    <button type="submit" className="btn-login-submit" disabled={loading}>
                        {loading ? "Đang xử lý..." : "Đăng nhập"}
                    </button>
                </form>

                <div className="login-footer mt-4 text-center">
                    Bạn chưa có tài khoản? <Link to="/register" className="register-link">Đăng ký ngay</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;