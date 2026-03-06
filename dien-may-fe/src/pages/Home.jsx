import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Home.scss';
import CardProduct from '../components/CardProduct.jsx';
import { getCategories } from '../services/categoryService.js';
// Import cả 2 hàm API
import { getTopSaleProducts, getTopSellingProducts } from '../services/product.api.js';



// --- MAIN PAGE ---
function Home() {
    // 1. Khởi tạo 2 State riêng biệt cho 2 danh sách
    const [flashSaleList, setFlashSaleList] = useState([]);
    const [bestSellerList, setBestSellerList] = useState([]);
    const [categoryList, setCategoryList] = useState([]);

    useEffect(() => {
        fetchFlashSale();
        fetchBestSeller();
        fetchCategories();

    }, []);
    const fetchCategories = async () => {
        try {
            let res = await getCategories();
            // Kiểm tra res có tồn tại, có DT và DT phải là mảng
            if (res && res.EC === 0 && Array.isArray(res.DT)) {
                setCategoryList(res.DT); // CHỈ lấy res.DT
            } else {
                setCategoryList([]); // Nếu lỗi, set mảng rỗng để không bị crash .map()
            }
        } catch (error) {
            console.error("Error fetch categories:", error);
            setCategoryList([]);
        }
    };

    // --- API 1: Lấy sản phẩm giảm giá sâu (Flash Sale) ---    
    const fetchFlashSale = async () => {
        try {
            let res = await getTopSaleProducts(); // Gọi hàm lấy giảm giá
            if (res && res.EC === 0) {
                setFlashSaleList(res.DT);
            }
        } catch (error) {
            console.log("Error fetch flash sale:", error);
        }
    };

    // --- API 2: Lấy sản phẩm bán chạy (Best Seller) ---
    const fetchBestSeller = async () => {
        try {
            let res = await getTopSellingProducts(); // Gọi hàm lấy bán chạy
            if (res && res.EC === 0) {
                setBestSellerList(res.DT);
            }
        } catch (error) {
            console.log("Error fetch best seller:", error);
        }
    };

    return (
        <div className="home-page">
            <div className="container">

                {/* 1. HERO SECTION (Banner) */}
                <div className="hero-section row mb-4">
                    <div className="col-lg-8 mb-3 mb-lg-0">
                        <div className="main-banner">
                            <img src="https://cdn2.cellphones.com.vn/insecure/rs:fill:1036:450/q:100/plain/https://dashboard.cellphones.com.vn/storage/Home_Ver4(3).png" alt="Big Banner" />
                        </div>
                    </div>
                    <div className="col-lg-4 d-flex flex-column justify-content-between">
                        <div className="sub-banner">
                            <img src="https://cdn2.cellphones.com.vn/insecure/rs:fill:1036:450/q:100/plain/https://dashboard.cellphones.com.vn/storage/samsung-galaxy-a07-5g-home-v6.png" alt="Sub 1" />
                        </div>
                        <div className="sub-banner">
                            <img src="https://cdn2.cellphones.com.vn/insecure/rs:fill:1036:450/q:100/plain/https://dashboard.cellphones.com.vn/storage/fbgdgfdgd.png" alt="Sub 2" />
                        </div>
                    </div>
                </div>

                <div className="feature-categories mb-5">
                    <div className="row g-2">
                        {/* CỘT TRÁI: Ô ĐIỆN THOẠI (ID: 1) */}
                        <div className="col-lg-4 col-md-4">
                            {categoryList
                                .filter(cat => cat.id === 2) // Chỉ lấy đúng thằng điện thoại
                                .map(cat => (
                                    <Link key={cat.id} to={`/category/${cat.id}`} className="cat-item big-item h-100 shadow-sm">
                                        <div className="cat-icon">
                                            <i className={cat.icon || 'fa-solid fa-mobile-screen-button'}></i>
                                        </div>
                                        <div className="cat-name">{cat.name}</div>
                                    </Link>
                                ))
                            }
                        </div>

                        {/* CỘT PHẢI: CÁC Ô NHỎ (Loại trừ ID: 1) */}
                        <div className="col-lg-8 col-md-8">
                            <div className="row g-2 h-100">
                                {categoryList
                                    .filter(cat => cat.id !== 2) // Bỏ thằng điện thoại ra khỏi danh sách nhỏ
                                    .slice(0, 8)                 // Lấy tối đa 6 mục còn lại để khớp layout
                                    .map(cat => (
                                        <div key={cat.id} className="col-4">
                                            <Link to={`/category/${cat.id}`} className="cat-item small-item h-100 shadow-sm">
                                                <div className="cat-icon">
                                                    <i className={cat.icon || 'fa-solid fa-box'}></i>
                                                </div>
                                                <div className="cat-name text-truncate px-2">{cat.name}</div>
                                            </Link>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. FLASH SALE (Map biến flashSaleList) */}
                <div className="section-block mb-5">
                    <div className="section-header d-flex justify-content-between align-items-center mb-3">
                        <h2 className="section-title text-danger">
                            <i className="bi bi-lightning-fill"></i> FLASH SALE
                        </h2>
                        <Link to="/flash-sale" className="view-all text-decoration-none">
                            Xem tất cả <i className="bi bi-chevron-right"></i>
                        </Link>
                    </div>
                    <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3">
                        {flashSaleList && flashSaleList.length > 0 ? (
                            flashSaleList.slice(0, 4).map(prod => (
                                <div key={prod.id} className="col">
                                    <CardProduct product={prod} />
                                </div>
                            ))
                        ) : (
                            <div className="col-12 text-center">Đang tải Flash Sale...</div>
                        )}
                    </div>
                </div>

                {/* 4. TOP SẢN PHẨM BÁN CHẠY (Map biến bestSellerList) */}
                <div className="section-block mb-5">
                    <div className="section-header d-flex justify-content-between align-items-center mb-3">
                        <h2 className="section-title text-warning-emphasis">
                            <i className="bi bi-fire text-danger"></i> TOP BÁN CHẠY
                        </h2>
                        <Link to="/best-seller" className="view-all text-decoration-none">
                            Xem tất cả <i className="bi bi-chevron-right"></i>
                        </Link>
                    </div>
                    <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3">
                        {bestSellerList && bestSellerList.length > 0 ? (
                            bestSellerList.slice(0, 4).map(prod => (
                                <div key={prod.id} className="col">
                                    <CardProduct product={prod} />
                                </div>
                            ))
                        ) : (
                            <div className="col-12 text-center">Đang tải Top bán chạy...</div>
                        )}
                    </div>
                </div>

                {/* 5. BANNER QUẢNG CÁO GIỮA TRANG */}
                <div className="promo-banner-wrapper">
                    <img
                        src="https://cdn2.cellphones.com.vn/insecure/rs:fill:1036:450/q:100/plain/https://dashboard.cellphones.com.vn/storage/home-freeclip2xpnj.jpg"
                        alt="Quảng cáo ưu đãi"
                        className="promo-img"
                    />
                </div>

                {/* 6. GỢI Ý CHO BẠN (Tạm thời tái sử dụng bestSellerList hoặc tạo API riêng) */}
                <div className="section-block mb-5">
                    <div className="section-header d-flex justify-content-between align-items-center mb-3">
                        <h2 className="section-title text-primary">
                            <i className="bi bi-stars text-warning"></i> GỢI Ý CHO BẠN
                        </h2>
                        <Link to="/products" className="view-all text-decoration-none">
                            Xem tất cả <i className="bi bi-chevron-right"></i>
                        </Link>
                    </div>
                    <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3">
                        {/* Ở đây bạn có thể dùng lại list bán chạy hoặc list khác tùy ý */}
                        {bestSellerList && bestSellerList.slice(0, 8).map(prod => (
                            <div key={`suggest-${prod.id}`} className="col">
                                <CardProduct product={prod} />
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}

export default Home;