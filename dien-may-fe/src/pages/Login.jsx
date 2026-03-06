import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Login.scss';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [showPass, setShowPass] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Đăng nhập:", formData);
        // Logic gọi API login tại đây
    };

    return (
        <div className="login-page">
            <div className="login-card">

                {/* Header */}
                <div className="text-center mb-4">
                    <h3 className="login-title">Đăng nhập</h3>
                    <p className="text-muted">Chào mừng bạn quay trở lại!</p>
                </div>

                {/* Social Login */}
                <div className="social-group">
                    <button className="btn-social google">
                        <i className="bi bi-google"></i>
                        <span>Google</span>
                    </button>
                    <button className="btn-social facebook">
                        <i className="bi bi-facebook"></i>
                        <span>Facebook</span>
                    </button>
                </div>

                <div className="divider">
                    <span>Hoặc đăng nhập bằng email</span>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="login-form">

                    {/* Email */}
                    <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input
                            type="text"
                            className="custom-input"
                            placeholder="Nhập email của bạn"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Mật khẩu */}
                    <div className="mb-3">
                        <label className="form-label d-flex justify-content-between">
                            Mật khẩu
                        </label>
                        <div className="input-wrapper">
                            <input
                                type={showPass ? "text" : "password"}
                                className="custom-input"
                                placeholder="Nhập mật khẩu"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                            <span className="eye-icon" onClick={() => setShowPass(!showPass)}>
                                <i className={`bi ${showPass ? 'bi-eye' : 'bi-eye-slash'}`}></i>
                            </span>
                        </div>
                    </div>

                    {/* Quên mật khẩu & Ghi nhớ */}
                    <div className="d-flex justify-content-between align-items-center mb-4 options-group">
                        <Link to="/forgot-password" class="forgot-link">Quên mật khẩu?</Link>
                    </div>

                    {/* Button Submit */}
                    <button type="submit" className="btn-login-submit">
                        Đăng nhập
                    </button>
                </form>

                {/* Footer Link chuyển sang Đăng Ký */}
                <div className="login-footer mt-4 text-center">
                    Bạn chưa có tài khoản? <Link to="/register" className="register-link">Đăng ký ngay</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;