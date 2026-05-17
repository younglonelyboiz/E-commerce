import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const ConfirmModal = ({ 
    show, 
    onHide, 
    onConfirm, 
    title = "Xác nhận", 
    message = "Bạn có chắc chắn muốn thực hiện hành động này?", 
    confirmText = "Xác nhận", 
    cancelText = "Hủy",
    type = "danger" // danger, success, warning, primary
}) => {
    return (
        <Modal show={show} onHide={onHide} centered backdrop="static">
            <Modal.Header closeButton className={`bg-${type} text-white`}>
                <Modal.Title className="fs-6 fw-bold">{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="py-4">
                <p className="mb-0">{message}</p>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    {cancelText}
                </Button>
                <Button variant={type} onClick={onConfirm}>
                    {confirmText}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ConfirmModal;
