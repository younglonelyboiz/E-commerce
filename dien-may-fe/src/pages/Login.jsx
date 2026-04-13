import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.scss';
import { loginApi } from '../services/userService';
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
            let res = await loginApi(email, password);
            console.log(res);
            if (res && +res.EC === 0) {
                // TRẠM DỪNG 3: Nhận res.DT (chứa userName từ DB) và đẩy vào kho
                loginContext(res.DT);

                toast.success("Đăng nhập thành công!");

                // Chuyển hướng dựa trên Role
                if (res.DT.roles && res.DT.roles.includes("ADMIN")) {
                    navigate("/admin");
                } else {
                    navigate("/");
                }
            } else {
                // Sửa lỗi: Chỉ hiện lỗi khi EC khác 0
                toast.error(res.EM || "Đăng nhập thất bại!");
            }
        } catch (error) {
            console.error(">>> Login Error:", error);
            toast.error("Lỗi kết nối server!");
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
                    <button className="btn-social google" type="button">
                        <i className="bi bi-google"></i>
                        <span>Google</span>
                    </button>
                    <button className="btn-social facebook" type="button">
                        <i className="bi bi-facebook"></i>
                        <span>Facebook</span>
                    </button>
                </div>

                <div className="divider">
                    <span>Hoặc đăng nhập bằng bằng tài khoản đã được đăng kí</span>
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
                                required
                            />
                            <span className="eye-icon" onClick={() => setShowPass(!showPass)}>
                                <i className={`bi ${showPass ? 'bi-eye' : 'bi-eye-slash'}`}></i>
                            </span>
                        </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mb-4 options-group">
                        <Link to="/forgot-password" title="Quên mật khẩu?" className="forgot-link">Quên mật khẩu?</Link>
                    </div>

                    <button type="submit" className="btn-login-submit">
                        Đăng nhập
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