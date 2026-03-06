import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';

const ProductModal = ({ show, handleClose, action, dataModal, brands, categories, handleSubmitForm }) => {
    const [productData, setProductData] = useState({
        name: '', sku: '', regular_price: '', discount_price: '',
        quantity: 0, brand_id: '', category_id: '', images: ['']
    });

    // Trong ProductModal.jsx
    useEffect(() => {
        if (action === 'UPDATE' && dataModal && dataModal.id) {
            // Fill dữ liệu từ DB vào Form
            setProductData({
                id: dataModal.id,
                name: dataModal.name || '',
                sku: dataModal.sku || '',
                regular_price: dataModal.regular_price || 0,
                discount_price: dataModal.discount_price || 0,
                quantity: dataModal.quantity || 0,
                brand_id: dataModal.brand_id || '',
                category_id: dataModal.category_id || '',
                // Map mảng ảnh từ DB (nếu có)
                images: dataModal.product_images?.length > 0
                    ? dataModal.product_images.map(img => img.url)
                    : ['']
            });
        } else if (action === 'CREATE') {
            // Reset Form khi Thêm mới
            setProductData({
                name: '', sku: '', regular_price: 0, discount_price: 0,
                quantity: 0, brand_id: '', category_id: '', images: ['']
            });
        }
    }, [dataModal, action]);

    // Thêm một ô nhập URL ảnh mới
    const handleAddImageInput = () => {
        setProductData({ ...productData, images: [...productData.images, ''] });
    };

    // Cập nhật giá trị URL ảnh tại vị trí index
    const handleImageInputChange = (index, value) => {
        const newImages = [...productData.images];
        newImages[index] = value;
        setProductData({ ...productData, images: newImages });
    };

    // Xóa một ô nhập ảnh
    const handleRemoveImageInput = (index) => {
        const newImages = productData.images.filter((_, i) => i !== index);
        setProductData({ ...productData, images: newImages.length > 0 ? newImages : [''] });
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg" backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title className="fw-bold text-primary">
                    {action === 'CREATE' ? 'Thêm sản phẩm mới' : 'Chỉnh sửa sản phẩm'}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    {/* Tên và SKU */}
                    <Row className="mb-3">
                        <Form.Group as={Col} md={8}>
                            <Form.Label className="fw-bold small">Tên sản phẩm</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Nhập tên sản phẩm..."
                                value={productData.name}
                                onChange={(e) => setProductData({ ...productData, name: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group as={Col} md={4}>
                            <Form.Label className="fw-bold small">Mã SKU</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Ví dụ: SP-00001"
                                value={productData.sku}
                                onChange={(e) => setProductData({ ...productData, sku: e.target.value })}
                            />
                        </Form.Group>
                    </Row>

                    {/* Danh mục và Thương hiệu */}
                    <Row className="mb-3">
                        <Form.Group as={Col}>
                            <Form.Label className="fw-bold small">Danh mục</Form.Label>
                            <Form.Select
                                value={productData.category_id}
                                onChange={(e) => setProductData({ ...productData, category_id: e.target.value })}
                            >
                                <option value="">Chọn danh mục...</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group as={Col}>
                            <Form.Label className="fw-bold small">Thương hiệu</Form.Label>
                            <Form.Select
                                value={productData.brand_id}
                                onChange={(e) => setProductData({ ...productData, brand_id: e.target.value })}
                            >
                                <option value="">Chọn thương hiệu...</option>
                                {brands.map(brand => (
                                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Row>

                    {/* Giá và Số lượng */}
                    <Row className="mb-3">
                        <Form.Group as={Col}>
                            <Form.Label className="fw-bold small">Giá gốc (đ)</Form.Label>
                            <Form.Control
                                type="number"
                                value={productData.regular_price}
                                onChange={(e) => setProductData({ ...productData, regular_price: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group as={Col}>
                            <Form.Label className="fw-bold small">Giá bán (đ)</Form.Label>
                            <Form.Control
                                type="number"
                                value={productData.discount_price}
                                onChange={(e) => setProductData({ ...productData, discount_price: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group as={Col}>
                            <Form.Label className="fw-bold small">Số lượng tồn kho (Quantity)</Form.Label>
                            <Form.Control
                                type="number"
                                value={productData.quantity}
                                onChange={(e) => setProductData({ ...productData, quantity: e.target.value })}
                            />
                        </Form.Group>
                    </Row>

                    {/* Quản lý danh sách URL Ảnh */}
                    <div className="mt-4">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <label className="fw-bold small">Danh sách URL Hình ảnh</label>
                            <Button variant="outline-primary" size="sm" onClick={handleAddImageInput}>
                                <i className="bi bi-plus-lg me-1"></i>Thêm ảnh
                            </Button>
                        </div>
                        {productData.images.map((url, index) => (
                            <Row key={index} className="mb-2 g-2 align-items-center">
                                <Col>
                                    <Form.Control
                                        type="text"
                                        placeholder={`URL ảnh ${index + 1} ${index === 0 ? '(Làm ảnh đại diện)' : ''}`}
                                        value={url}
                                        onChange={(e) => handleImageInputChange(index, e.target.value)}
                                    />
                                </Col>
                                <Col xs="auto">
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => handleRemoveImageInput(index)}
                                        disabled={productData.images.length === 1}
                                    >
                                        <i className="bi bi-trash"></i>
                                    </Button>
                                </Col>
                            </Row>
                        ))}
                        <Form.Text className="text-muted">
                            Ảnh đầu tiên sẽ được hệ thống đặt làm ảnh đại diện (Thumbnail).
                        </Form.Text>
                    </div>
                </Form>
            </Modal.Body>
            <Modal.Footer className="bg-light">
                <Button variant="secondary" onClick={handleClose}>Đóng</Button>
                <Button variant="primary" className="px-4" onClick={() => handleSubmitForm(productData)}>
                    {action === 'CREATE' ? 'Xác nhận thêm' : 'Lưu thay đổi'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

// Modal xác nhận xóa
const ModalDelete = ({ show, handleClose, dataModal, confirmDelete }) => {
    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton className="bg-danger text-white">
                <Modal.Title className="h6">Xác nhận xóa vĩnh viễn</Modal.Title>
            </Modal.Header>
            <Modal.Body className="py-4 text-center">
                <i className="bi bi-exclamation-triangle text-danger display-4 mb-3 d-block"></i>
                <p className="mb-0">Bạn có chắc chắn muốn xóa sản phẩm:</p>
                <h5 className="fw-bold mt-2">{dataModal?.name}</h5>
                <p className="text-muted small mt-3">Hành động này không thể hoàn tác và sẽ xóa toàn bộ dữ liệu liên quan.</p>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>Hủy bỏ</Button>
                <Button variant="danger" className="px-4" onClick={() => confirmDelete(dataModal.id)}>
                    Đồng ý xóa
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export { ProductModal, ModalDelete };