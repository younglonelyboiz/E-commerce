import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Badge } from "react-bootstrap";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { getAllReviewsAdminApi, replyReviewAdminApi } from "../services/reviewService";

const AdminReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filter, setFilter] = useState("all"); // all, pending (chưa trả lời), replied
    const [starFilter, setStarFilter] = useState(null); // State lọc theo số sao

    // State cho Modal Reply
    const [showModal, setShowModal] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);
    const [replyContent, setReplyContent] = useState("");

    useEffect(() => {
        fetchReviews();
    }, [page, filter, starFilter]);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            let params = { page, limit: 10 };
            if (filter === "pending") params.hasReply = 'false';
            if (filter === "replied") params.hasReply = 'true';
            if (starFilter) params.star = starFilter; // Truyền params star xuống Backend

            const res = await getAllReviewsAdminApi(params);
            if (res && res.EC === 0) {
                setReviews(res.DT.reviews);
                setTotalPages(res.DT.totalPages);
            }
        } catch (error) {
            toast.error("Lỗi tải danh sách đánh giá");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenReplyModal = (review) => {
        setSelectedReview(review);
        setReplyContent(review.reply || "");
        setShowModal(true);
    };

    const handleSaveReply = async () => {
        if (!replyContent.trim()) {
            toast.warning("Vui lòng nhập nội dung phản hồi!");
            return;
        }
        try {
            const res = await replyReviewAdminApi(selectedReview.id, replyContent);
            if (res && res.EC === 0) {
                toast.success("Đã lưu phản hồi!");
                setShowModal(false);
                fetchReviews(); // Tải lại dữ liệu
            } else {
                toast.error(res?.EM || "Lỗi khi phản hồi");
            }
        } catch (error) {
            toast.error("Lỗi hệ thống");
        }
    };

    const renderStars = (rating) => {
        return [...Array(5)].map((_, i) => (
            <i key={i} className={`bi bi-star-fill ${i < rating ? "text-warning" : "text-secondary"}`}></i>
        ));
    };

    // Tạo danh sách trang hiển thị dạng 1 2 ... n-1 n
    const getPageNumbers = () => {
        let pages = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (page <= 3) {
                pages = [1, 2, 3, 4, '...', totalPages];
            } else if (page >= totalPages - 2) {
                pages = [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
            } else {
                pages = [1, '...', page - 1, page, page + 1, '...', totalPages];
            }
        }
        return pages;
    };

    return (
        <div className="container-fluid p-4">
            <h2 className="mb-4">Quản lý Đánh giá Khách hàng</h2>

            <div className="d-flex mb-3 gap-2 align-items-center">
                <Button variant={filter === "all" ? "primary" : "outline-primary"} onClick={() => { setFilter("all"); setPage(1); }}>Tất cả</Button>
                <Button variant={filter === "pending" ? "warning" : "outline-warning"} onClick={() => { setFilter("pending"); setPage(1); }}>Chưa phản hồi</Button>
                <Button variant={filter === "replied" ? "success" : "outline-success"} onClick={() => { setFilter("replied"); setPage(1); }}>Đã phản hồi</Button>

                {/* Dropdown lọc theo sao (Nằm dạt về bên phải) */}
                <div className="ms-auto">
                    <Form.Select
                        value={starFilter || ""}
                        onChange={(e) => { setStarFilter(e.target.value ? Number(e.target.value) : null); setPage(1); }}
                        style={{ minWidth: '150px' }}
                    >
                        <option value="">Tất cả số sao</option>
                        <option value="5">5 Sao</option>
                        <option value="4">4 Sao</option>
                        <option value="3">3 Sao</option>
                        <option value="2">2 Sao</option>
                        <option value="1">1 Sao</option>
                    </Form.Select>
                </div>
            </div>

            <div className="card shadow-sm border-0">
                <div className="card-body p-0 table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>Khách hàng</th>
                                <th>Sản phẩm</th>
                                <th>Đánh giá</th>
                                <th>Nội dung</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="text-center py-4"><div className="spinner-border text-primary"></div></td></tr>
                            ) : reviews.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-4 text-muted">Không có dữ liệu</td></tr>
                            ) : (
                                reviews.map(r => (
                                    <tr key={r.id}>
                                        <td>
                                            <div className="fw-bold">{r.user?.user_name || 'Vô danh'}</div>
                                            <small className="text-muted">{new Date(r.created_at).toLocaleDateString('vi-VN')}</small>
                                        </td>
                                        <td className="text-wrap" style={{ maxWidth: '200px' }}>
                                            <Link to={`/product/${r.product?.slug || r.product?.id}`} target="_blank" className="text-primary text-decoration-none" style={{ cursor: 'pointer' }}>
                                                {r.product?.name}
                                            </Link>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.9rem' }}>{renderStars(r.rating)}</div>
                                        </td>
                                        <td className="text-wrap" style={{ maxWidth: '250px' }}>
                                            <p className="mb-1">{r.content}</p>
                                            {r.images && (
                                                <div className="d-flex gap-1">
                                                    {(typeof r.images === 'string' ? JSON.parse(r.images) : r.images).map((img, i) => (
                                                        <img key={i} src={img} alt="review" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            {r.reply ? <Badge bg="success">Đã phản hồi</Badge> : <Badge bg="warning" text="dark">Chờ phản hồi</Badge>}
                                        </td>
                                        <td>
                                            <Button variant="outline-primary" size="sm" onClick={() => handleOpenReplyModal(r)}>
                                                {r.reply ? "Sửa trả lời" : "Phản hồi"}
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Phân trang */}
            {!loading && totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4 mb-4">
                    <Button variant="outline-secondary" size="sm" className="me-2" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                        &laquo;
                    </Button>
                    {getPageNumbers().map((p, index) => (
                        <Button
                            key={index}
                            variant={p === page ? 'primary' : 'outline-secondary'}
                            size="sm"
                            className="mx-1"
                            onClick={() => p !== '...' && setPage(p)}
                            disabled={p === '...'}
                            style={p === '...' ? { border: 'none', background: 'transparent', color: '#6c757d' } : {}}
                        >
                            {p}
                        </Button>
                    ))}
                    <Button variant="outline-secondary" size="sm" className="ms-2" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                        &raquo;
                    </Button>
                </div>
            )}

            {/* Modal Phản hồi */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="fs-5">Phản hồi khách hàng</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedReview && (
                        <>
                            <div className="bg-light p-3 rounded mb-3">
                                <div className="fw-bold mb-1">{selectedReview.user?.user_name} <span className="fw-normal text-muted ms-2">{renderStars(selectedReview.rating)}</span></div>
                                <div>{selectedReview.content}</div>
                            </div>
                            <Form.Group>
                                <Form.Label>Nội dung cửa hàng phản hồi:</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={4}
                                    placeholder="Xin chào bạn, cảm ơn bạn đã đánh giá..."
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                />
                            </Form.Group>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</Button>
                    <Button variant="primary" onClick={handleSaveReply}>Lưu phản hồi</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};
export default AdminReviews;