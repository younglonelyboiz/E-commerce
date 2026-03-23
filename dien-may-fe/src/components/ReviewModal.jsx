import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { createReviewApi } from "../services/reviewService";
import "./ReviewModal.scss";

const ReviewModal = ({ show, handleClose, orderId, product, existingReview, onSuccess }) => {
    const [rating, setRating] = useState(5);
    const [hover, setHover] = useState(0);
    const [content, setContent] = useState("");
    const [images, setImages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const isReadOnly = !!existingReview; // Chế độ chỉ xem

    // Đồng bộ dữ liệu đánh giá cũ vào Form khi mở Modal
    useEffect(() => {
        if (existingReview) {
            setRating(existingReview.rating || 5);
            setContent(existingReview.content || "");

            // Xử lý cẩn thận phòng trường hợp Database trả mảng ảnh về dưới dạng chuỗi JSON
            let parsedImages = existingReview.images || [];
            if (typeof parsedImages === 'string') {
                try {
                    parsedImages = JSON.parse(parsedImages);
                } catch (error) {
                    parsedImages = [];
                }
            }
            setImages(parsedImages);
        } else {
            // Reset state nếu là đánh giá mới
            setRating(5);
            setContent("");
            setImages([]);
        }
    }, [existingReview]);

    // Hàm xử lý chọn ảnh và tạo URL Preview tạm thời
    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 3) {
            toast.warning("Chỉ được tải lên tối đa 3 ảnh!");
            return;
        }

        const imageUrls = files.map((file) => URL.createObjectURL(file));
        setImages(imageUrls);
        // Thực tế dự án: Bạn cần gọi API upload ảnh lên server (Cloudinary/S3) 
        // rồi lấy mảng URL thật trả về để set vào state. Ở đây dùng ObjectURL để demo Preview.
    };

    const handleSubmit = async () => {
        if (!content.trim()) {
            toast.warning("Vui lòng nhập nội dung đánh giá!");
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                order_id: orderId,
                product_id: product?.product_id,
                rating,
                content,
                images: images, // Truyền mảng URL ảnh
            };

            const res = await createReviewApi(payload);
            if (res && res.EC === 0) {
                toast.success(res.EM);
                onSuccess(); // Callback để load lại danh sách bên ngoài
                handleClose();
            } else {
                toast.error(res?.EM || "Lỗi khi gửi đánh giá");
            }
        } catch (error) {
            toast.error("Lỗi hệ thống");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={handleClose} centered size="lg" className="review-modal">
            <Modal.Header closeButton>
                <Modal.Title className="fs-5">Đánh giá sản phẩm</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {product && (
                    <div className="d-flex align-items-center mb-4">
                        <Link
                            to={`/product/${product.slug || product.product_id}`}
                            className="d-flex align-items-center text-decoration-none text-dark w-100"
                            onClick={handleClose}
                        >
                            {product.image ? (
                                <img src={product.image} alt={product.name} width={80} height={80} className="me-3 rounded border shadow-sm" style={{ objectFit: 'cover' }} />
                            ) : (
                                <div className="bg-light rounded d-flex align-items-center justify-content-center me-3 border shadow-sm" style={{ minWidth: '80px', height: '80px' }}>
                                    <i className="bi bi-box-seam text-secondary fs-1"></i>
                                </div>
                            )}
                            <span className="fw-bold text-wrap fs-5 product-name-hover" style={{ transition: "color 0.2s" }} onMouseEnter={(e) => e.target.style.color = "#0d6efd"} onMouseLeave={(e) => e.target.style.color = "inherit"}>{product.name}</span>
                        </Link>
                    </div>
                )}

                {/* Khu vực chọn sao có Hover Effect */}
                <div className="text-center mb-3">
                    <h6 className="mb-2">{isReadOnly ? "Đánh giá của bạn về sản phẩm này:" : "Chất lượng sản phẩm tuyệt vời chứ?"}</h6>
                    <div>
                        {[...Array(5)].map((_, index) => {
                            const starValue = index + 1;
                            return (
                                <i
                                    key={starValue}
                                    className={`fas fa-star star-rating ${starValue <= (hover || rating) ? "active" : ""}`}
                                    onClick={() => !isReadOnly && setRating(starValue)}
                                    onMouseEnter={() => !isReadOnly && setHover(starValue)}
                                    onMouseLeave={() => !isReadOnly && setHover(0)}
                                    style={{ cursor: isReadOnly ? "default" : "pointer" }}
                                ></i>
                            );
                        })}
                    </div>
                </div>

                {/* Nội dung đánh giá */}
                <Form.Group className="mb-3">
                    <Form.Control
                        as="textarea"
                        rows={5}
                        placeholder="Hãy chia sẻ nhận xét của bạn về sản phẩm này nhé (Tối thiểu 10 ký tự)..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        readOnly={isReadOnly}
                    />
                </Form.Group>

                {/* Upload ảnh & Preview */}
                {!isReadOnly && (
                    <Form.Group className="mb-3">
                        <Form.Label className="btn btn-outline-secondary btn-sm m-0">
                            <i className="fas fa-camera me-2"></i> Thêm hình ảnh
                            <Form.Control type="file" multiple accept="image/*" hidden onChange={handleImageChange} />
                        </Form.Label>
                    </Form.Group>
                )}

                {images && images.length > 0 && (
                    <div className="image-preview-container mb-3">
                        {images.map((url, idx) => (
                            <img key={idx} src={url} alt="preview" className="image-preview border" />
                        ))}
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer>
                {!isReadOnly ? (
                    <Button variant="danger" className="w-100" onClick={handleSubmit} disabled={isLoading}>
                        {isLoading ? "Đang gửi..." : "Hoàn thành"}
                    </Button>
                ) : (
                    <Button variant="secondary" className="w-100" onClick={handleClose}>
                        Đóng
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    );
};
export default ReviewModal;