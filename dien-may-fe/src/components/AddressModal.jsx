import React, { useState } from 'react';
import { toast } from 'react-toastify';

const AddressModal = ({ show, setShow, addresses, onSelectAddress, onAddNewAddress, onUpdateAddress, onDeleteAddress }) => {
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editAddressId, setEditAddressId] = useState(null);
    const [newAddress, setNewAddress] = useState({
        receiver_name: '', phone: '', specific_address: '', ward: '', district: '', province: '', is_default: false
    });

    if (!show) return null;

    const handleSaveNew = async () => {
        if (!newAddress.receiver_name || !newAddress.phone || !newAddress.specific_address || !newAddress.province) {
            toast.error("Vui lòng điền đầy đủ các thông tin bắt buộc!");
            return;
        }
        if (isEditing) {
            await onUpdateAddress(editAddressId, newAddress);
        } else {
            await onAddNewAddress(newAddress);
        }
        // Reset form
        setNewAddress({ receiver_name: '', phone: '', specific_address: '', ward: '', district: '', province: '', is_default: false });
        setIsAddingNew(false);
        setIsEditing(false);
        setEditAddressId(null);
    };

    const handleEditClick = (e, addr) => {
        e.stopPropagation(); // Ngăn việc tự động chọn luôn địa chỉ khi đang bấm sửa
        setNewAddress({ ...addr });
        setEditAddressId(addr.id);
        setIsEditing(true);
        setIsAddingNew(true);
    };

    const handleDeleteClick = (e, id) => {
        e.stopPropagation();
        if (window.confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) {
            onDeleteAddress(id);
        }
    };

    const handleCloseForm = () => {
        setIsAddingNew(false);
        setIsEditing(false);
        setEditAddressId(null);
        setNewAddress({ receiver_name: '', phone: '', specific_address: '', ward: '', district: '', province: '', is_default: false });
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Lớp nền đen mờ */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShow(false)}></div>

            {/* Nội dung Modal */}
            <div className="shadow-lg" style={{ position: 'relative', backgroundColor: '#fff', borderRadius: '8px', width: '500px', maxWidth: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                <div className="modal-header bg-danger text-white p-3 d-flex justify-content-between align-items-center rounded-top">
                    <h5 className="modal-title fs-6 fw-bold m-0">{isEditing ? 'Cập nhật địa chỉ' : isAddingNew ? 'Thêm địa chỉ mới' : 'Chọn địa chỉ giao hàng'}</h5>
                    <button type="button" className="btn-close btn-close-white shadow-none" onClick={() => setShow(false)}></button>
                </div>

                <div className="modal-body p-3" style={{ overflowY: 'auto' }}>
                    {!isAddingNew ? (
                        <>
                            {addresses && addresses.length > 0 ? (
                                <div className="address-list">
                                    {addresses.map(addr => (
                                        <div key={addr.id} className="border rounded p-3 mb-2" style={{ cursor: 'pointer', borderColor: addr.is_default ? '#dc3545' : '#dee2e6' }} onClick={() => { onSelectAddress(addr); setShow(false); }}>
                                            <div className="fw-bold d-flex justify-content-between">
                                                <div>
                                                    {addr.receiver_name} | {addr.phone}
                                                    {addr.is_default ? <span className="badge bg-danger ms-2">Mặc định</span> : ''}
                                                </div>
                                                <div>
                                                    <span className="text-primary me-3" onClick={(e) => handleEditClick(e, addr)}>Cập nhật</span>
                                                    <span className="text-danger" onClick={(e) => handleDeleteClick(e, addr.id)}>Xóa</span>
                                                </div>
                                            </div>
                                            <div className="text-muted small mt-1">{addr.specific_address}, {addr.ward}, {addr.district}, {addr.province}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-center text-muted my-3">Chưa có địa chỉ nào được lưu.</p>}
                            <button className="btn btn-outline-danger w-100 mt-2" onClick={() => setIsAddingNew(true)}>
                                <i className="fas fa-plus me-2"></i> Thêm địa chỉ mới
                            </button>
                        </>
                    ) : (
                        <div className="new-address-form">
                            <input className="form-control mb-2" placeholder="Họ và tên người nhận" value={newAddress.receiver_name} onChange={e => setNewAddress({ ...newAddress, receiver_name: e.target.value })} />
                            <input className="form-control mb-2" placeholder="Số điện thoại" value={newAddress.phone} onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })} />
                            <div className="row mb-2">
                                <div className="col-6"><input className="form-control" placeholder="Tỉnh/Thành phố" value={newAddress.province} onChange={e => setNewAddress({ ...newAddress, province: e.target.value })} /></div>
                                <div className="col-6"><input className="form-control" placeholder="Quận/Huyện" value={newAddress.district} onChange={e => setNewAddress({ ...newAddress, district: e.target.value })} /></div>
                            </div>
                            <input className="form-control mb-2" placeholder="Phường/Xã" value={newAddress.ward} onChange={e => setNewAddress({ ...newAddress, ward: e.target.value })} />
                            <input className="form-control mb-2" placeholder="Địa chỉ cụ thể (Số nhà, đường...)" value={newAddress.specific_address} onChange={e => setNewAddress({ ...newAddress, specific_address: e.target.value })} />

                            <div className="form-check mb-2 mt-3">
                                <input type="checkbox" className="form-check-input border-secondary" id="isDefault" checked={newAddress.is_default} onChange={e => setNewAddress({ ...newAddress, is_default: e.target.checked })} />
                                <label className="form-check-label user-select-none" htmlFor="isDefault">Đặt làm địa chỉ mặc định</label>
                            </div>
                            <div className="d-flex gap-2 justify-content-end mt-4">
                                <button className="btn btn-secondary" onClick={handleCloseForm}>Trở lại</button>
                                <button className="btn btn-danger" onClick={handleSaveNew}>Lưu địa chỉ</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AddressModal;