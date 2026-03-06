import React from 'react';
import { Link } from 'react-router-dom';
import './CardProduct.scss';

const CardProduct = ({ product }) => {
    // 1. Mapping dữ liệu chuẩn từ Backend (đã qua formatProductThumbnail)
    const data = {
        id: product.id,
        slug: product.slug || product.id,
        name: product.name,
        // thumbnailUrl lấy từ bảng product_images (is_thumbnail: 1)
        img: product.thumbnailUrl || "https://via.placeholder.com/200",
        price: Number(product.discount_price) || 0,
        oldPrice: Number(product.regular_price) || 0,
        discountPercent: product.discountPercent,
        brandName: product.brand?.name || "" // Hiển thị tên hãng nếu có include brand
    };

    // 2. Helper format tiền tệ Việt Nam
    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN').format(price);
    };

    return (
        <div className="product-card h-100">
            <Link to={`/product/${data.slug}`} className="card-link">

                {/* --- KHU VỰC ẢNH & BADGE --- */}
                <div className="prod-image-wrapper">
                    {/* Badge % Giảm giá (Backend đã tính toán sẵn) */}
                    {data.discountPercent > 0 && (
                        <div className="badge-discount">
                            <span className="text-percent">Giảm {data.discountPercent}%</span>
                        </div>
                    )}

                    <img src={data.img} alt={data.name} className="prod-img" loading="lazy" />
                </div>

                {/* --- KHU VỰC THÔNG TIN --- */}
                <div className="prod-info">
                    {/* Hiển thị thương hiệu nhỏ phía trên tên (Nếu có) */}
                    {data.brandName && (
                        <span className="brand-tag">{data.brandName}</span>
                    )}

                    <h3 className="prod-name" title={data.name}>
                        {data.name}
                    </h3>

                    {/* Giá tiền */}
                    <div className="price-group">
                        <span className="current-price">{formatPrice(data.price)}₫</span>

                        {data.discountPercent > 0 && data.oldPrice > data.price && (
                            <span className="old-price">
                                {formatPrice(data.oldPrice)}₫
                            </span>
                        )}
                    </div>
                </div>
            </Link>
        </div>
    );
};

export default CardProduct;