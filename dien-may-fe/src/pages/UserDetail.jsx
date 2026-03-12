import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { readUserDetail } from '../services/userService';

const UserDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        let res = await readUserDetail(id);
        if (res && res.EC === 0) {
            console.log(">>> res.DTTTTT:", res.DT);
            setUser(res.DT);
        }
        setLoading(false);
    };

    if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;
    if (!user) return <div className="container mt-5 fw-bold text-danger">Người dùng không tồn tại!</div>;

    // Tính tổng chi tiêu thực tế từ các đơn hàng
    const totalSpent = user.orders?.reduce((sum, item) => sum + Number(item.grand_total), 0) || 0;

    return (
        <div className="container py-4">
            <button className="btn btn-outline-secondary mb-4 btn-sm" onClick={() => navigate(-1)}>
                <i className="bi bi-arrow-left"></i> Quay lại danh sách
            </button>

            <div className="row">
                {/* CỘT TRÁI: THÔNG TIN CÁ NHÂN */}
                <div className="col-md-4">
                    <div className="card shadow-sm border-0 mb-4">
                        <div className="card-body text-center">
                            <div className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px', fontSize: '2rem' }}>
                                {user.user_name?.charAt(0).toUpperCase()}
                            </div>
                            <h4 className="fw-bold">{user.user_name}</h4>
                            <p className="text-muted small">{user.email}</p>
                            <hr />
                            <div className="text-start">
                                <p><strong>Trạng thái:</strong> {user.active ? <span className="text-success">Hoạt động</span> : <span className="text-danger">Bị khóa</span>}</p>
                                <p><strong>Vai trò:</strong> {user.roles?.map(r => r.name).join(', ')}</p>
                                <p><strong>Tổng chi tiêu:</strong> <span className="text-danger fw-bold">{totalSpent.toLocaleString()}đ</span></p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI: LỊCH SỬ MUA HÀNG */}
                <div className="col-md-8">
                    <h5 className="mb-3 fw-bold">Lịch sử đơn hàng ({user.orders?.length || 0})</h5>

                    {user.orders && user.orders.length > 0 ? (
                        user.orders.map((order) => (
                            <div key={order.id} className="card shadow-sm border-0 mb-4 overflow-hidden">
                                <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center py-3">
                                    <span>Mã đơn: <strong className="text-warning">{order.code}</strong></span>
                                    <span className="small">{new Date(order.order_date).toLocaleDateString('vi-VN')}</span>
                                </div>
                                <div className="card-body">
                                    <div className="mb-3 d-flex gap-2">
                                        <span className={`badge ${order.payment_status === 'paid' ? 'bg-success' : 'bg-secondary'}`}>
                                            {order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                        </span>
                                        <span className={`badge bg-info text-dark`}>Trạng thái: {order.order_status}</span>
                                    </div>

                                    {/* BẢNG SẢN PHẨM TRONG ĐƠN */}
                                    <div className="table-responsive">
                                        <table className="table table-sm align-middle">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Tên sản phẩm</th>
                                                    <th className="text-end" style={{ width: '120px' }}>Giá</th>
                                                    <th className="text-center" style={{ width: '80px' }}>SL</th>
                                                    <th className="text-end" style={{ width: '150px' }}>Thành tiền</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {order.order_products && order.order_products.length > 0 ? (
                                                    order.order_products.map((item, idx) => (
                                                        <tr key={idx}>
                                                            <td className="text-wrap">{item.name}</td>
                                                            {/* Hiển thị Giá đơn vị */}
                                                            <td className="text-end">
                                                                {Number(item.price).toLocaleString('vi-VN')}đ
                                                            </td>
                                                            {/* Hiển thị Số lượng */}
                                                            <td className="text-center">{item.quantity}</td>
                                                            {/* Hiển thị Thành tiền */}
                                                            <td className="text-end fw-bold">
                                                                {Number(item.subtotal).toLocaleString('vi-VN')}đ
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="4" className="text-center text-muted">
                                                            Không có dữ liệu sản phẩm
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="text-end mt-2 pt-2 border-top">
                                        <span className="text-muted me-2">Tổng giá trị đơn hàng:</span>
                                        <span className="h5 fw-bold text-danger">{Number(order.grand_total).toLocaleString()}đ</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="card p-5 text-center text-muted shadow-sm">
                            <i className="bi bi-cart-x fs-1"></i>
                            <p className="mt-2">Người dùng này chưa có đơn hàng nào.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserDetail;