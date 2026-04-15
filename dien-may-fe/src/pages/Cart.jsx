import React, { useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCartApi, removeFromCartApi } from '../services/cartService';
import { UserContext } from '../context/UserContext';
import { toast } from 'react-toastify';

function Cart() {
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, setCartCount } = useContext(UserContext);
    const [selectedItems, setSelectedItems] = useState([]); // Lưu ID các sản phẩm được tích chọn

    useEffect(() => {
        // Chỉ gọi API khi user đã đăng nhập xong
        if (user && user.auth) {
            fetchCart();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchCart = async () => {
        setLoading(true);
        try {
            let res = await getCartApi();
            if (res && res.EC === 0) {
                setCartItems(res.DT || []);
                if (setCartCount) {
                    const totalQty = (res.DT || []).reduce((sum, item) => sum + item.quantity, 0);
                    setCartCount(totalQty);
                }
            }
        } catch (error) {
            console.error("Lỗi fetch cart:", error);
        }
        setLoading(false);
    };

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price);

    // Xử lý thay đổi số lượng
    const handleUpdateQuantity = (productId, value) => {
        let newQuantity = value;
        if (typeof value === 'string') {
            if (value === '') newQuantity = '';
            else {
                newQuantity = parseInt(value, 10);
                if (isNaN(newQuantity)) return;
            }
        } else if (value < 1) return;

        setCartItems(prev => prev.map(item => item.product.id === productId ? { ...item, quantity: newQuantity } : item));
    };

    const handleBlurQuantity = (productId, currentQuantity) => {
        if (currentQuantity === '' || currentQuantity < 1) {
            setCartItems(prev => prev.map(item => item.product.id === productId ? { ...item, quantity: 1 } : item));
        }
    };

    // Xử lý khi tích/bỏ tích 1 sản phẩm
    const handleSelectItem = (id) => {
        setSelectedItems(prev =>
            prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
        );
    };

    // Xử lý khi tích/bỏ tích "Chọn tất cả"
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedItems(cartItems.map(item => item.product.id));
        } else {
            setSelectedItems([]);
        }
    };

    // Lọc ra các sản phẩm đã được chọn để tính tiền
    const selectedCartItems = cartItems.filter(item => selectedItems.includes(item.product.id));

    // Tính tổng tiền
    const totalPrice = selectedCartItems.reduce((sum, item) => {
        const price = item.product?.discount_price || 0;
        return sum + (price * (item.quantity || 0));
    }, 0);

    // Tính toán thêm cho Tóm tắt đơn hàng thông minh
    const totalRegularPrice = selectedCartItems.reduce((sum, item) => {
        const price = item.product?.regular_price || item.product?.discount_price || 0;
        return sum + (price * (item.quantity || 0));
    }, 0);
    const totalDiscount = totalRegularPrice - totalPrice;
    const shippingFee = selectedCartItems.length === 0 ? 0 : (totalPrice >= 500000 ? 0 : 30000); // Miễn phí giao hàng từ 500k, không chọn thì phí ship = 0
    const finalTotal = totalPrice + shippingFee;

    // Xử lý xóa sản phẩm
    const handleRemoveItem = async (productId) => {
        try {
            let res = await removeFromCartApi(productId);
            if (res && res.EC === 0) {
                toast.success(res.EM || "Đã xóa sản phẩm khỏi giỏ hàng");
                setSelectedItems(prev => prev.filter(id => id !== productId)); // Bỏ tick nếu đang tick
                fetchCart(); // Gọi lại để load dữ liệu và cập nhật số lượng badge
            } else {
                toast.error(res?.EM || "Xóa thất bại");
            }
        } catch (error) {
            toast.error("Lỗi khi xóa sản phẩm");
        }
    };

    // Xử lý ấn nút Đặt hàng
    const handleCheckout = () => {
        if (selectedItems.length === 0) return;

        // Gom data sản phẩm đã tick đẩy sang trang Checkout
        const itemsToCheckout = selectedCartItems.map(item => ({
            product_id: item.product.id,
            name: item.product.name,
            price: item.product.discount_price || item.product.regular_price,
            quantity: item.quantity,
            image: item.product?.product_images?.[0]?.url || "https://via.placeholder.com/100"
        }));
        navigate('/checkout', { state: { items: itemsToCheckout } });
    };

    if (loading) {
        return <div className="container mt-5 text-center"><div className="spinner-border text-primary"></div></div>;
    }

    if (!user || !user.auth) {
        return (
            <div className="container mt-5 text-center py-5">
                <i className="bi bi-cart-x text-muted" style={{ fontSize: '4rem' }}></i>
                <h4 className="mt-3">Vui lòng đăng nhập để xem giỏ hàng</h4>
                <Link to="/login" className="btn btn-primary mt-3 px-4">Đăng nhập ngay</Link>
            </div>
        );
    }

    if (cartItems.length === 0) {
        return (
            <div className="container mt-5 text-center py-5">
                <i className="bi bi-cart-x text-muted" style={{ fontSize: '4rem' }}></i>
                <h4 className="mt-3">Giỏ hàng của bạn đang trống</h4>
                <Link to="/" className="btn btn-outline-primary mt-3 px-4">Tiếp tục mua sắm</Link>
            </div>
        );
    }

    return (
        <div className="container py-4 cart-page" style={{ minHeight: '60vh' }}>
            <h4 className="fw-bold mb-4">Giỏ hàng của bạn</h4>
            <div className="row">
                <div className="col-lg-8 mb-4">

                    {/* CHỌN TẤT CẢ */}
                    <div className="card shadow-sm border-0 mb-3">
                        <div className="card-body p-3 d-flex align-items-center">
                            <input
                                type="checkbox"
                                className="form-check-input me-3 mt-0"
                                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                checked={cartItems.length > 0 && selectedItems.length === cartItems.length}
                                onChange={handleSelectAll}
                                id="selectAll"
                            />
                            <label className="fw-bold m-0" style={{ cursor: 'pointer' }} htmlFor="selectAll">
                                Chọn tất cả ({cartItems.length} sản phẩm)
                            </label>
                        </div>
                    </div>

                    <div className="card shadow-sm border-0">
                        <div className="card-body p-0">
                            {cartItems.map((item) => {
                                const product = item.product;
                                const imgUrl = product?.product_images?.[0]?.url || "https://via.placeholder.com/100";
                                const price = product?.discount_price || 0;

                                return (
                                    <div key={product.id} className="d-flex align-items-center p-3 border-bottom position-relative">
                                        <input
                                            type="checkbox"
                                            className="form-check-input me-3 mt-0"
                                            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                            checked={selectedItems.includes(product.id)}
                                            onChange={() => handleSelectItem(product.id)}
                                        />
                                        <Link to={`/product/${product?.slug}`} className="flex-shrink-0">
                                            <img src={imgUrl} alt={product?.name} className="rounded border" style={{ width: '90px', height: '90px', objectFit: 'contain' }} />
                                        </Link>
                                        <div className="flex-grow-1 ms-3 pe-4">
                                            <Link to={`/product/${product?.slug}`} className="text-dark text-decoration-none fw-bold d-block mb-1">
                                                {product?.name}
                                            </Link>
                                            <div className="text-danger fw-bold mb-2">{formatPrice(price)}₫</div>
                                            <div className="d-flex align-items-center">
                                                <span className="text-muted small me-2">Số lượng:</span>
                                                <div className="input-group input-group-sm" style={{ width: '100px' }}>
                                                    <button className="btn btn-outline-secondary" onClick={() => handleUpdateQuantity(product.id, item.quantity - 1)}>-</button>
                                                    <input
                                                        type="text"
                                                        className="form-control text-center px-1"
                                                        value={item.quantity}
                                                        onChange={(e) => handleUpdateQuantity(product.id, e.target.value)}
                                                        onBlur={() => handleBlurQuantity(product.id, item.quantity)}
                                                    />
                                                    <button className="btn btn-outline-secondary" onClick={() => handleUpdateQuantity(product.id, item.quantity === '' ? 1 : item.quantity + 1)}>+</button>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            className="btn btn-link text-danger position-absolute top-50 end-0 translate-middle-y me-3"
                                            title="Xóa"
                                            onClick={() => handleRemoveItem(product.id)}
                                        >
                                            <i className="bi bi-trash fs-5"></i>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="col-lg-4">
                    <div className="card shadow-sm border-0 sticky-top" style={{ top: '100px' }}>
                        <div className="card-body">
                            <h5 className="fw-bold mb-3 border-bottom pb-2">Tóm tắt đơn hàng</h5>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">Tạm tính:</span>
                                <span className="fw-bold">{formatPrice(totalRegularPrice)}₫</span>
                            </div>
                            {totalDiscount > 0 && (
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">Khuyến mãi:</span>
                                    <span className="text-success fw-bold">- {formatPrice(totalDiscount)}₫</span>
                                </div>
                            )}
                            <div className="d-flex justify-content-between mb-3 border-bottom pb-3">
                                <span className="text-muted">Phí giao hàng:</span>
                                {shippingFee === 0 ? (
                                    <span className="text-success fw-bold">Miễn phí</span>
                                ) : (
                                    <span className="fw-bold">{formatPrice(shippingFee)}₫</span>
                                )}
                            </div>
                            <div className="d-flex justify-content-between mb-4">
                                <span className="fw-bold fs-5">Tổng cộng:</span>
                                <div className="text-end">
                                    <span className="fw-bold fs-4 text-danger d-block">{formatPrice(finalTotal)}₫</span>
                                    <small className="text-muted">(Đã bao gồm VAT)</small>
                                </div>
                            </div>
                            <button
                                className="btn btn-danger w-100 py-2 fw-bold"
                                disabled={selectedItems.length === 0}
                                onClick={handleCheckout}
                            >
                                TIẾN HÀNH ĐẶT HÀNG {selectedItems.length > 0 ? `(${selectedItems.length})` : ''}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default Cart;