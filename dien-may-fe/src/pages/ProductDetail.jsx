import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import CardProduct from '../components/CardProduct';
import { getProducts } from "../services/product.api";
import './ProductDetail.scss';

const ProductDetail = () => {
    const { slug } = useParams();
    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [activeImg, setActiveImg] = useState("");

    useEffect(() => {
        window.scrollTo(0, 0);
        loadProductData();
    }, [slug]);

    const loadProductData = async () => {
        setLoading(true);
        try {
            // 1. Lấy chi tiết sản phẩm hiện tại qua slug
            const res = await getProducts({
                slug: slug,
                limit: 1
            });
            console.log("chekc asdhajsdhsaj ", res);


            if (res && res.EC === 0 && res.DT.products.length > 0) {
                const currentProduct = res.DT.products[0];
                setProduct(currentProduct);

                // Set ảnh hiển thị chính
                const thumb = currentProduct.product_images?.find(img => img.is_thumbnail === 1);
                setActiveImg(thumb?.url || currentProduct.product_images?.[0]?.url || "");

                // 2. LOGIC THÔNG MINH: Lấy sản phẩm tương tự (3 ID trên, 3 ID dưới)
                // Lấy một cụm sản phẩm cùng category (khoảng 50 cái để đảm bảo đủ độ bao phủ ID lân cận)
                const resAll = await getProducts({
                    categoryId: currentProduct.category_id,
                    limit: 50,
                    sort: 'id_asc'
                });

                if (resAll && resAll.EC === 0) {
                    const allInCat = resAll.DT.products;
                    // Tìm vị trí của sản phẩm hiện tại trong danh sách đã sắp xếp
                    const currentIndex = allInCat.findIndex(item => item.id === currentProduct.id);

                    if (currentIndex !== -1) {
                        // Lấy 3 sản phẩm đứng trước (ID nhỏ hơn) và 3 sản phẩm đứng sau (ID lớn hơn)
                        const start = Math.max(0, currentIndex - 3);
                        const end = Math.min(allInCat.length, currentIndex + 4);

                        // Cắt mảng và loại bỏ chính sản phẩm hiện tại
                        const nearbyList = allInCat.slice(start, end).filter(p => p.id !== currentProduct.id);
                        setRelatedProducts(nearbyList);
                    }
                }
            }
        } catch (error) {
            console.error("Lỗi tải dữ liệu:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleQuantity = (type) => {
        if (type === 'plus') setQuantity(prev => prev + 1);
        else if (type === 'minus' && quantity > 1) setQuantity(prev => prev - 1);
    };

    if (loading) return <div className="loading-state">Đang tải dữ liệu sản phẩm...</div>;
    if (!product) return <div className="error-state">Sản phẩm không tồn tại!</div>;

    let specs = {};
    try {
        specs = typeof product.description === 'string' ? JSON.parse(product.description) : product.description;
    } catch (e) {
        specs = { "Mô tả": product.description };
    }

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price);

    return (
        <div className="product-detail-page container mt-4 pb-5">
            <div className="row bg-white p-3 rounded shadow-sm main-content">
                {/* CỘT TRÁI: GALLERY (Chiếm 8 phần) */}
                <div className="col-md-8 border-end">
                    <div className="gallery-container">
                        <div className="main-image">
                            <img src={activeImg} alt={product.name} />
                        </div>
                        <div className="thumb-list">
                            {product.product_images?.map((img, index) => (
                                <div
                                    key={index}
                                    className={`thumb-item ${activeImg === img.url ? 'active' : ''}`}
                                    onClick={() => setActiveImg(img.url)}
                                >
                                    <img src={img.url} alt={`Ảnh ${index}`} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI: INFO (Chiếm 4 phần) */}
                <div className="col-md-4 ps-md-4">
                    <h1 className="prod-name-title">{product.name}</h1>
                    <div className="brand-sku-info mb-3">
                        <span className="d-block mb-1">Hãng: <b className="text-primary">{product.brand?.name || 'Chưa rõ'}</b></span>
                        <span className="d-block">Mã SP: <b>{product.sku}</b></span>
                    </div>

                    <div className="price-section p-3 mb-4">
                        <div className="price-box">
                            <span className="discount-price d-block">{formatPrice(product.discount_price)}₫</span>
                            {product.discount_price < product.regular_price && (
                                <span className="old-price text-muted">{formatPrice(product.regular_price)}₫</span>
                            )}
                        </div>
                        <div className="stock-status mt-2 text-success small">
                            <i className="bi bi-patch-check-fill me-1"></i> Còn hàng tại cửa hàng
                        </div>
                    </div>

                    <div className="quantity-selector mb-4">
                        <p className="fw-bold mb-2">Số lượng:</p>
                        <div className="input-group" style={{ width: '120px' }}>
                            <button className="btn btn-outline-secondary" onClick={() => handleQuantity('minus')}>-</button>
                            <input type="text" className="form-control text-center" value={quantity} readOnly />
                            <button className="btn btn-outline-secondary" onClick={() => handleQuantity('plus')}>+</button>
                        </div>
                    </div>

                    <div className="action-buttons d-grid gap-2">
                        <button className="btn btn-danger btn-buy py-3" onClick={() => alert("Đã thêm vào giỏ!")}>
                            MUA NGAY <br /> <small>Giao tận nơi hoặc nhận tại chỗ</small>
                        </button>
                        <button className="btn btn-outline-primary py-2">
                            <i className="bi bi-cart-plus me-2"></i> Thêm vào giỏ hàng
                        </button>
                    </div>
                </div>
            </div>

            {/* THÔNG SỐ KỸ THUẬT */}
            <div className="row mt-5">
                <div className="col-lg-8">
                    <div className="specs-card bg-white p-4 rounded shadow-sm border">
                        <h4 className="title-border mb-4 fw-bold">Thông số kỹ thuật</h4>
                        <table className="table table-hover mb-0">
                            <tbody>
                                {Object.entries(specs).map(([key, value], idx) => (
                                    <tr key={idx}>
                                        <td className="fw-bold bg-light text-secondary" style={{ width: '35%' }}>{key}</td>
                                        <td>{value}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="col-lg-4">
                    <div className="policy-sidebar bg-white p-4 rounded shadow-sm border h-100">
                        <h5 className="fw-bold mb-4 border-bottom pb-2">Dịch vụ & Ưu đãi</h5>
                        <div className="policy-item d-flex mb-3">
                            <i className="bi bi-truck text-primary me-3 h4"></i>
                            <span>Giao hàng miễn phí đơn từ 500k</span>
                        </div>
                        <div className="policy-item d-flex">
                            <i className="bi bi-shield-check text-primary me-3 h4"></i>
                            <span>Bảo hành 12 tháng chính hãng</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* SẢN PHẨM TƯƠNG TỰ */}
            {relatedProducts.length > 0 && (
                <div className="related-products-section mt-5">
                    <h3 className="fw-bold mb-4 border-bottom pb-2">Sản phẩm cùng dòng</h3>
                    <div className="row row-cols-2 row-cols-md-3 row-cols-lg-5 g-4">
                        {relatedProducts.map(item => (
                            <div className="col" key={item.id}>
                                <CardProduct product={item} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductDetail;