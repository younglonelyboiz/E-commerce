import React, { useState, useEffect } from "react";
import { getReviewsApi } from "../services/reviewService";
import "./ReviewList.scss";

const ReviewList = ({ productId }) => {
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState({ averageStar: 0, totalReviewCount: 0 });
    const [loading, setLoading] = useState(true);

    // State cho bộ lọc và phân trang
    const [filter, setFilter] = useState({ star: null, hasImage: false });
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        if (productId) {
            fetchReviews();
        }
    }, [productId, filter, page]);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const params = {
                page: page,
                limit: 5,
                star: filter.star,
                hasImage: filter.hasImage ? 'true' : undefined
            };
            const res = await getReviewsApi(productId, params);

            if (res && res.EC === 0) {
                setReviews(res.DT.reviews);
                setStats({
                    averageStar: res.DT.averageStar,
                    totalReviewCount: res.DT.totalReviewCount
                });
                setTotalPages(res.DT.totalPages);
            }
        } catch (error) {
            console.error("Lỗi khi tải đánh giá:", error);
        } finally {
            setLoading(false);
        }
    };

    // Đổi bộ lọc (Reset về trang 1)
    const handleFilterChange = (type, value) => {
        setFilter(prev => {
            const newFilter = { ...prev };
            if (type === 'star') newFilter.star = newFilter.star === value ? null : value;
            if (type === 'hasImage') newFilter.hasImage = !newFilter.hasImage;
            return newFilter;
        });
        setPage(1);
    };

    // Render Ngôi sao
    const renderStars = (rating) => {
        return [...Array(5)].map((_, index) => (
            <i key={index} className={`fas fa-star ${index < rating ? "star-gold" : "star-gray"}`}></i>
        ));
    };

    // Hiển thị khung chờ Skeleton
    const renderSkeleton = () => (
        <div className="py-4 border-bottom">
            <div className="d-flex mb-3">
                <div className="skeleton rounded-circle me-3" style={{ width: '40px', height: '40px' }}></div>
                <div>
                    <div className="skeleton mb-2" style={{ width: '120px', height: '16px' }}></div>
                    <div className="skeleton" style={{ width: '80px', height: '12px' }}></div>
                </div>
            </div>
            <div className="skeleton mb-2 w-100" style={{ height: '16px' }}></div>
            <div className="skeleton w-75" style={{ height: '16px' }}></div>
        </div>
    );

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
        <div className="review-list-container bg-white p-4 rounded shadow-sm mt-4">
            <h4 className="fw-bold mb-4">Khách hàng đánh giá</h4>

            {/* Phần Header: Tổng quan & Filter */}
            <div className="row bg-light p-4 rounded mb-4 align-items-center border">
                {/* Tổng quan Điểm */}
                <div className="col-md-3 text-center border-end mb-3 mb-md-0">
                    <div className="display-4 fw-bold text-danger">
                        {stats.averageStar || 0} <span className="fs-4 text-muted">/ 5</span>
                    </div>
                    <div className="fs-5 mb-1">{renderStars(Math.round(stats.averageStar || 0))}</div>
                    <div className="text-muted small">{stats.totalReviewCount} đánh giá</div>
                </div>

                {/* Các nút Filter */}
                <div className="col-md-9 px-md-4">
                    <button
                        className={`btn filter-btn ${!filter.star && !filter.hasImage ? 'active' : ''}`}
                        onClick={() => { setFilter({ star: null, hasImage: false }); setPage(1); }}
                    >
                        Tất cả
                    </button>
                    {[5, 4, 3, 2, 1].map(star => (
                        <button
                            key={star}
                            className={`btn filter-btn ${filter.star === star ? 'active' : ''}`}
                            onClick={() => handleFilterChange('star', star)}
                        >
                            {star} Sao
                        </button>
                    ))}
                    <button
                        className={`btn filter-btn ${filter.hasImage ? 'active' : ''}`}
                        onClick={() => handleFilterChange('hasImage', true)}
                    >
                        <i className="fas fa-camera me-1"></i> Có hình ảnh
                    </button>
                </div>
            </div>

            {/* Danh sách Đánh giá */}
            <div className="review-list">
                {loading ? (
                    [...Array(3)].map((_, i) => <div key={i}>{renderSkeleton()}</div>)
                ) : reviews.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                        <i className="fas fa-comment-slash fs-1 mb-3 opacity-50"></i>
                        <h5>Chưa có đánh giá nào phù hợp</h5>
                    </div>
                ) : (
                    reviews.map((review) => {
                        // Xử lý chuỗi JSON ảnh an toàn
                        let images = [];
                        try { images = typeof review.images === 'string' ? JSON.parse(review.images) : review.images; } catch (e) { }

                        return (
                            <div key={review.id} className="py-4 border-bottom">
                                <div className="d-flex mb-2 align-items-center">
                                    <div className="user-avatar me-3">
                                        {review.user?.user_name?.charAt(0).toUpperCase() || "U"}
                                    </div>
                                    <div>
                                        <h6 className="mb-0 fw-bold">{review.user?.user_name || "Khách hàng"}</h6>
                                        <div className="d-flex align-items-center">
                                            <div className="me-2" style={{ fontSize: '14px' }}>{renderStars(review.rating)}</div>
                                            <small className="text-muted">{new Date(review.created_at).toLocaleDateString('vi-VN')}</small>
                                        </div>
                                    </div>
                                </div>

                                <p className="mt-3 mb-2">{review.content}</p>

                                {images && images.length > 0 && (
                                    <div className="d-flex gap-2 mt-2">
                                        {images.map((img, idx) => (
                                            <img key={idx} src={img} alt="review" className="rounded border" style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
                                        ))}
                                    </div>
                                )}

                                {review.reply && (
                                    <div className="bg-light p-3 mt-3 rounded border-start border-4 border-danger">
                                        <div className="fw-bold text-danger mb-1"><i className="fas fa-store me-1"></i> Phản hồi từ người bán:</div>
                                        <div>{review.reply}</div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Phân trang */}
            {!loading && totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                    <button className="btn btn-outline-secondary me-2" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                        &laquo;
                    </button>
                    {getPageNumbers().map((p, index) => (
                        <button
                            key={index}
                            className={`btn mx-1 ${p === page ? 'btn-danger' : 'btn-outline-secondary'}`}
                            onClick={() => p !== '...' && setPage(p)}
                            disabled={p === '...'}
                            style={p === '...' ? { border: 'none', background: 'transparent', color: '#6c757d' } : {}}
                        >
                            {p}
                        </button>
                    ))}
                    <button className="btn btn-outline-secondary ms-2" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                        &raquo;
                    </button>
                </div>
            )}
        </div>
    );
};
export default ReviewList;