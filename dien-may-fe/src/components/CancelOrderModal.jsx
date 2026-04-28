import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { cancelUserOrderApi } from '../services/userOrderService';

const CancelOrderModal = ({ show, orderId, orderCode, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [reason, setReason] = useState('');

    const handleCancel = async () => {
        if (!reason.trim()) {
            toast.warning("Vui lòng nhập lý do hủy đơn!");
            return;
        }

        try {
            setLoading(true);
            const res = await cancelUserOrderApi(orderId);
            if (res && res.EC === 0) {
                toast.success("Hủy đơn hàng thành công!");
                onSuccess();
                handleClose();
            } else {
                toast.error(res?.EM || "Không thể hủy đơn hàng!");
            }
        } catch (error) {
            toast.error("Lỗi khi hủy đơn hàng!");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setReason('');
        onClose();
    };

    if (!show) return null;

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header bg-light border-bottom">
                        <h5 className="modal-title fw-bold text-danger">
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            Xác nhận hủy đơn hàng
                        </h5>
                        <button type="button" className="btn-close" onClick={handleClose} disabled={loading}></button>
                    </div>
                    <div className="modal-body">
                        <p className="mb-3">
                            Bạn có chắc chắn muốn hủy đơn hàng <strong className="text-primary">{orderCode}</strong>?
                        </p>
                        <div className="mb-3">
                            <label className="form-label">Lý do hủy (tùy chọn)</label>
                            <textarea
                                className="form-control"
                                rows="3"
                                placeholder="Nhập lý do hủy đơn..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                disabled={loading}
                            ></textarea>
                        </div>
                        <div className="alert alert-warning small mb-0">
                            <i className="bi bi-info-circle me-1"></i>
                            Sau khi hủy, bạn có thể liên hệ với chúng tôi nếu muốn phục hồi đơn hàng
                        </div>
                    </div>
                    <div className="modal-footer border-top-0 pt-0">
                        <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={loading}>
                            Không
                        </button>
                        <button 
                            type="button" 
                            className="btn btn-danger" 
                            onClick={handleCancel}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    Đang hủy...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-trash me-1"></i>Hủy đơn hàng
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CancelOrderModal;