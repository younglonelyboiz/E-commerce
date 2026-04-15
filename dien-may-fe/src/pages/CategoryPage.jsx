import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProducts } from '../services/product.api';
import { getBrands } from '../services/brandService';
import CardProduct from '../components/CardProduct';
import './CategoryPage.scss';

const CategoryPage = () => {
    const { categoryId } = useParams();
    const [products, setProducts] = useState([]);
    const [hotProducts, setHotProducts] = useState([]);
    const [totalRows, setTotalRows] = useState(0);
    const [loading, setLoading] = useState(true);
    const [brands, setBrands] = useState([]);

    const [filters, setFilters] = useState({
        page: 1,
        limit: 12,
        sort: 'id_desc',
        minPrice: 0,
        maxPrice: 100000000,
        brandId: '',
        categoryId: categoryId
    });

    useEffect(() => {
        setFilters(prev => ({ ...prev, categoryId, page: 1 }));
        fetchHotProducts();
        fetchBrands();
    }, [categoryId]);

    useEffect(() => {
        fetchData();
    }, [filters]);

    const fetchData = async () => {
        setLoading(true);
        const res = await getProducts(filters);
        if (res && res.EC === 0) {
            setProducts(res.DT.products || []);
            setTotalRows(res.DT.totalRows || 0);
        }
        setLoading(false);
    };

    const fetchHotProducts = async () => {
        const res = await getProducts({ categoryId, limit: 4, sort: 'top_selling' });
        if (res && res.EC === 0) {
            setHotProducts(res.DT.products || []);
        }
    };

    const fetchBrands = async () => {
        try {
            const res = await getBrands({ limit: 100 });

            if (res && res.EC === 0 && Array.isArray(res.DT)) {
                setBrands(res.DT);
            } else {
                setBrands([]);
            }
        } catch (error) {
            console.error("Lỗi fetch brands:", error);
            setBrands([]);
        }
    };

    const updateFilter = (key, value) => {
        let finalValue = value;

        // Xử lý thông minh: Nếu bỏ trống ô giá, set về mặc định để không mất sản phẩm
        if (value === "" || value === null) {
            if (key === 'minPrice') finalValue = 0;
            if (key === 'maxPrice') finalValue = 100000000;
        }

        setFilters(prev => ({ ...prev, [key]: finalValue, page: 1 }));
    };

    return (
        <div className="category-page container mt-4">
            {/* 1. TOP 4 BÁN CHẠY NHẤT */}
            {hotProducts.length > 0 && (
                <section className="hot-section mb-5 p-3 rounded shadow-sm bg-white border-top border-1">
                    <h4 className="title-hot fw-bold mb-3 text-danger">
                        <i className="bi bi-graph-up-arrow me-2"></i>BÁN CHẠY NHẤT
                    </h4>
                    <div className="row row-cols-2 row-cols-md-4 g-3">
                        {hotProducts.map(p => (
                            <div className="col" key={p.id}>
                                <CardProduct product={p} />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <div className="row">
                {/* 2. SIDEBAR BỘ LỌC */}
                <aside className="col-md-3">
                    <div className="filter-wrapper p-3 bg-white rounded shadow-sm sticky-top">
                        <h5 className="fw-bold border-bottom pb-2 mb-3">Bộ lọc</h5>

                        <div className="filter-group mb-4">
                            <label className="fw-bold small mb-2 text-uppercase">Sắp xếp</label>
                            <select className="form-select form-select-sm" value={filters.sort}
                                onChange={(e) => updateFilter('sort', e.target.value)}>
                                <option value="id_desc">Mới nhất</option>
                                <option value="price_asc">Giá: Thấp - Cao</option>
                                <option value="price_desc">Giá: Cao - Thấp</option>
                                <option value="top_selling">Bán chạy nhất</option>
                            </select>
                        </div>

                        <div className="filter-group mb-4">
                            <label className="fw-bold small mb-2 text-uppercase">Giá từ - đến</label>
                            <div className="d-flex flex-column gap-2">
                                <input type="number" className="form-control form-control-sm" placeholder="Từ ₫"
                                    onBlur={(e) => updateFilter('minPrice', e.target.value)} />
                                <input type="number" className="form-control form-control-sm" placeholder="Đến ₫"
                                    onBlur={(e) => updateFilter('maxPrice', e.target.value)} />
                            </div>
                        </div>
                        <div className="filter-group">
                            <label className="fw-bold small mb-2 text-uppercase text-primary">Thương hiệu</label>
                            <div className="brand-list overflow-auto" style={{ maxHeight: '300px' }}>
                                <div className="form-check mb-2">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="brand"
                                        id="brand-all"
                                        onChange={() => updateFilter('brandId', '')}
                                        checked={!filters.brandId}
                                    />
                                    <label className="form-check-label small" htmlFor="brand-all">Tất cả hãng</label>
                                </div>

                                {/* Dùng Optional Chaining để an toàn tuyệt đối */}
                                {brands?.map((brand) => (
                                    <div className="form-check mb-2" key={brand.id}>
                                        <input
                                            className="form-check-input"
                                            type="radio"
                                            name="brand"
                                            id={`brand-${brand.id}`}
                                            value={brand.id}
                                            onChange={(e) => updateFilter('brandId', e.target.value)}
                                            checked={filters.brandId == brand.id}
                                        />
                                        <label className="form-check-label small" htmlFor={`brand-${brand.id}`}>
                                            {brand.name}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* 3. DANH SÁCH CHÍNH */}
                <main className="col-md-9">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="fw-bold mb-0 text-secondary">Tất cả sản phẩm ({totalRows})</h5>
                    </div>

                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status"></div>
                            <p className="mt-2 text-muted">Đang tìm sản phẩm...</p>
                        </div>
                    ) : (
                        <>
                            <div className="row row-cols-2 row-cols-lg-3 g-3">
                                {products.map(item => (
                                    <div className="col" key={item.id}>
                                        <CardProduct product={item} />
                                    </div>
                                ))}
                            </div>
                            {products.length === 0 && (
                                <div className="text-center py-5 bg-white rounded border">
                                    <i className="bi bi-search h1 text-muted"></i>
                                    <p className="mt-3">Không tìm thấy sản phẩm phù hợp với bộ lọc.</p>
                                </div>
                            )}
                            {products.length < totalRows && (
                                <div className="text-center mt-5">
                                    <button className="btn btn-primary btn-lg px-5 shadow-sm"
                                        onClick={() => updateFilter('limit', filters.limit + 12)}>
                                        Xem thêm sản phẩm
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default CategoryPage;