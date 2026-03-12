import React, { useEffect, useState } from 'react';
import { readAllRoles, updateRole } from '../services/roleService';
import { toast } from 'react-toastify';
import './ModalRole.scss';

const ModalRole = ({ show, setShow, dataModal, fetchData }) => {
    const [allRoles, setAllRoles] = useState([]);
    const [userRoles, setUserRoles] = useState([]);

    // 1. Lấy danh sách Role hệ thống (Chỉ chạy 1 lần khi mở Modal)
    useEffect(() => {
        if (show) {
            const loadData = async () => {
                let res = await readAllRoles();
                if (res && res.EC === 0) {
                    setAllRoles(res.DT);
                }
            };
            loadData();
        }
    }, [show]);

    // 2. TÁCH BIỆT: Gán role hiện tại của người dùng vào state
    // Dùng useEffect này để chắc chắn khi dataModal thay đổi, state userRoles phải cập nhật ngay
    useEffect(() => {
        if (show && dataModal?.roles) {
            const currentRoleIds = dataModal.roles.map(r => Number(r.id));
            console.log(">>> Danh sách ID role hiện tại của người này:", currentRoleIds);
            setUserRoles(currentRoleIds);
        } else if (show) {
            setUserRoles([]);
        }
    }, [show, dataModal]); // Theo dõi dataModa
    const handleOnChangeRole = (roleId) => {
        const id = Number(roleId);
        setUserRoles(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSave = async () => {
        // Ép kiểu mảng ID sang số nguyên để tránh lỗi Null ở Backend
        const cleanIds = userRoles.map(id => parseInt(id)).filter(id => !isNaN(id));

        let res = await updateRole({
            userId: dataModal.id,
            roleIds: cleanIds
        });

        if (res && res.EC === 0) {
            toast.success("Cập nhật thành công!");
            setShow(false);
            await fetchData(); // Load lại bảng AdminUsers để thấy Badge mới
        } else {
            toast.error(res.EM || "Lỗi hệ thống");
        }
    };

    if (!show) return null;

    return (
        <div className="custom-modal-container">
            {/* Overlay tự viết để không bị khung mờ đằng sau */}
            <div className="custom-overlay" onClick={() => setShow(false)}></div>
            <div className="custom-modal-content shadow-lg">
                <div className="modal-header bg-primary text-white p-3">
                    <h5 className="modal-title fs-6 fw-bold m-0">Phân quyền: {dataModal.user_name}</h5>
                    <button type="button" className="btn-close btn-close-white shadow-none" onClick={() => setShow(false)}></button>
                </div>

                <div className="modal-body p-3">
                    <p className="text-muted mb-3 small fw-bold">CHỌN VAI TRÒ CHO TÀI KHOẢN NÀY:</p>
                    <div className="role-list">
                        {allRoles.map((role) => {
                            const isSelected = userRoles.includes(Number(role.id));
                            return (
                                <label
                                    key={role.id}
                                    className={`role-card d-flex align-items-center p-3 mb-2 border rounded-3 pointer ${isSelected ? 'selected' : ''}`}
                                >
                                    <input
                                        className="form-check-input me-3"
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => handleOnChangeRole(role.id)}
                                    />
                                    <div className="role-info">
                                        <div className={`fw-bold ${isSelected ? 'text-primary' : 'text-dark'}`}>
                                            {role.name}
                                        </div>
                                        <div className="small text-muted" style={{ fontSize: '11px' }}>
                                            {role.description}
                                        </div>
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                </div>

                <div className="modal-footer p-2 bg-light d-flex justify-content-end gap-2">
                    <button className="btn btn-secondary btn-sm px-4" onClick={() => setShow(false)}>Hủy</button>
                    <button className="btn btn-primary btn-sm px-4 fw-bold" onClick={handleSave}>Lưu thay đổi</button>
                </div>
            </div>
        </div>
    );
};

export default ModalRole;