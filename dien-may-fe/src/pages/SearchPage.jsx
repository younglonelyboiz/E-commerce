import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from '../setup/axios'; // Nhúng file cấu hình axios có sẵn của bạn

function SearchPage() {
    const [searchParams] = useSearchParams();
    const keyword = searchParams.get('keyword') || '';
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalRows, setTotalRows] = useState(0);
    const [limit, setLimit] = useState(24); // Mặc định hiển thị 24 sản phẩm

    // States cho bộ lọc
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [sortOption, setSortOption] = useState('id_desc'); // Mặc định hiển thị Mới nhất

    // Lấy danh sách danh mục (để cho vào dropdown)
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await axios.get('/categories');
                if (res && res.EC === 0) {
                    setCategories(res.DT || []);
                }
            } catch (error) {
                console.error("Lỗi fetch categories:", error);
            }
        };
        fetchCategories();
    }, []);

    // Reset limit về 24 khi thay đổi từ khóa
    useEffect(() => {
        setLimit(24);
    }, [keyword]);

    useEffect(() => {
        const fetchSearchResults = async () => {
            setLoading(true);
            try {
                // Xây dựng chuỗi truy vấn (query string) dựa trên các bộ lọc
                let query = `/products?limit=${limit}&sort=${sortOption}`;
                if (keyword.trim()) query += `&search=${encodeURIComponent(keyword.trim())}`;
                if (selectedCategory) query += `&categoryId=${selectedCategory}`;
                if (priceRange.min !== '') query += `&minPrice=${priceRange.min}`;
                if (priceRange.max !== '') query += `&maxPrice=${priceRange.max}`;

                const res = await axios.get(query);
                if (res && res.EC === 0) {
                    setProducts(res.DT.products || []);
                    setTotalRows(res.DT.totalRows || 0); // Lưu lại tổng số sản phẩm tìm được
                } else {
                    setProducts([]);
                    setTotalRows(0);
                }
            } catch (error) {
                console.error("Lỗi khi tìm kiếm:", error);
                setProducts([]);
                setTotalRows(0);
            }
            setLoading(false);
        };

        fetchSearchResults();
    }, [keyword, selectedCategory, priceRange, sortOption, limit]); // Cập nhật lại khi bộ lọc hoặc limit thay đổi

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price);

    const handlePriceSelect = (min, max) => {
        setPriceRange({ min, max });
        setLimit(24); // Reset phân trang khi đổi bộ lọc
    };

    return (
        <div className="container py-4" style={{ minHeight: '60vh' }}>
            <div className="row">
                {/* Sidebar Lọc */}
                <div className="col-lg-3 mb-4">
                    <div className="card shadow-sm border-0 p-3 sticky-top" style={{ top: '90px' }}>
                        <h5 className="fw-bold mb-3"><i className="bi bi-funnel"></i> Bộ lọc tìm kiếm</h5>

                        {/* Lọc theo danh mục */}
                        <div className="mb-4">
                            <h6 className="fw-bold">Theo danh mục</h6>
                            <select
                                className="form-select"
                                value={selectedCategory}
                                onChange={(e) => {
                                    setSelectedCategory(e.target.value);
                                    setLimit(24);
                                }}
                            >
                                <option value="">Tất cả danh mục</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Lọc theo giá */}
                        <div className="mb-4">
                            <h6 className="fw-bold">Theo mức giá</h6>
                            <div className="d-flex flex-column gap-2">
                                <div className="form-check">
                                    <input className="form-check-input" type="radio" name="priceFilter" id="priceAll" checked={priceRange.min === '' && priceRange.max === ''} onChange={() => handlePriceSelect('', '')} />
                                    <label className="form-check-label" htmlFor="priceAll">Tất cả mức giá</label>
                                </div>
                                <div className="form-check">
                                    <input className="form-check-input" type="radio" name="priceFilter" id="price1" checked={priceRange.max === 5000000} onChange={() => handlePriceSelect(0, 5000000)} />
                                    <label className="form-check-label" htmlFor="price1">Dưới 5 triệu</label>
                                </div>
                                <div className="form-check">
                                    <input className="form-check-input" type="radio" name="priceFilter" id="price2" checked={priceRange.min === 5000000 && priceRange.max === 10000000} onChange={() => handlePriceSelect(5000000, 10000000)} />
                                    <label className="form-check-label" htmlFor="price2">Từ 5 - 10 triệu</label>
                                </div>
                                <div className="form-check">
                                    <input className="form-check-input" type="radio" name="priceFilter" id="price3" checked={priceRange.min === 10000000 && priceRange.max === 20000000} onChange={() => handlePriceSelect(10000000, 20000000)} />
                                    <label className="form-check-label" htmlFor="price3">Từ 10 - 20 triệu</label>
                                </div>
                                <div className="form-check">
                                    <input className="form-check-input" type="radio" name="priceFilter" id="price4" checked={priceRange.min === 20000000} onChange={() => handlePriceSelect(20000000, '')} />
                                    <label className="form-check-label" htmlFor="price4">Trên 20 triệu</label>
                                </div>
                            </div>
                        </div>

                        <button className="btn btn-outline-danger w-100" onClick={() => {
                            setSelectedCategory('');
                            setPriceRange({ min: '', max: '' });
                            setSortOption('id_desc');
                            setLimit(24);
                        }}>
                            Xóa bộ lọc
                        </button>
                    </div>
                </div>

                {/* Phần hiển thị kết quả */}
                <div className="col-lg-9">
                    <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                        <h4 className="mb-0">
                            {keyword ? (
                                <>Kết quả cho: <span className="text-danger fw-bold">"{keyword}"</span></>
                            ) : (
                                "Tất cả sản phẩm"
                            )}
                        </h4>

                        {/* Sắp xếp */}
                        <div className="d-flex align-items-center bg-white p-2 rounded shadow-sm border">
                            <span className="me-2 text-muted text-nowrap"><i className="bi bi-sort-down"></i> Sắp xếp:</span>
                            <select className="form-select form-select-sm border-0 fw-bold" value={sortOption} onChange={(e) => {
                                setSortOption(e.target.value);
                                setLimit(24);
                            }} style={{ width: 'auto', boxShadow: 'none' }}>
                                <option value="id_desc">Mới nhất</option>
                                <option value="price_asc">Giá tăng dần</option>
                                <option value="price_desc">Giá giảm dần</option>
                                <option value="name_asc">Tên A-Z</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary"></div>
                            <p className="mt-2">Đang tìm kiếm...</p>
                        </div>
                    ) : products.length > 0 ? (
                        <>
                            <div className="row row-cols-2 row-cols-md-3 g-4">
                                {products.map((product) => (
                                    <div className="col" key={product.id}>
                                        <div className="card h-100 shadow-sm border-0 product-card">
                                            <Link to={`/product/${product.slug}`} className="text-decoration-none">
                                                <div className="position-relative text-center">
                                                    <img
                                                        src={product.thumbnailUrl || "https://via.placeholder.com/300"}
                                                        className="card-img-top p-3"
                                                        alt={product.name}
                                                        style={{ height: '220px', objectFit: 'contain' }}
                                                    />
                                                    {product.discount_price < product.regular_price && (
                                                        <span className="badge bg-danger position-absolute top-0 start-0 m-2">
                                                            Giảm {Math.round(((product.regular_price - product.discount_price) / product.regular_price) * 100)}%
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="card-body">
                                                    <h6 className="card-title text-dark mb-2 text-truncate" title={product.name}>
                                                        {product.name}
                                                    </h6>
                                                    <div className="d-flex align-items-center mb-2 flex-wrap">
                                                        <span className="text-danger fw-bold fs-5 me-2">
                                                            {formatPrice(product.discount_price || product.regular_price)}₫
                                                        </span>
                                                        {product.discount_price < product.regular_price && (
                                                            <span className="text-muted text-decoration-line-through small">
                                                                {formatPrice(product.regular_price)}₫
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Nút Xem thêm sản phẩm */}
                            {products.length < totalRows && (
                                <div className="text-center mt-5">
                                    <button className="btn btn-primary btn-lg px-5 shadow-sm"
                                        onClick={() => setLimit(prev => prev + 24)}>
                                        Xem thêm sản phẩm
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-5 bg-white shadow-sm rounded border">
                            <i className="bi bi-search text-muted" style={{ fontSize: '4rem' }}></i>
                            <h5 className="mt-3">Không tìm thấy sản phẩm nào phù hợp</h5>
                            <p className="text-muted">Vui lòng thử lại với bộ lọc hoặc từ khóa khác.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SearchPage;