import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
import './Register.scss';
import { registerNewUser } from '../services/userService.js';

const Register = () => {
    // State lưu dữ liệu form
    const [formData, setFormData] = useState({
        userName: '',
        dob: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    // State ẩn/hiện mật khẩu
    const [showPass, setShowPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);

    const navigate = useNavigate();

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const checkValidInput = () => {
        const { userName, email, password, confirmPassword } = formData;
        if (!userName || !email || !password || !confirmPassword) {
            return false;
        }
        return true;
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!checkValidInput()) {
            toast.error('Vui lòng nhập đầy đủ thông tin');
            return;
        }
        // Logic gọi API register tại đây
        let registerData = {
            email: formData.email,
            password: formData.password,
            confirmPassword: formData.confirmPassword,
            user_name: formData.userName,
        };
        let res = await registerNewUser(registerData);
        if (res && res.EC === 0) {
            toast.success(res.EM);
            // Reset form
            setFormData({
                userName: '',
                dob: '',
                phone: '',
                email: '',
                password: '',
                confirmPassword: '',
            });
            // Chuyển đến trang đăng nhập
            navigate('/login');
        } else {
            toast.error(res.EM || 'Đăng ký thất bại');
        }

    }

    return (
        <div className="register-container">
            <div className="register-content">

                {/* --- 1. SOCIAL REGISTER --- */}
                <div className="text-center mb-4">
                    <p className="text-secondary mb-3">Đăng ký bằng tài khoản mạng xã hội</p>
                    <div className="social-buttons">
                        <button className="btn-social google">
                            <i className="bi bi-google text-danger"></i> <span>Google</span>
                        </button>
                        <button className="btn-social zalo">
                            {/* Thay icon Zalo bằng ảnh hoặc text nếu không có icon font */}
                            <span className="zalo-text">Zalo</span>
                        </button>
                    </div>
                </div>

                <div className="divider">
                    <span>Hoặc điền thông tin sau</span>
                </div>

                <form onSubmit={handleRegister} className="register-form">

                    {/* --- 2. THÔNG TIN CÁ NHÂN --- */}
                    <h6 className="section-title">Thông tin cá nhân</h6>
                    <div className="row">
                        <div className="col-12 col-md-6 mb-3">
                            <label className="form-label">Họ và tên</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Nhập họ và tên"
                                name="userName"
                                value={formData.userName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="col-12 col-md-6 mb-3">
                            <label className="form-label">Ngày sinh</label>
                            <input
                                type="date"
                                className="form-control"
                                name="dob"
                                value={formData.dob}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-12 col-md-6 mb-3">
                            <label className="form-label">Số điện thoại (Không bắt buộc)</label>
                            <input
                                type="tel"
                                className="form-control"
                                placeholder="Nhập số điện thoại"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}

                            />
                        </div>
                        <div className="col-12 col-md-6 mb-3">
                            <label className="form-label">Email (Bắt buộc) </label>
                            <input
                                type="email"
                                className="form-control"
                                placeholder="Nhập email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                            <div className="form-text text-success small mt-1">
                                <i className="bi bi-check2"></i> Hóa đơn VAT khi mua hàng sẽ được gửi qua email này
                            </div>
                        </div>
                    </div>

                    {/* --- 3. TẠO MẬT KHẨU --- */}
                    <h6 className="section-title mt-2">Tạo mật khẩu</h6>
                    <div className="row">
                        <div className="col-12 col-md-6 mb-3">
                            <label className="form-label">Mật khẩu</label>
                            <div className="input-group-pass">
                                <input
                                    type={showPass ? "text" : "password"}
                                    className="form-control"
                                    placeholder="Nhập mật khẩu của bạn"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                                <span className="toggle-icon" onClick={() => setShowPass(!showPass)}>
                                    <i className={`bi ${showPass ? 'bi-eye' : 'bi-eye-slash'}`}></i>
                                </span>
                            </div>
                            <div className="form-text text-muted small mt-1">
                                <i className="bi bi-info-circle-fill"></i> Mật khẩu tối thiểu 6 ký tự, có ít nhất 1 chữ số và 1 số
                            </div>
                        </div>
                        <div className="col-12 col-md-6 mb-3">
                            <label className="form-label">Nhập lại mật khẩu</label>
                            <div className="input-group-pass">
                                <input
                                    type={showConfirmPass ? "text" : "password"}
                                    className="form-control"
                                    placeholder="Nhập lại mật khẩu của bạn"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                                <span className="toggle-icon" onClick={() => setShowConfirmPass(!showConfirmPass)}>
                                    <i className={`bi ${showConfirmPass ? 'bi-eye' : 'bi-eye-slash'}`}></i>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* --- 4. BUTTONS ACTION --- */}
                    <div className="d-flex gap-3 btn-container">
                        <Link to="/login" className="btn btn-outline-custom flex-grow-1">
                            <i className="bi bi-chevron-left me-1"></i> Quay lại
                        </Link>
                        <button type="submit" className="btn btn-primary-custom flex-grow-1">
                            Hoàn tất đăng ký
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;

