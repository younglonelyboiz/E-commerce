import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getUserOrdersApi, cancelUserOrderApi } from '../services/userOrderService';
import { UserContext } from '../context/UserContext';
import { retryPaymentLinkApi } from '../services/checkoutService';
import { io } from 'socket.io-client';

const OrderHistory = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const { user } = useContext(UserContext);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // State cho việc hiển thị Modal Thanh toán lại
    const [showQRModal, setShowQRModal] = useState(false);
    const [qrData, setQrData] = useState(null);
    const [currentOrderCode, setCurrentOrderCode] = useState('');
    const [socket, setSocket] = useState(null);

    const statusOptions = {
        'pending': { label: 'Chờ xác nhận', color: 'bg-warning text-dark' },
        'processing': { label: 'Đang xử lý', color: 'bg-info text-dark' },
        'shipped': { label: 'Đang giao hàng', color: 'bg-primary' },
        'delivered': { label: 'Đã giao thành công', color: 'bg-success' },
        'cancelled': { label: 'Đã hủy', color: 'bg-danger' }
    };

    const tabs = [
        { id: 'all', label: 'Tất cả' },
        { id: 'pending', label: 'Chờ xác nhận' },
        { id: 'processing', label: 'Đang xử lý' },
        { id: 'shipped', label: 'Đang giao hàng' },
        { id: 'delivered', label: 'Đã giao' },
        { id: 'cancelled', label: 'Đã hủy' }
    ];

    useEffect(() => {
        // Chỉ gọi API khi đã xác nhận đăng nhập
        if (user && user.auth) {
            fetchUserOrders();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchUserOrders = async () => {
        try {
            setLoading(true);
            const res = await getUserOrdersApi();
            if (res && res.EC === 0) {
                setOrders(res.DT);
            } else {
                toast.error(res.EM || "Không thể tải lịch sử đơn hàng");
            }
        } catch (error) {
            toast.error("Lỗi kết nối khi tải đơn hàng");
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = async (orderId) => {
        if (window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) {
            try {
                const res = await cancelUserOrderApi(orderId);
                if (res && res.EC === 0) {
                    toast.success("Hủy đơn hàng thành công!");
                    fetchUserOrders(); // Tải lại danh sách sau khi hủy
                } else {
                    toast.error(res.EM || "Lỗi khi hủy đơn");
                }
            } catch (error) {
                toast.error("Lỗi kết nối khi hủy đơn");
            }
        }
    };

    const handleViewDetail = (order) => {
        setSelectedOrder(order);
        setShowModal(true);
    };

    // Dọn dẹp socket khi rời trang
    useEffect(() => {
        return () => {
            if (socket) socket.disconnect();
        };
    }, [socket]);

    const setupSocketForPayment = (orderCode) => {
        const newSocket = io("http://localhost:8080"); // Đảm bảo gọi đúng port của Backend

        newSocket.on("connect", () => {
            newSocket.emit("join_order", orderCode);
        });

        newSocket.on("payment_status", (data) => {
            if (data.success) {
                setShowQRModal(false);
                toast.success("Thanh toán thành công! Cảm ơn bạn.");
                fetchUserOrders(); // Gọi lại API để load lại danh sách đơn đã đổi trạng thái
                newSocket.disconnect();
            }
        });
        setSocket(newSocket);
    };

    const handleRetryPayment = async (orderId) => {
        toast.info("Đang khởi tạo lại mã QR...");
        try {
            const res = await retryPaymentLinkApi(orderId);
            if (res && res.EC === 0) {
                setQrData(res.DT.qrCode);
                setCurrentOrderCode(res.DT.newOrderCode); // Lấy mã mới để socket lắng nghe đúng phòng
                setShowQRModal(true);
                setupSocketForPayment(res.DT.newOrderCode);

                // Cập nhật lại mã đơn mới vào state để nếu khách tắt Modal mở lại vẫn đúng mã
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, code: res.DT.newOrderCode } : o));
            } else {
                toast.error(res?.EM || "Không thể tải mã QR, vui lòng thử lại!");
            }
        } catch (error) {
            toast.error("Lỗi khi tải mã QR!");
        }
    };

    if (loading) {
        return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;
    }

    if (!user || !user.auth) {
        return (
            <div className="container mt-5 text-center py-5">
                <i className="bi bi-box-seam text-muted" style={{ fontSize: '4rem' }}></i>
                <h4 className="mt-3">Vui lòng đăng nhập để xem đơn hàng của bạn</h4>
                <Link to="/login" className="btn btn-primary mt-3 px-4">Đăng nhập ngay</Link>
            </div>
        );
    }

    // Lọc danh sách đơn hàng dựa trên tab đang chọn
    const filteredOrders = activeTab === 'all'
        ? orders
        : orders.filter(order => order.order_status === activeTab);

    return (
        <div className="container py-4" style={{ minHeight: '60vh' }}>
            <h3 className="fw-bold mb-4">Đơn hàng của tôi</h3>

            {/* Tabs phân loại trạng thái đơn hàng */}
            <div className="d-flex overflow-auto mb-4 border-bottom pb-1">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`btn btn-link text-decoration-none px-4 py-2 fw-medium ${activeTab === tab.id ? 'text-primary border-bottom border-primary border-3' : 'text-secondary'}`}
                        onClick={() => setActiveTab(tab.id)}
                        style={{ borderRadius: '0', whiteSpace: 'nowrap' }}
                    >
                        {tab.label} <span className="badge bg-light text-dark rounded-pill ms-1 border">{tab.id === 'all' ? orders.length : orders.filter(o => o.order_status === tab.id).length}</span>
                    </button>
                ))}
            </div>

            {filteredOrders.length === 0 ? (
                <div className="text-center py-5 bg-light rounded shadow-sm">
                    <i className="bi bi-box-seam display-1 text-muted"></i>
                    <p className="mt-3 text-muted">Bạn chưa có đơn hàng nào.</p>
                </div>
            ) : (
                <div className="row">
                    {filteredOrders.map(order => (
                        <div key={order.id} className="col-12 mb-4">
                            <div className="card shadow-sm border-0">
                                <div className="card-header bg-white border-bottom-0 pt-3 pb-0 d-flex justify-content-between align-items-center">
                                    <div>
                                        <span className="fw-bold text-primary me-3">Mã ĐH: {order.code}</span>
                                        <small className="text-muted">Ngày đặt: {new Date(order.order_date).toLocaleString('vi-VN')}</small>
                                    </div>
                                    <span className={`badge ${statusOptions[order.order_status]?.color || 'bg-secondary'}`}>
                                        {statusOptions[order.order_status]?.label || order.order_status}
                                    </span>
                                </div>
                                <div className="card-body">
                                    <table className="table table-borderless align-middle mb-0">
                                        <tbody>
                                            {order.order_products?.map(item => (
                                                <tr key={item.id} className="border-bottom">
                                                    <td className="fw-bold" style={{ width: '60%' }}>{item.name}</td>
                                                    <td className="text-center text-muted">x {item.quantity}</td>
                                                    <td className="text-end text-danger fw-bold">{Number(item.price).toLocaleString('vi-VN')}đ</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="card-footer bg-light d-flex justify-content-between align-items-center border-top-0">
                                    <div>
                                        <span className="text-muted small d-block mb-2">Thanh toán: {order.payment_method}</span>
                                        {(order.order_status === 'pending' || order.order_status === 'processing') && (
                                            <button className="btn btn-sm btn-outline-danger me-2" onClick={() => handleCancelOrder(order.id)}>
                                                Hủy đơn
                                            </button>
                                        )}
                                        <button className="btn btn-sm btn-outline-primary" onClick={() => handleViewDetail(order)}>
                                            Xem chi tiết đơn hàng của bạn
                                        </button>
                                        {/* Nút thanh toán lại */}
                                        {order.payment_method === 'BANK' && order.payment_status === 'pending' && order.order_status !== 'cancelled' && (
                                            <button className="btn btn-sm btn-warning ms-2 text-dark fw-bold" onClick={() => handleRetryPayment(order.id)}>
                                                <i className="bi bi-qr-code me-1"></i> Thanh toán ngay
                                            </button>
                                        )}
                                    </div>
                                    <div className="text-end">
                                        <span className="d-block small text-muted">Tổng tiền:</span>
                                        <strong className="text-danger fs-5">{Number(order.grand_total).toLocaleString('vi-VN')}đ</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Chi Tiết Đơn Hàng */}
            {showModal && selectedOrder && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header bg-light">
                                <h5 className="modal-title fw-bold">Chi tiết đơn hàng: <span className="text-primary">{selectedOrder.code}</span></h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="row mb-4">
                                    <div className="col-md-6">
                                        <h6 className="fw-bold border-bottom pb-2">Thông tin nhận hàng</h6>
                                        <p className="mb-1"><strong>Người nhận:</strong> {selectedOrder.shipping_name}</p>
                                        <p className="mb-1"><strong>Số điện thoại:</strong> {selectedOrder.shipping_phone}</p>
                                        <p className="mb-1"><strong>Địa chỉ:</strong> {selectedOrder.shipping_address_snapshot}</p>
                                        <p className="mb-0"><strong>Ghi chú:</strong> <span className="text-danger">{selectedOrder.customer_note || 'Không có'}</span></p>
                                    </div>
                                    <div className="col-md-6">
                                        <h6 className="fw-bold border-bottom pb-2">Thông tin thanh toán</h6>
                                        <p className="mb-1"><strong>Phương thức:</strong> {selectedOrder.payment_method}</p>
                                        <p className="mb-1"><strong>Trạng thái:</strong> <span className={`badge ms-1 ${statusOptions[selectedOrder.order_status]?.color}`}>{statusOptions[selectedOrder.order_status]?.label}</span></p>
                                    </div>
                                </div>

                                <h6 className="fw-bold border-bottom pb-2">Sản phẩm đã mua</h6>
                                <div className="table-responsive mb-3">
                                    <table className="table table-sm table-bordered align-middle">
                                        <thead className="table-light text-center">
                                            <tr>
                                                <th>Tên sản phẩm</th>
                                                <th>Đơn giá</th>
                                                <th>SL</th>
                                                <th>Thành tiền</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedOrder.order_products?.map(item => (
                                                <tr key={item.id}>
                                                    <td>{item.name}</td>
                                                    <td className="text-end">{Number(item.price).toLocaleString('vi-VN')}đ</td>
                                                    <td className="text-center">{item.quantity}</td>
                                                    <td className="text-end fw-bold text-danger">{Number(item.subtotal || (item.price * item.quantity)).toLocaleString('vi-VN')}đ</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="text-end fs-5">
                                    Tổng cộng: <strong className="text-danger">{Number(selectedOrder.grand_total).toLocaleString('vi-VN')}đ</strong>
                                </div>
                            </div>
                            <div className="modal-footer border-top-0 pt-0">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Đóng</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Quét QR Code PayOS Thanh toán lại */}
            {showQRModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header bg-light border-bottom-0 pb-0">
                                <h5 className="modal-title fw-bold text-primary">Thanh toán đơn hàng: <span className="text-dark">{currentOrderCode}</span></h5>
                                <button type="button" className="btn-close" onClick={() => { setShowQRModal(false); if (socket) socket.disconnect(); }}></button>
                            </div>
                            <div className="modal-body text-center pt-2 pb-5">
                                <p className="text-muted mb-4">Vui lòng quét mã QR dưới đây bằng ứng dụng ngân hàng</p>
                                <div className="bg-white p-3 d-inline-block rounded-3 border shadow-sm mb-4">
                                    {qrData ? (
                                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}`} alt="PayOS QR Code" style={{ width: '220px', height: '220px' }} />
                                    ) : (
                                        <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
                                    )}
                                </div>
                                <div className="d-flex align-items-center justify-content-center text-primary fw-bold">
                                    <div className="spinner-grow spinner-grow-sm me-2" role="status"></div>
                                    Hệ thống đang chờ tín hiệu thanh toán...
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderHistory;