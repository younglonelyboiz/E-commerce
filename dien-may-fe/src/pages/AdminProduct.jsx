import React, { useEffect, useState, useContext } from 'react';
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
import { UserContext } from '../context/UserContext';

const AdminProduct = () => {
    // 1. Lấy dữ liệu từ Context (Bao gồm cả trạng thái isLoading khi F5)
    const { user } = useContext(UserContext);

    // State dữ liệu
    const [products, setProducts] = useState([]);
    const [brands, setBrands] = useState([]);
    const [categories, setCategories] = useState([]);

    // State UI
    const [loading, setLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [actionModal, setActionModal] = useState('CREATE');
    const [dataModal, setDataModal] = useState({});
    const [showModalDelete, setShowModalDelete] = useState(false);
    const [dataModalDelete, setDataModalDelete] = useState({});

    // State Filters
    const [filters, setFilters] = useState({
        page: 1,
        limit: 10,
        brandId: '',
        categoryId: '',
        search: '',
        sort: 'id_desc'
    });

    // --- LOGIC GỌI API ---

    // Load dữ liệu filter (Thương hiệu/Danh mục) chỉ 1 lần khi mount
    useEffect(() => {
        loadFilterData();
    }, []);

    // Load dữ liệu sản phẩm: CHỈ gọi khi isLoading của UserContext đã xong (false)
    useEffect(() => {
        if (user.isLoading === false) {
            if (user.auth === true && user.roles.includes("ADMIN")) {
                fetchData();
            }
        }
    }, [user.isLoading, user.auth, filters]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getProductsByAdmin(filters);
            if (res && res.EC === 0) {
                setProducts(res.DT.products || []);
                setTotalPages(res.DT.totalPages || 0);
            }
        } catch (error) {
            console.error("Fetch Data Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadFilterData = async () => {
        const [resBrands, resCats] = await Promise.all([
            getBrands({ limit: 100 }),
            getCategories({ limit: 100 })
        ]);
        if (resBrands && resBrands.EC === 0) setBrands(resBrands.DT || []);
        if (resCats && resCats.EC === 0) setCategories(resCats.DT || []);
    };

    // --- LOGIC XỬ LÝ SỰ KIỆN ---

    const handleUpdateFilter = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value,
            page: (key === 'page' ? value : 1)
        }));
    };

    const handleCreate = () => {
        setActionModal('CREATE');
        setDataModal({});
        setShowModal(true);
    };

    const handleEdit = async (product) => {
        setLoading(true);
        try {
            const res = await getProductDetailById(product.id);
            const targetProduct = res.DT;
            if (targetProduct) {
                setDataModal(targetProduct);
                setActionModal('UPDATE');
                setShowModal(true);
            } else {
                toast.error("Không tìm thấy dữ liệu chi tiết sản phẩm");
            }
        } catch (error) {
            toast.error("Lỗi khi tải dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (product) => {
        setDataModalDelete(product);
        setShowModalDelete(true);
    };

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
            return res;
        } else {
            toast.error(res.EM || "Có lỗi xảy ra");
            return res;
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

    // --- GIAO DIỆN CHỜ (HYDRATION) ---
    // Ngăn chặn render trang Admin khi chưa xác thực xong User sau khi F5
    if (user.isLoading) {
        return (
            <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
                <div className="spinner-grow text-primary" role="status" style={{ width: '3rem', height: '3rem' }}></div>
                <div className="mt-3 fw-bold text-secondary">Đang kiểm tra quyền truy cập...</div>
            </div>
        );
    }

    // Nếu đã nạp xong (isLoading: false) mà không có auth/admin thì báo lỗi
    if (!user.auth || !user.roles.includes("ADMIN")) {
        return (
            <div className="container mt-5">
                <div className="alert alert-danger shadow-sm py-4 text-center">
                    <i className="bi bi-exclamation-octagon fs-1 d-block mb-3"></i>
                    <h4 className="fw-bold">Truy cập bị từ chối</h4>
                    <p>Bạn không có quyền quản trị để truy cập vào tài nguyên này.</p>
                    <button className="btn btn-danger px-4 mt-2" onClick={() => window.location.href = '/'}>Quay lại trang chủ</button>
                </div>
            </div>
        );
    }

    // --- GIAO DIỆN CHÍNH ---
    return (
        <div className="admin-product-page p-4 bg-light min-vh-100">
            <div className="admin-header d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark m-0">Kho hàng hệ thống</h2>
                    <p className="text-muted small">Quản lý giá niêm yết, phân loại và tồn kho thực tế</p>
                </div>
                <button className="btn btn-primary shadow-sm px-4 py-2" onClick={handleCreate}>
                    <i className="bi bi-plus-circle me-2"></i>Thêm sản phẩm
                </button>
            </div>

            {/* Filter Section */}
            <div className="filter-section bg-white p-4 rounded-3 shadow-sm mb-4 border-0">
                <div className="row g-3">
                    <div className="col-md-4">
                        <label className="form-label small fw-bold text-muted">TÌM KIẾM</label>
                        <div className="input-group">
                            <span className="input-group-text bg-white"><i className="bi bi-search"></i></span>
                            <input
                                type="text" className="form-control"
                                placeholder="Tên hoặc SKU..."
                                onChange={(e) => handleUpdateFilter('search', e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="col-md-2">
                        <label className="form-label small fw-bold text-muted">THƯƠNG HIỆU</label>
                        <select className="form-select" value={filters.brandId}
                            onChange={(e) => handleUpdateFilter('brandId', e.target.value)}>
                            <option value="">Tất cả hãng</option>
                            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                    <div className="col-md-2">
                        <label className="form-label small fw-bold text-muted">DANH MỤC</label>
                        <select className="form-select" value={filters.categoryId}
                            onChange={(e) => handleUpdateFilter('categoryId', e.target.value)}>
                            <option value="">Tất cả loại</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="col-md-2">
                        <label className="form-label small fw-bold text-muted">SẮP XẾP</label>
                        <select className="form-select" value={filters.sort}
                            onChange={(e) => handleUpdateFilter('sort', e.target.value)}>
                            <option value="id_desc">Mới nhất</option>
                            <option value="price_asc">Giá tăng dần</option>
                            <option value="price_desc">Giá giảm dần</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Main Table */}
            <div className="table-responsive shadow-sm rounded-3 bg-white mb-4 border-0">
                <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                        <tr>
                            <th className="ps-4" style={{ width: '80px' }}>ID</th>
                            <th style={{ width: '30%' }}>Sản phẩm</th>
                            <th>Phân loại</th>
                            <th>Giá gốc</th>
                            <th>Giá bán</th>
                            <th>Kho</th>
                            <th className="text-end pe-4">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="7" className="text-center py-5">
                                    <div className="spinner-border text-primary border-3"></div>
                                    <div className="mt-2 text-muted">Đang tải dữ liệu...</div>
                                </td>
                            </tr>
                        ) : products.length > 0 ? (
                            products.map(item => (
                                <tr key={item.id}>
                                    <td className="ps-4 text-muted small">#{item.id}</td>
                                    <td>
                                        <div className="d-flex align-items-center">
                                            <div className="admin-product-img-wrapper me-3">
                                                <img src={item.thumbnailUrl || 'https://via.placeholder.com/60'} alt="" />
                                            </div>
                                            <div className="text-truncate" style={{ maxWidth: '250px' }}>
                                                <div className="fw-bold text-dark text-truncate">{item.name}</div>
                                                <small className="text-primary fw-bold">SKU: {item.sku}</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="d-flex flex-column">
                                            <span className="badge bg-light text-dark border mb-1" style={{ fontSize: '11px', width: 'fit-content' }}>
                                                {item.category?.name || 'Chưa phân loại'}
                                            </span>
                                            <span className="text-muted small">
                                                Hãng: <strong>{item.brand?.name || 'N/A'}</strong>
                                            </span>
                                        </div>
                                    </td>
                                    <td className="text-muted">
                                        <del>{Number(item.regular_price)?.toLocaleString()}₫</del>
                                    </td>
                                    <td className="text-danger fw-bold">
                                        {Number(item.discount_price)?.toLocaleString()}₫
                                    </td>
                                    <td>
                                        <div className={`stock-badge ${item.quantity <= 5 ? 'critical' : item.quantity <= 20 ? 'low' : ''}`}>
                                            <i className="bi bi-box-seam me-1"></i>
                                            {item.quantity}
                                        </div>
                                    </td>
                                    <td className="text-end pe-4">
                                        <div className="d-flex justify-content-end gap-2">
                                            <button className="btn-circle edit" title="Chỉnh sửa" onClick={() => handleEdit(item)}>
                                                <i className="bi bi-pencil-square"></i>
                                            </button>
                                            <button className="btn-circle delete" title="Xóa" onClick={() => handleDelete(item)}>
                                                <i className="bi bi-trash3-fill"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="7" className="text-center py-5 text-muted">Không có sản phẩm nào phù hợp</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded-3 shadow-sm border-0">
                <div className="text-muted small">Hiển thị trang <strong>{filters.page}</strong> trên tổng số <strong>{totalPages}</strong> trang</div>
                <nav>
                    <ul className="pagination mb-0">
                        <li className={`page-item ${filters.page === 1 ? 'disabled' : ''}`}>
                            <button className="page-link shadow-none" onClick={() => handleUpdateFilter('page', filters.page - 1)}>
                                <i className="bi bi-chevron-left"></i>
                            </button>
                        </li>
                        {getPagination().map(p => (
                            <li key={p} className={`page-item ${filters.page === p ? 'active' : ''}`}>
                                <button className="page-link shadow-none" onClick={() => handleUpdateFilter('page', p)}>{p}</button>
                            </li>
                        ))}
                        <li className={`page-item ${filters.page === totalPages ? 'disabled' : ''}`}>
                            <button className="page-link shadow-none" onClick={() => handleUpdateFilter('page', filters.page + 1)}>
                                <i className="bi bi-chevron-right"></i>
                            </button>
                        </li>
                    </ul>
                </nav>
            </div>

            {/* Modals */}
            <ProductModal
                show={showModal}
                handleClose={() => { setShowModal(false); setDataModal({}); }}
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