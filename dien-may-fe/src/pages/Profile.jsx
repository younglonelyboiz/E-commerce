import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import AddressModal from '../components/AddressModal';
import { getUserAddressesApi, addUserAddressApi, updateUserAddressApi, deleteUserAddressApi } from '../services/checkoutService';
import { toast } from 'react-toastify';
import { changePasswordApi } from '../services/userService';

const Profile = () => {
    // Lấy thông tin user từ Context
    const { user } = useContext(UserContext);
    const [addresses, setAddresses] = useState([]);
    const [showAddressModal, setShowAddressModal] = useState(false);

    // State cho Modal Đổi mật khẩu
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPass, setShowPass] = useState(false);

    useEffect(() => {
        if (user && user.auth) {
            fetchAddresses();
        }
    }, [user]);

    const fetchAddresses = async () => {
        try {
            const res = await getUserAddressesApi();
            if (res && res.EC === 0) {
                setAddresses(res.DT);
            }
        } catch (error) {
            console.error("Lỗi tải địa chỉ:", error);
        }
    }; // <--- BẠN ĐÃ THIẾU DẤU ĐÓNG NGOẶC NÀY

    const handleAddNewAddress = async (newAddr) => {
        try {
            const res = await addUserAddressApi(newAddr);
            if (res && res.EC === 0) {
                toast.success("Thêm địa chỉ thành công!");
                fetchAddresses();
            } else {
                toast.error(res?.EM || "Lỗi thêm địa chỉ");
            }
        } catch (error) {
            toast.error("Lỗi server khi thêm địa chỉ!");
        }
    };

    const handleUpdateAddress = async (id, updatedAddr) => {
        try {
            const res = await updateUserAddressApi(id, updatedAddr);
            if (res && res.EC === 0) {
                toast.success("Cập nhật địa chỉ thành công!");
                fetchAddresses();
            } else {
                toast.error(res?.EM || "Lỗi cập nhật địa chỉ");
            }
        } catch (error) {
            toast.error("Lỗi server khi cập nhật địa chỉ!");
        }
    };

    const handleDeleteAddress = async (id) => {
        try {
            const res = await deleteUserAddressApi(id);
            if (res && res.EC === 0) {
                toast.success("Xóa địa chỉ thành công!");
                fetchAddresses();
            } else {
                toast.error(res?.EM || "Lỗi xóa địa chỉ");
            }
        } catch (error) {
            toast.error("Lỗi server khi xóa địa chỉ!");
        }
    };

    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            toast.warning("Vui lòng điền đầy đủ thông tin!");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.warning("Mật khẩu mới và xác nhận mật khẩu không khớp!");
            return;
        }

        try {
            const res = await changePasswordApi(oldPassword, newPassword);
            if (res && res.EC === 0) {
                toast.success(res.EM || "Đổi mật khẩu thành công!");
                setShowPasswordModal(false);
                setOldPassword(''); setNewPassword(''); setConfirmPassword('');
            } else {
                toast.error(res?.EM || "Đổi mật khẩu thất bại!");
            }
        } catch (error) {
            toast.error(error.response?.data?.EM || "Lỗi kết nối khi đổi mật khẩu!");
        }
    };

    // Logic bảo vệ: Nếu chưa đăng nhập thì hiện thông báo
    if (!user || !user.auth) {
        return (
            <div className="container mt-5 text-center py-5">
                <i className="bi bi-person-x text-muted" style={{ fontSize: '4rem' }}></i>
                <h4 className="mt-3">Vui lòng đăng nhập để xem thông tin cá nhân</h4>
                <Link to="/login" className="btn btn-primary mt-3 px-4">Đăng nhập ngay</Link>
            </div>
        );
    }

    return (
        <div className="container py-4" style={{ minHeight: '60vh' }}>
            <h3 className="fw-bold mb-4">Hồ sơ của tôi</h3>
            <div className="row">
                {/* CỘT TRÁI: Avatar và Tóm tắt */}
                <div className="col-md-4 mb-4">
                    <div className="card shadow-sm border-0 text-center py-4">
                        <div className="card-body">
                            <div className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center mb-3 shadow" style={{ width: '100px', height: '100px', fontSize: '3rem' }}>
                                {user.userName?.charAt(0).toUpperCase()}
                            </div>
                            <h4 className="fw-bold mb-1">{user.userName}</h4>
                            <p className="text-muted mb-2">{user.email}</p>
                            <span className="badge bg-success px-3 py-2 rounded-pill">Thành viên</span>
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI: Chi tiết thông tin */}
                <div className="col-md-8">
                    <div className="card shadow-sm border-0 mb-4">
                        <div className="card-header bg-white border-bottom pt-3 pb-2 d-flex justify-content-between align-items-center">
                            <h5 className="fw-bold text-primary mb-0"><i className="bi bi-person-lines-fill me-2"></i>Chi tiết tài khoản</h5>
                            <button className="btn btn-sm btn-outline-primary" onClick={() => setShowPasswordModal(true)}>
                                <i className="bi bi-shield-lock me-1"></i> Đổi mật khẩu
                            </button>
                        </div>
                        <div className="card-body p-4">
                            <div className="row mb-3 align-items-center">
                                <div className="col-sm-3 text-muted">Họ và tên</div>
                                <div className="col-sm-9 fw-bold fs-5">{user.userName}</div>
                            </div>
                            <hr className="text-muted" />
                            <div className="row mb-3 align-items-center">
                                <div className="col-sm-3 text-muted">Email đăng nhập</div>
                                <div className="col-sm-9 fw-bold">{user.email}</div>
                            </div>
                            <hr className="text-muted" />
                            <div className="row mb-3 align-items-center">
                                <div className="col-sm-3 text-muted">Vai trò / Phân quyền</div>
                                <div className="col-sm-9 fw-bold">
                                    {user.roles && user.roles.length > 0 ? user.roles.join(', ') : 'Khách hàng'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quản lý Sổ địa chỉ */}
                    <div className="card shadow-sm border-0">
                        <div className="card-header bg-white border-bottom pt-3 pb-2 d-flex justify-content-between align-items-center">
                            <h5 className="fw-bold text-danger mb-0"><i className="bi bi-geo-alt me-2"></i>Danh sách địa chỉ nhận hàng của bạn.</h5>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => setShowAddressModal(true)}>
                                <i className="bi bi-gear me-1"></i> Quản lý địa chỉ
                            </button>
                        </div>
                        <div className="card-body p-4">
                            {addresses && addresses.length > 0 ? (
                                <div className="row">
                                    {addresses.map(addr => (
                                        <div key={addr.id} className="col-12 mb-3">
                                            <div className={`p-3 border rounded ${addr.is_default ? 'border-danger bg-light' : ''}`}>
                                                <div className="d-flex justify-content-between mb-2">
                                                    <span className="fw-bold">{addr.receiver_name} - {addr.phone}</span>
                                                    {addr.is_default && <span className="badge bg-danger">Mặc định</span>}
                                                </div>
                                                <div className="text-muted mb-1">{addr.specific_address}</div>
                                                <div className="text-muted">{addr.ward}, {addr.district}, {addr.province}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-muted py-3">
                                    Bạn chưa có địa chỉ nào được lưu. Thêm địa chỉ mới để đặt hàng nhanh hơn!
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Component Modal Quản lý Địa Chỉ */}
            {showAddressModal && (
                <AddressModal
                    show={showAddressModal}
                    setShow={setShowAddressModal}
                    addresses={addresses}
                    onSelectAddress={() => { }}
                    onAddNewAddress={handleAddNewAddress}
                    onUpdateAddress={handleUpdateAddress}
                    onDeleteAddress={handleDeleteAddress}
                />
            )}

            {/* Component Modal Đổi Mật Khẩu */}
            {showPasswordModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header bg-light">
                                <h5 className="modal-title fw-bold text-primary"><i className="bi bi-shield-lock me-2"></i>Đổi mật khẩu</h5>
                                <button type="button" className="btn-close" onClick={() => setShowPasswordModal(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                <div className="mb-3">
                                    <label className="form-label fw-medium">Mật khẩu hiện tại</label>
                                    <div className="input-group">
                                        <input type={showPass ? "text" : "password"} className="form-control" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="Nhập mật khẩu hiện tại" />
                                        <button className="btn btn-outline-secondary" type="button" onClick={() => setShowPass(!showPass)}>
                                            <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                        </button>
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-medium">Mật khẩu mới</label>
                                    <div className="input-group">
                                        <input type={showPass ? "text" : "password"} className="form-control" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nhập mật khẩu mới" />
                                        <button className="btn btn-outline-secondary" type="button" onClick={() => setShowPass(!showPass)}>
                                            <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                        </button>
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-medium">Xác nhận mật khẩu mới</label>
                                    <div className="input-group">
                                        <input type={showPass ? "text" : "password"} className="form-control" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Nhập lại mật khẩu mới" />
                                        <button className="btn btn-outline-secondary" type="button" onClick={() => setShowPass(!showPass)}>
                                            <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer border-top-0 pt-0">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordModal(false)}>Hủy bỏ</button>
                                <button type="button" className="btn btn-primary" onClick={handleChangePassword}>Cập nhật mật khẩu</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;