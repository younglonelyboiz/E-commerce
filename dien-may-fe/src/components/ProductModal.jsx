import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';

const ProductModal = ({ show, handleClose, action, dataModal, brands, categories, handleSubmitForm }) => {
    const initialState = {
        name: '', sku: '', regular_price: 0, discount_price: 0,
        quantity: 0, brand_id: '', category_id: ''
    };

    const [productData, setProductData] = useState(initialState);
    const [existingImages, setExistingImages] = useState([]);
    const [newImageFiles, setNewImageFiles] = useState([]);
    const [previewNewImages, setPreviewNewImages] = useState([]);
    const [newImageUrls, setNewImageUrls] = useState(['']); // Chứa các link nhập tay
    const [thumbnail, setThumbnail] = useState({ type: '', payload: '' }); // type: 'OLD'|'NEW', payload: url|index
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (show) {
            setErrors({});
            setNewImageFiles([]);
            setPreviewNewImages([]);

            // Kiểm tra dataModal bây giờ phải là object sản phẩm (có name, sku...)
            if (action === 'UPDATE' && dataModal && dataModal.id) {
                let images = [];
                let initialThumb = { type: '', payload: '' };
                if (dataModal.product_images && dataModal.product_images.length > 0) {
                    images = dataModal.product_images;
                    const thumb = images.find(img => img.is_thumbnail === 1) || images[0];
                    if (thumb) initialThumb = { type: 'OLD', payload: thumb.url };
                } else if (dataModal.thumbnailUrl) {
                    images = [{ url: dataModal.thumbnailUrl }];
                    initialThumb = { type: 'OLD', payload: dataModal.thumbnailUrl };
                }
                setExistingImages(images);
                setNewImageUrls([]); // Chế độ sửa không hiện sẵn ô link trống

                setProductData({
                    id: dataModal.id,
                    name: dataModal.name || '',
                    sku: dataModal.sku || '',
                    regular_price: dataModal.regular_price ? Number(dataModal.regular_price) : 0,
                    discount_price: dataModal.discount_price ? Number(dataModal.discount_price) : 0,
                    quantity: dataModal.quantity || 0,
                    brand_id: dataModal.brand_id ? String(dataModal.brand_id) : '',
                    category_id: dataModal.category_id ? String(dataModal.category_id) : ''
                });
                setThumbnail(initialThumb);
            } else {
                setExistingImages([]);
                setNewImageUrls(['']); // Hiện sẵn 1 ô để nhập link cho tiện
                setProductData({
                    name: '', sku: '', regular_price: 0, discount_price: 0,
                    quantity: 0, brand_id: '', category_id: ''
                });
                setThumbnail({ type: '', payload: '' });
            }
        }
    }, [show, dataModal, action]);

    const validateFields = () => {
        let newErrors = {};
        if (!productData.name?.trim()) newErrors.name = true;
        if (!productData.sku?.trim()) newErrors.sku = true;
        if (!productData.category_id) newErrors.category_id = true;
        if (!productData.brand_id) newErrors.brand_id = true;

        const validUrls = newImageUrls.filter(url => url.trim() !== '');
        if (existingImages.length === 0 && newImageFiles.length === 0 && validUrls.length === 0) {
            newErrors.images = true;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleConfirm = async () => {
        if (!validateFields()) {
            toast.error("Vui lòng điền đầy đủ các thông tin bắt buộc!");
            return;
        }

        // Sử dụng FormData để gửi cả TEXT, mảng JSON và FILE vật lý
        const formData = new FormData();
        if (action === 'UPDATE') formData.append("id", productData.id);
        formData.append("name", productData.name);
        formData.append("sku", productData.sku);
        formData.append("regular_price", productData.regular_price);
        formData.append("discount_price", productData.discount_price);
        formData.append("quantity", productData.quantity);
        formData.append("brand_id", productData.brand_id);
        formData.append("category_id", productData.category_id);

        // Reset toàn bộ is_thumbnail cũ về 0 để Backend không bị nhầm lẫn
        const processedExistingImages = existingImages.map(img => ({ ...img, is_thumbnail: 0 }));
        formData.append("keptImages", JSON.stringify(processedExistingImages));
        formData.append("newImageUrls", JSON.stringify(newImageUrls.filter(url => url.trim() !== '')));

        newImageFiles.forEach((file) => {
            formData.append("images", file);
        });

        // Gửi thông tin ảnh đại diện đã được chọn xuống Backend
        if (thumbnail.type === 'OLD') {
            formData.append("thumbnailUrl", thumbnail.payload);
        } else if (thumbnail.type === 'NEW') {
            const validUrlsCount = newImageUrls.filter(url => url.trim() !== '').length;
            const finalIndex = existingImages.length + validUrlsCount + thumbnail.payload;
            formData.append("thumbnailIndex", finalIndex);
        }

        const response = await handleSubmitForm(formData);

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

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        setNewImageFiles(prev => [...prev, ...files]);

        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPreviewNewImages(prev => [...prev, ...newPreviews]);
        setErrors(prev => ({ ...prev, images: false }));

        // Tự động set ảnh đại diện nếu đây là ảnh đầu tiên được tải lên
        if (thumbnail.type === '' && existingImages.length === 0) {
            setThumbnail({ type: 'NEW', payload: 0 });
        }
    };

    const handleRemoveExistingImage = (index) => {
        const removedImg = existingImages[index];
        if (thumbnail.type === 'OLD' && thumbnail.payload === removedImg.url) {
            setThumbnail({ type: '', payload: '' });
        }
        setExistingImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleRemoveNewImage = (index) => {
        // Xử lý giữ nguyên thứ tự thumbnail khi xóa bớt ảnh preview
        if (thumbnail.type === 'NEW' && thumbnail.payload === index) {
            setThumbnail({ type: '', payload: '' });
        } else if (thumbnail.type === 'NEW' && thumbnail.payload > index) {
            setThumbnail({ type: 'NEW', payload: thumbnail.payload - 1 });
        }
        setNewImageFiles(prev => prev.filter((_, i) => i !== index));
        setPreviewNewImages(prev => {
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleUrlChange = (index, value) => {
        const newUrls = [...newImageUrls];
        newUrls[index] = value;
        setNewImageUrls(newUrls);
        setErrors(prev => ({ ...prev, images: false }));
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
                            <label className={`fw-bold small ${errors.images ? 'text-danger' : ''}`}>Hình ảnh sản phẩm (File hoặc Link)</label>
                            <div className="d-flex gap-2">
                                <Button variant="outline-primary" size="sm" onClick={() => setNewImageUrls([...newImageUrls, ''])}>
                                    <i className="bi bi-link-45deg me-1"></i>Thêm Link
                                </Button>
                                <Form.Label className="btn btn-outline-success btn-sm m-0">
                                    <i className="bi bi-upload me-1"></i> Tải file lên
                                    <Form.Control type="file" multiple accept="image/*" hidden onChange={handleImageChange} />
                                </Form.Label>
                            </div>
                        </div>

                        {/* Danh sách input nhập Link ảnh */}
                        {newImageUrls.map((url, index) => (
                            <Row key={index} className="mb-2 g-2 align-items-center">
                                <Col>
                                    <Form.Control
                                        type="text"
                                        placeholder={`Nhập đường dẫn URL của hình ảnh...`}
                                        value={url}
                                        onChange={(e) => handleUrlChange(index, e.target.value)}
                                    />
                                </Col>
                                <Col xs="auto">
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => setNewImageUrls(newImageUrls.filter((_, i) => i !== index))}
                                    >
                                        <i className="bi bi-trash"></i>
                                    </Button>
                                </Col>
                            </Row>
                        ))}

                        {/* Khu vực hiển thị File tải lên & Ảnh cũ */}
                        <div className="d-flex flex-wrap gap-3 mt-3">
                            {existingImages.map((img, index) => (
                                <div key={`old-${index}`} className="position-relative border rounded p-1 overflow-hidden" style={{ width: '110px', height: '110px' }}>
                                    <img src={img.url} alt="old-img" className="w-100 h-100 object-fit-cover rounded" style={{ paddingBottom: '22px' }} />
                                    <button type="button" className="btn btn-sm btn-danger position-absolute top-0 start-100 translate-middle rounded-circle" style={{ width: '24px', height: '24px', padding: 0, lineHeight: 1 }} onClick={() => handleRemoveExistingImage(index)}>
                                        <i className="bi bi-x"></i>
                                    </button>
                                    {thumbnail.type === 'OLD' && thumbnail.payload === img.url ? (
                                        <div className="position-absolute bottom-0 start-0 w-100 text-center bg-success text-white fw-bold" style={{ fontSize: '11px', padding: '4px 0' }}>
                                            <i className="bi bi-check-circle-fill me-1"></i>Đại diện
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            className="btn btn-primary position-absolute bottom-0 start-0 w-100 rounded-0 rounded-bottom border-0"
                                            style={{ fontSize: '11px', padding: '4px 0', opacity: 0.9 }}
                                            onClick={() => setThumbnail({ type: 'OLD', payload: img.url })}
                                        >
                                            Làm đại diện
                                        </button>
                                    )}
                                </div>
                            ))}
                            {previewNewImages.map((url, index) => (
                                <div key={`new-${index}`} className="position-relative border rounded p-1 border-success overflow-hidden" style={{ width: '110px', height: '110px' }}>
                                    <img src={url} alt="new-img" className="w-100 h-100 object-fit-cover rounded" style={{ paddingBottom: '22px' }} />
                                    <button type="button" className="btn btn-sm btn-danger position-absolute top-0 start-100 translate-middle rounded-circle" style={{ width: '24px', height: '24px', padding: 0, lineHeight: 1 }} onClick={() => handleRemoveNewImage(index)}>
                                        <i className="bi bi-x"></i>
                                    </button>
                                    {thumbnail.type === 'NEW' && thumbnail.payload === index ? (
                                        <div className="position-absolute bottom-0 start-0 w-100 text-center bg-success text-white fw-bold" style={{ fontSize: '11px', padding: '4px 0' }}>
                                            <i className="bi bi-check-circle-fill me-1"></i>Đại diện
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            className="btn btn-primary position-absolute bottom-0 start-0 w-100 rounded-0 rounded-bottom border-0"
                                            style={{ fontSize: '11px', padding: '4px 0', opacity: 0.9 }}
                                            onClick={() => setThumbnail({ type: 'NEW', payload: index })}
                                        >
                                            Làm đại diện
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        {errors.images && <div className="text-danger small mt-2">Vui lòng cung cấp ít nhất 1 hình ảnh!</div>}
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