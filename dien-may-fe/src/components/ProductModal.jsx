import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';

const ProductModal = ({ show, handleClose, action, dataModal, brands, categories, handleSubmitForm }) => {
    const initialState = {
        name: '', sku: '', regular_price: 0, discount_price: 0,
        quantity: 0, brand_id: '', category_id: '', images: ['']
    };

    const [productData, setProductData] = useState(initialState);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (show) {
            setErrors({});

            // Kiểm tra dataModal bây giờ phải là object sản phẩm (có name, sku...)
            if (action === 'UPDATE' && dataModal && dataModal.id) {
                // Lấy danh sách ảnh từ product_images array hoặc thumbnailUrl
                let images = [];
                if (dataModal.product_images && dataModal.product_images.length > 0) {
                    // Lấy tất cả URL từ mảng product_images
                    images = dataModal.product_images.map(img => img.url);
                } else if (dataModal.thumbnailUrl) {
                    images = [dataModal.thumbnailUrl];
                } else {
                    images = [''];
                }

                setProductData({
                    id: dataModal.id,
                    name: dataModal.name || '',
                    sku: dataModal.sku || '',
                    // Ép kiểu String từ API sang Number cho input
                    regular_price: dataModal.regular_price ? Number(dataModal.regular_price) : 0,
                    discount_price: dataModal.discount_price ? Number(dataModal.discount_price) : 0,
                    quantity: dataModal.quantity || 0,
                    // Ép kiểu ID về String để khớp với value của <option>
                    brand_id: dataModal.brand_id ? String(dataModal.brand_id) : '',
                    category_id: dataModal.category_id ? String(dataModal.category_id) : '',
                    images: images
                });
            } else {
                setProductData({
                    name: '', sku: '', regular_price: 0, discount_price: 0,
                    quantity: 0, brand_id: '', category_id: '', images: ['']
                });
            }
        }
    }, [show, dataModal, action]);

    const validateFields = () => {
        let newErrors = {};
        if (!productData.name?.trim()) newErrors.name = true;
        if (!productData.sku?.trim()) newErrors.sku = true;
        if (!productData.category_id) newErrors.category_id = true;
        if (!productData.brand_id) newErrors.brand_id = true;
        if (!productData.images[0]?.trim()) newErrors.images = true;

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleConfirm = async () => {
        if (!validateFields()) {
            toast.error("Vui lòng điền đầy đủ các thông tin bắt buộc!");
            return;
        }

        const response = await handleSubmitForm(productData);

        if (response && response.EC === 0) {
            toast.success(response.EM);
            handleClose();
        } else {
            toast.error(response.EM || "Có lỗi xảy ra!");
            if (response.EM?.includes("SKU")) {
                setErrors(prev => ({ ...prev, sku: true }));
            }
        }
    };

    const handleImageInputChange = (index, value) => {
        const newImages = [...productData.images];
        newImages[index] = value;
        setProductData({ ...productData, images: newImages });
        if (index === 0) setErrors(prev => ({ ...prev, images: false }));
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
                    <Row className="mb-3">
                        <Form.Group as={Col} md={8}>
                            <Form.Label className="fw-bold small">Tên sản phẩm</Form.Label>
                            <Form.Control
                                type="text"
                                isInvalid={errors.name}
                                value={productData.name}
                                onChange={(e) => {
                                    setProductData({ ...productData, name: e.target.value });
                                    setErrors(prev => ({ ...prev, name: false }));
                                }}
                            />
                        </Form.Group>
                        <Form.Group as={Col} md={4}>
                            <Form.Label className="fw-bold small">Mã SKU</Form.Label>
                            <Form.Control
                                type="text"
                                isInvalid={errors.sku}
                                value={productData.sku}
                                onChange={(e) => {
                                    setProductData({ ...productData, sku: e.target.value });
                                    setErrors(prev => ({ ...prev, sku: false }));
                                }}
                            />
                        </Form.Group>
                    </Row>

                    <Row className="mb-3">
                        <Form.Group as={Col}>
                            <Form.Label className="fw-bold small">Danh mục</Form.Label>
                            <Form.Select
                                isInvalid={errors.category_id}
                                value={productData.category_id}
                                onChange={(e) => {
                                    setProductData({ ...productData, category_id: e.target.value });
                                    setErrors(prev => ({ ...prev, category_id: false }));
                                }}
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
                                isInvalid={errors.brand_id}
                                value={productData.brand_id}
                                onChange={(e) => {
                                    setProductData({ ...productData, brand_id: e.target.value });
                                    setErrors(prev => ({ ...prev, brand_id: false }));
                                }}
                            >
                                <option value="">Chọn thương hiệu...</option>
                                {brands.map(brand => (
                                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Row>

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
                            <Form.Label className="fw-bold small">Số lượng</Form.Label>
                            <Form.Control
                                type="number"
                                value={productData.quantity}
                                onChange={(e) => setProductData({ ...productData, quantity: e.target.value })}
                            />
                        </Form.Group>
                    </Row>

                    <div className="mt-4">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <label className="fw-bold small">Danh sách URL Hình ảnh</label>
                            <Button variant="outline-primary" size="sm" onClick={() => setProductData({ ...productData, images: [...productData.images, ''] })}>
                                <i className="bi bi-plus-lg me-1"></i>Thêm ảnh
                            </Button>
                        </div>
                        {productData.images.map((url, index) => (
                            <Row key={index} className="mb-2 g-2 align-items-center">
                                <Col>
                                    <Form.Control
                                        type="text"
                                        isInvalid={index === 0 && errors.images}
                                        placeholder={`URL ảnh ${index + 1} ${index === 0 ? '(Bắt buộc)' : ''}`}
                                        value={url}
                                        onChange={(e) => handleImageInputChange(index, e.target.value)}
                                    />
                                </Col>
                                <Col xs="auto">
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => {
                                            const newImages = productData.images.filter((_, i) => i !== index);
                                            setProductData({ ...productData, images: newImages.length > 0 ? newImages : [''] });
                                        }}
                                        disabled={productData.images.length === 1}
                                    >
                                        <i className="bi bi-trash"></i>
                                    </Button>
                                </Col>
                            </Row>
                        ))}
                    </div>
                </Form>
            </Modal.Body>
            <Modal.Footer className="bg-light">
                <Button variant="secondary" onClick={handleClose}>Đóng</Button>
                <Button variant="primary" className="px-4" onClick={handleConfirm}>
                    {action === 'CREATE' ? 'Xác nhận thêm' : 'Lưu thay đổi'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

// Modal Delete 
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
                <p className="text-muted small mt-3">Hành động này không thể hoàn tác.</p>
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