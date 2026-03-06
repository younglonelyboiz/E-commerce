import React, { useEffect, useState } from 'react';
import {
    getProductsByAdmin,
    getProductDetailById,
    deleteProductApi,
    createProductApi,
    updateProductApi
} from '../services/product.api';
import { getBrands } from '../services/brandService';
import { getCategories } from '../services/categoryService';
import { toast } from 'react-toastify';
import './AdminProduct.scss';
import { ProductModal, ModalDelete } from '../components/ProductModal';

const AdminProduct = () => {
    const [products, setProducts] = useState([]);
    const [brands, setBrands] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(0);

    // State cho Modal
    const [showModal, setShowModal] = useState(false);
    const [actionModal, setActionModal] = useState('CREATE');
    const [dataModal, setDataModal] = useState({});

    // State cho Modal Delete
    const [showModalDelete, setShowModalDelete] = useState(false);
    const [dataModalDelete, setDataModalDelete] = useState({});

    const [filters, setFilters] = useState({
        page: 1, limit: 10, brandId: '', categoryId: '', search: '', sort: 'id_desc'
    });

    useEffect(() => { fetchData(); }, [filters]);
    useEffect(() => { loadFilterData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        const res = await getProductsByAdmin(filters);
        if (res && res.EC === 0) {
            setProducts(res.DT.products || []);
            setTotalPages(res.DT.totalPages || 0);
        }
        setLoading(false);
    };

    const loadFilterData = async () => {
        const [resBrands, resCats] = await Promise.all([
            getBrands({ limit: 100 }),
            getCategories({ limit: 100 })
        ]);
        if (resBrands && resBrands.EC === 0) setBrands(resBrands.DT || []);
        if (resCats && resCats.EC === 0) setCategories(resCats.DT || []);
    };

    const handleUpdateFilter = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value, page: (key === 'page' ? value : 1) }));
    };

    // --- Logic Modal ---
    const handleCreate = () => {
        setActionModal('CREATE');
        setDataModal({});
        setShowModal(true);
    };

    const handleEdit = async (product) => {
        setLoading(true);
        const res = await getProductDetailById(product.id);
        if (res && res.EC === 0) {
            setActionModal('UPDATE');
            setDataModal(res.DT);
            setShowModal(true);
        } else {
            toast.error("Không thể lấy thông tin chi tiết sản phẩm");
        }
        setLoading(false);
    };

    // Hàm gọi khi nhấn nút Xóa trên bảng
    const handleDelete = (product) => {
        setDataModalDelete(product);
        setShowModalDelete(true);
    };

    // --- Gọi API Xử lý ---
    const handleSubmitForm = async (productData) => {
        let res;
        if (actionModal === 'CREATE') {
            res = await createProductApi(productData);
        } else {
            res = await updateProductApi(productData.id, productData);
        }

        if (res && res.EC === 0) {
            toast.success(res.EM);
            setShowModal(false);
            fetchData();
        } else {
            toast.error(res.EM);
        }
    };

    const confirmDelete = async (productId) => {
        const res = await deleteProductApi(productId);
        if (res && res.EC === 0) {
            toast.success("Xóa sản phẩm thành công!");
            setShowModalDelete(false);
            fetchData();
        } else {
            toast.error(res.EM);
        }
    };

    // --- Logic phân trang của bạn ---
    const getPagination = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, filters.page - 2);
        let end = Math.min(totalPages, filters.page + 2);
        if (filters.page <= 3) { start = 1; end = Math.min(maxVisible, totalPages); }
        if (filters.page >= totalPages - 2) { start = Math.max(1, totalPages - maxVisible + 1); end = totalPages; }
        for (let i = start; i <= end; i++) { pages.push(i); }
        return pages;
    };

    return (
        <div className="admin-product-page p-4">
            <div className="admin-header d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark m-0">Kho hàng hệ thống</h2>
                    <p className="text-muted small">Quản lý thông tin, giá niêm yết và giá khuyến mãi</p>
                </div>
                <button className="btn btn-primary shadow-sm px-4 py-2" onClick={handleCreate}>
                    <i className="bi bi-plus-circle me-2"></i>Thêm sản phẩm
                </button>
            </div>

            <div className="filter-section bg-white p-4 rounded-3 shadow-sm mb-4">
                <div className="row g-3">
                    <div className="col-md-4">
                        <label className="form-label small fw-bold text-muted">TÌM KIẾM</label>
                        <input
                            type="text" className="form-control bg-light"
                            placeholder="Tên hoặc SKU..."
                            onChange={(e) => handleUpdateFilter('search', e.target.value)}
                        />
                    </div>
                    <div className="col-md-2">
                        <label className="form-label small fw-bold text-muted">THƯƠNG HIỆU</label>
                        <select className="form-select bg-light" value={filters.brandId}
                            onChange={(e) => handleUpdateFilter('brandId', e.target.value)}>
                            <option value="">Tất cả hãng</option>
                            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                    <div className="col-md-2">
                        <label className="form-label small fw-bold text-muted">DANH MỤC</label>
                        <select className="form-select bg-light" value={filters.categoryId}
                            onChange={(e) => handleUpdateFilter('categoryId', e.target.value)}>
                            <option value="">Tất cả loại</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="col-md-2">
                        <label className="form-label small fw-bold text-muted">SẮP XẾP</label>
                        <select
                            className="form-select bg-light"
                            value={filters.sort}
                            onChange={(e) => handleUpdateFilter('sort', e.target.value)}
                        >
                            <option value="id_desc">Mới nhất</option>
                            <option value="id_asc">Cũ nhất</option>
                            <option value="price_asc">Giá: Thấp đến Cao</option>
                            <option value="price_desc">Giá: Cao đến Thấp</option>
                            <option value="stock_asc">Tồn kho: Ít đến Nhiều</option>
                            <option value="stock_desc">Tồn kho: Nhiều đến Ít</option>
                            <option value="top_selling">Bán chạy nhất</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="table-responsive shadow-sm rounded-3 bg-white mb-4">
                <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                        <tr>
                            <th className="ps-4 py-3">ID</th>
                            <th>Thông tin sản phẩm</th>
                            <th>Thương hiệu</th>
                            <th>Giá gốc</th>
                            <th>Giá bán</th>
                            <th>Kho</th>
                            <th className="text-end pe-4">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" className="text-center py-5"><div className="spinner-border text-primary border-3"></div></td></tr>
                        ) : (
                            products.map(item => (
                                <tr key={item.id}>
                                    <td className="ps-4 text-muted small">#{item.id}</td>
                                    <td>
                                        <div className="d-flex align-items-center">
                                            <div className="admin-product-img-wrapper border rounded me-3 shadow-sm">
                                                <img src={item.thumbnailUrl || 'https://via.placeholder.com/60'} alt={item.name} />
                                            </div>
                                            <div className="overflow-hidden">
                                                <div className="fw-bold text-dark text-truncate" style={{ maxWidth: '250px' }}>{item.name}</div>
                                                <small className="text-primary fw-bold">SKU: {item.sku}</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{item.brand?.name}</td>
                                    <td>{item.regular_price?.toLocaleString()}₫</td>
                                    <td className="text-danger fw-bold">{item.discount_price?.toLocaleString()}₫</td>
                                    <td>
                                        <div className={`stock-badge ${item.quantity <= 5 ? 'critical' : item.quantity <= 20 ? 'low' : ''}`}>
                                            <i className="bi bi-box-seam me-1"></i>
                                            {item.quantity ?? 0}
                                        </div>
                                    </td>
                                    <td className="text-end pe-4">
                                        <div className="d-flex justify-content-end gap-2">
                                            <button className="btn-circle edit" onClick={() => handleEdit(item)}><i className="bi bi-pencil-square"></i></button>
                                            <button className="btn-circle delete" onClick={() => handleDelete(item)}><i className="bi bi-trash3-fill"></i></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded shadow-sm">
                <div className="text-muted small">
                    Trang {filters.page} / {totalPages}
                </div>
                <nav>
                    <ul className="pagination mb-0">
                        <li className={`page-item ${filters.page === 1 ? 'disabled' : ''}`}>
                            <button className="page-link" onClick={() => handleUpdateFilter('page', filters.page - 1)}>Trước</button>
                        </li>
                        {getPagination().map((page) => (
                            <li key={page} className={`page-item ${filters.page === page ? 'active' : ''}`}>
                                <button className="page-link" onClick={() => handleUpdateFilter('page', page)}>{page}</button>
                            </li>
                        ))}
                        <li className={`page-item ${filters.page === totalPages ? 'disabled' : ''}`}>
                            <button className="page-link" onClick={() => handleUpdateFilter('page', filters.page + 1)}>Sau</button>
                        </li>
                    </ul>
                </nav>
            </div>

            <ProductModal
                show={showModal}
                handleClose={() => setShowModal(false)}
                action={actionModal}
                dataModal={dataModal}
                brands={brands}
                categories={categories}
                handleSubmitForm={handleSubmitForm}
            />

            <ModalDelete
                show={showModalDelete}
                handleClose={() => setShowModalDelete(false)}
                dataModal={dataModalDelete}
                confirmDelete={confirmDelete}
            />
        </div>
    );
};

export default AdminProduct;