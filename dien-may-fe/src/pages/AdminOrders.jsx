import React, { useState, useEffect } from 'react';
import { fetchAllOrders, fetchOrderDetail, updateOrderStatus } from '../services/adminOrderService';
import { toast } from 'react-toastify';
import ReactPaginate from 'react-paginate';

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPaymentStatus, setFilterPaymentStatus] = useState('');

    // State cho Modal chi tiết
    const [showModal, setShowModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [newStatus, setNewStatus] = useState('');
    const [newPaymentStatus, setNewPaymentStatus] = useState('');
    const [adminNote, setAdminNote] = useState('');

    const limit = 10;

    const statusOptions = [
        { value: 'pending', label: 'Chờ xác nhận', color: 'bg-warning text-dark' },
        { value: 'processing', label: 'Đang xử lý', color: 'bg-info text-dark' },
        { value: 'shipped', label: 'Đang giao hàng', color: 'bg-primary' },
        { value: 'delivered', label: 'Đã giao thành công', color: 'bg-success' },
        { value: 'cancelled', label: 'Đã hủy', color: 'bg-danger' }
    ];

    const getStatusLabel = (val) => statusOptions.find(opt => opt.value === val)?.label || val;
    const getStatusColor = (val) => statusOptions.find(opt => opt.value === val)?.color || 'bg-secondary';

    useEffect(() => {
        loadOrders();
    }, [page, filterStatus, filterPaymentStatus]);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const res = await fetchAllOrders(page, limit, filterStatus, filterPaymentStatus);
            if (res && res.EC === 0) {
                setOrders(res.DT.orders);
                setTotalPages(res.DT.totalPages);
            }
        } catch (error) {
            toast.error("Lỗi khi tải danh sách đơn hàng");
        }
        setLoading(false);
    };

    const handleViewDetail = async (id) => {
        try {
            const res = await fetchOrderDetail(id);
            if (res && res.EC === 0) {
                setSelectedOrder(res.DT);
                setNewStatus(res.DT.order_status);
                setNewPaymentStatus(res.DT.payment_status || 'pending');
                setAdminNote(res.DT.admin_note || '');
                setShowModal(true);
            }
        } catch (error) {
            toast.error("Lỗi khi tải chi tiết đơn hàng");
        }
    };

    const handleUpdateStatus = async () => {
        if (newStatus === 'cancelled' && !window.confirm("Bạn có chắc chắn muốn HỦY đơn hàng này? Thao tác này sẽ tự động hoàn lại số lượng tồn kho.")) {
            return;
        }
        try {
            const res = await updateOrderStatus(selectedOrder.id, newStatus, adminNote, newPaymentStatus);
            if (res && res.EC === 0) {
                toast.success("Cập nhật đơn hàng thành công!");
                setShowModal(false);
                loadOrders(); // Tải lại danh sách
            } else {
                toast.error(res.EM || "Lỗi cập nhật!");
            }
        } catch (error) {
            toast.error("Lỗi hệ thống khi cập nhật");
        }
    };

    const handlePageClick = (event) => {
        setPage(+event.selected + 1);
    };

    return (
        <div className="container-fluid p-4">
            <h2 className="fw-bold mb-4">Quản lý đơn hàng</h2>

            {/* Bộ lọc */}
            <div className="card shadow-sm border-0 mb-4">
                <div className="card-body d-flex gap-3 align-items-center">
                    <span className="fw-bold">Lọc trạng thái:</span>
                    <select className="form-select w-auto" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
                        <option value="">Tất cả trạng thái</option>
                        {statusOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <select className="form-select w-auto" value={filterPaymentStatus} onChange={(e) => { setFilterPaymentStatus(e.target.value); setPage(1); }}>
                        <option value="">Tất cả thanh toán</option>
                        <option value="pending">Chưa thanh toán</option>
                        <option value="paid">Đã thanh toán</option>
                    </select>
                    <button className="btn btn-primary ms-auto" onClick={loadOrders}>
                        <i className="bi bi-arrow-clockwise me-2"></i>Làm mới
                    </button>
                </div>
            </div>

            {/* Bảng dữ liệu */}
            <div className="card shadow-sm border-0">
                <div className="card-body p-0">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>Mã ĐH</th>
                                <th>Người nhận</th>
                                <th>Ngày đặt</th>
                                <th>Tổng tiền</th>
                                <th>Thanh toán</th>
                                <th>Trạng thái</th>
                                <th className="text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" className="text-center py-4"><div className="spinner-border text-primary"></div></td></tr>
                            ) : orders.length > 0 ? (
                                orders.map(order => (
                                    <tr key={order.id}>
                                        <td className="fw-bold text-primary">{order.code}</td>
                                        <td>
                                            <div className="fw-bold">{order.shipping_name}</div>
                                            <small className="text-muted">{order.shipping_phone}</small>
                                        </td>
                                        <td>{new Date(order.order_date).toLocaleString('vi-VN')}</td>
                                        <td className="fw-bold text-danger">{Number(order.grand_total).toLocaleString('vi-VN')}đ</td>
                                        <td>
                                            <div className="mb-1">{order.payment_method === 'COD' ? 'Thanh toán khi nhận hàng' : order.payment_method}</div>
                                            {order.payment_status === 'paid' ? (
                                                <span className="badge bg-success small">Đã thanh toán</span>
                                            ) : (
                                                <span className="badge bg-warning text-dark small">Chưa thanh toán</span>
                                            )}
                                        </td>
                                        <td><span className={`badge ${getStatusColor(order.order_status)}`}>{getStatusLabel(order.order_status)}</span></td>
                                        <td className="text-center">
                                            <button className="btn btn-sm btn-outline-info" onClick={() => handleViewDetail(order.id)}>
                                                <i className="bi bi-eye"></i> Xem / Sửa
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="7" className="text-center py-4">Không tìm thấy đơn hàng nào!</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Phân trang */}
            {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                    <ReactPaginate
                        nextLabel=">"
                        onPageChange={handlePageClick}
                        pageCount={totalPages}
                        previousLabel="<"
                        pageClassName="page-item"
                        pageLinkClassName="page-link"
                        previousClassName="page-item"
                        previousLinkClassName="page-link"
                        nextClassName="page-item"
                        nextLinkClassName="page-link"
                        containerClassName="pagination pagination-sm mb-0"
                        activeClassName="active"
                        forcePage={page - 1}
                    />
                </div>
            )}

            {/* Modal Chi Tiết */}
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
                                        <h6 className="fw-bold border-bottom pb-2">Thông tin người nhận</h6>
                                        <p className="mb-1"><strong>Họ tên:</strong> {selectedOrder.shipping_name}</p>
                                        <p className="mb-1"><strong>Số điện thoại:</strong> {selectedOrder.shipping_phone}</p>
                                        <p className="mb-1"><strong>Địa chỉ:</strong> {selectedOrder.shipping_address_snapshot}</p>
                                        <p className="mb-0"><strong>Ghi chú:</strong> <span className="text-danger">{selectedOrder.customer_note || 'Không có'}</span></p>
                                    </div>
                                    <div className="col-md-6 bg-light rounded p-3">
                                        <h6 className="fw-bold border-bottom pb-2">Cập nhật hệ thống</h6>
                                        <div className="mb-2">
                                            <label className="form-label small fw-bold">Trạng thái đơn hàng:</label>
                                            <select className="form-select" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                                                {statusOptions.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="mb-2">
                                            <label className="form-label small fw-bold">Trạng thái thanh toán:</label>
                                            <select className="form-select" value={newPaymentStatus} onChange={e => setNewPaymentStatus(e.target.value)}>
                                                <option value="pending">Chưa thanh toán</option>
                                                <option value="paid">Đã thanh toán</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="form-label small fw-bold">Ghi chú nội bộ (Admin):</label>
                                            <textarea className="form-control" rows="2" value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Ghi chú thêm nếu cần..." />
                                        </div>
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
                                                    <td className="text-end">{Number(item.price).toLocaleString()}đ</td>
                                                    <td className="text-center">{item.quantity}</td>
                                                    <td className="text-end fw-bold text-danger">{Number(item.subtotal).toLocaleString()}đ</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="text-end fs-5">
                                    Tổng cộng: <strong className="text-danger">{Number(selectedOrder.grand_total).toLocaleString()}đ</strong>
                                </div>
                            </div>
                            <div className="modal-footer border-top-0 pt-0">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Đóng</button>
                                <button type="button" className="btn btn-primary" onClick={handleUpdateStatus}>
                                    <i className="bi bi-save me-2"></i> Lưu thay đổi
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminOrders;