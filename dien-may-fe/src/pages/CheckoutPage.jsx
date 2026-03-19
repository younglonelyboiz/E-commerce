import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AddressModal from '../components/AddressModal';
import { getUserAddressesApi, addUserAddressApi, updateUserAddressApi, createOrderApi } from '../services/checkoutService';
import { toast } from 'react-toastify';
import { UserContext } from '../context/UserContext';
import { getCartApi } from '../services/cartService';

const CheckoutPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const { setCartCount } = useContext(UserContext);

    // 0. Nhận danh sách sản phẩm từ trang Giỏ Hàng hoặc Chi Tiết Sản Phẩm truyền qua
    // Dữ liệu mẫu item: { product_id, name, price, quantity }
    const [checkoutItems, setCheckoutItems] = useState(location.state?.items || []);
    const [customerNote, setCustomerNote] = useState('');

    // Tính tổng tiền
    const provisionalTotal = checkoutItems.reduce((sum, item) => sum + (item.price * (item.quantity || 0)), 0);

    // Nếu vào thẳng trang checkout mà không có sản phẩm nào thì đá về trang chủ
    useEffect(() => {
        if (!checkoutItems || checkoutItems.length === 0) {
            toast.warning("Chưa có sản phẩm nào để thanh toán!");
            navigate('/');
        }
    }, [checkoutItems.length, navigate]);

    // 1. Tải danh sách địa chỉ khi vào trang
    useEffect(() => {
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        try {
            const res = await getUserAddressesApi();
            if (res && res.EC === 0) {
                setAddresses(res.DT);
                // Mặc định chọn địa chỉ đầu tiên (is_default đã được Backend đẩy lên đầu)
                if (res.DT.length > 0) {
                    setSelectedAddress(res.DT[0]);
                } else {
                    toast.info("Bạn chưa có địa chỉ giao hàng. Vui lòng thêm địa chỉ để tiếp tục!");
                }
            }
        } catch (error) {
            console.log("Lỗi tải địa chỉ:", error);
        }
    };

    // 2. Thêm địa chỉ mới từ Modal
    const handleAddNewAddress = async (newAddr) => {
        try {
            const res = await addUserAddressApi(newAddr);
            if (res && res.EC === 0) {
                toast.success("Thêm địa chỉ thành công!");
                await fetchAddresses(); // Load lại danh sách sổ địa chỉ
                setSelectedAddress(res.DT); // Tự động chọn luôn địa chỉ mới thêm
            } else {
                toast.error(res?.EM || "Lỗi thêm địa chỉ");
            }
        } catch (error) {
            toast.error("Lỗi server khi thêm địa chỉ!");
        }
    };

    // Xử lý thay đổi số lượng (Cả ấn nút và gõ tay)
    const handleUpdateQuantity = (productId, value) => {
        let newQuantity = value;
        if (typeof value === 'string') {
            if (value === '') newQuantity = ''; // Cho phép xóa trắng tạm thời để gõ số mới
            else {
                newQuantity = parseInt(value, 10);
                if (isNaN(newQuantity)) return; // Bỏ qua nếu gõ chữ
            }
        } else if (value < 1) return;

        setCheckoutItems(prev => prev.map(item => item.product_id === productId ? { ...item, quantity: newQuantity } : item));
    };

    const handleBlurQuantity = (productId, currentQuantity) => {
        if (currentQuantity === '' || currentQuantity < 1) {
            setCheckoutItems(prev => prev.map(item => item.product_id === productId ? { ...item, quantity: 1 } : item));
        }
    };

    // Cập nhật địa chỉ từ Modal
    const handleUpdateAddress = async (id, updatedAddr) => {
        try {
            const res = await updateUserAddressApi(id, updatedAddr);
            if (res && res.EC === 0) {
                toast.success("Cập nhật địa chỉ thành công!");
                await fetchAddresses(); // Tải lại danh sách
                if (selectedAddress?.id === id) setSelectedAddress(updatedAddr);
            } else {
                toast.error(res?.EM || "Lỗi cập nhật địa chỉ");
            }
        } catch (error) {
            toast.error("Lỗi server khi cập nhật địa chỉ!");
        }
    };

    // 3. Xử lý Nút Đặt hàng
    const handlePlaceOrder = async () => {
        if (!selectedAddress) {
            toast.warning("Vui lòng chọn địa chỉ giao hàng!");
            return;
        }

        // Tạo snapshot nguyên khối (Ví dụ: "Số 12 Lê Lợi, Bến Nghé, Quận 1, TPHCM")
        const snapshot = `${selectedAddress.specific_address}, ${selectedAddress.ward}, ${selectedAddress.district}, ${selectedAddress.province}`;
        const orderPayload = {
            shipping_name: selectedAddress.receiver_name,
            shipping_phone: selectedAddress.phone,
            shipping_address_snapshot: snapshot,
            payment_method: "COD",
            customer_note: customerNote,
            // Truyền mảng sản phẩm cần mua xuống Backend
            items: checkoutItems.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity
            }))
        };

        try {
            const res = await createOrderApi(orderPayload);
            if (res && res.EC === 0) {
                toast.success("Đặt hàng thành công!");

                // Đồng bộ lại số lượng trên Icon Giỏ Hàng
                try {
                    const cartRes = await getCartApi();
                    if (cartRes && cartRes.EC === 0) {
                        const newCount = (cartRes.DT || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
                        setCartCount(newCount);
                    }
                } catch (error) { }

                // Sau khi đặt thành công, tự động chuyển người dùng sang trang Lịch sử đơn hàng
                navigate('/order-history');
            } else {
                toast.error(res?.EM || "Đặt hàng thất bại");
            }
        } catch (error) {
            toast.error("Lỗi server khi đặt hàng");
        }
    };

    return (
        <div className="container mt-4 mb-5" style={{ minHeight: '60vh' }}>
            <h3 className="mb-4 text-uppercase fw-bold">Thanh toán</h3>
            <div className="row">
                <div className="col-lg-8 mb-4">
                    {/* Block Địa chỉ nhận hàng */}
                    <div className="card shadow-sm border-0 mb-3">
                        <div className="card-header bg-white border-bottom-0 pt-3 d-flex justify-content-between align-items-center">
                            <h5 className="mb-0 text-danger"><i className="fas fa-map-marker-alt me-2"></i> Địa Chỉ Nhận Hàng</h5>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => setShowAddressModal(true)}>
                                {selectedAddress ? "Thay đổi" : "+ Thêm địa chỉ"}
                            </button>
                        </div>
                        <div className="card-body pt-1">
                            {selectedAddress ? (
                                <div className="d-flex align-items-start">
                                    <div className="fw-bold text-dark me-3 text-nowrap">{selectedAddress.receiver_name} {selectedAddress.phone}</div>
                                    <div className="text-secondary">{selectedAddress.specific_address}, {selectedAddress.ward}, {selectedAddress.district}, {selectedAddress.province}</div>
                                    {selectedAddress.is_default && <span className="badge bg-danger ms-auto">Mặc định</span>}
                                </div>
                            ) : (
                                <div className="text-center py-3 text-muted">
                                    Chưa có địa chỉ giao hàng. Vui lòng thêm địa chỉ để tiếp tục thanh toán!
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Block Ghi chú đơn hàng */}
                    <div className="card shadow-sm border-0 mb-3">
                        <div className="card-header bg-white border-bottom-0 pt-3">
                            <h5 className="mb-0 text-dark"><i className="fas fa-edit me-2"></i> Ghi chú đơn hàng</h5>
                        </div>
                        <div className="card-body pt-1">
                            <textarea
                                className="form-control"
                                rows="2"
                                placeholder="Lưu ý cho người bán (Ví dụ: Giao hàng ngoài giờ hành chính...)"
                                value={customerNote}
                                onChange={(e) => setCustomerNote(e.target.value)}
                            ></textarea>
                        </div>
                    </div>

                    {/* Nơi render danh sách giỏ hàng */}
                    <div className="card shadow-sm border-0">
                        <div className="card-header bg-white border-bottom-0 pt-3"><h5 className="mb-0">Sản phẩm đơn hàng</h5></div>
                        <div className="card-body">
                            {checkoutItems.map((item, idx) => (
                                <div key={idx} className="d-flex align-items-center mb-3 pb-3 border-bottom">
                                    <img src={item.image || "https://via.placeholder.com/60"} alt={item.name} className="rounded border me-3" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
                                    <div className="flex-grow-1">
                                        <div className="fw-bold">{item.name}</div>
                                        <div className="d-flex align-items-center mt-2">
                                            <span className="text-muted small me-2">Số lượng:</span>
                                            <div className="input-group input-group-sm" style={{ width: '100px' }}>
                                                <button className="btn btn-outline-secondary" onClick={() => handleUpdateQuantity(item.product_id, item.quantity - 1)}>-</button>
                                                <input
                                                    type="text"
                                                    className="form-control text-center px-1"
                                                    value={item.quantity}
                                                    onChange={(e) => handleUpdateQuantity(item.product_id, e.target.value)}
                                                    onBlur={() => handleBlurQuantity(item.product_id, item.quantity)}
                                                />
                                                <button className="btn btn-outline-secondary" onClick={() => handleUpdateQuantity(item.product_id, item.quantity === '' ? 1 : item.quantity + 1)}>+</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="fw-bold text-danger text-end">
                                        {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="col-lg-4">
                    <div className="card shadow-sm border-0 position-sticky" style={{ top: '100px' }}>
                        <div className="card-body">
                            <h5 className="card-title mb-4">Thông tin đơn hàng</h5>
                            <div className="d-flex justify-content-between mb-2"><span>Tạm tính:</span><span>{provisionalTotal.toLocaleString('vi-VN')}đ</span></div>
                            <div className="d-flex justify-content-between mb-2"><span>Phí vận chuyển:</span><span>Miễn phí</span></div>
                            <hr />
                            <div className="d-flex justify-content-between mb-4"><span className="fw-bold">Tổng cộng:</span><span className="fw-bold text-danger fs-5">{provisionalTotal.toLocaleString('vi-VN')}đ</span></div>
                            <button className="btn btn-danger w-100 py-2 fw-bold" onClick={handlePlaceOrder}>ĐẶT HÀNG</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Component Modal */}
            {showAddressModal && (
                <AddressModal
                    show={showAddressModal}
                    setShow={setShowAddressModal}
                    addresses={addresses}
                    onSelectAddress={(addr) => setSelectedAddress(addr)}
                    onAddNewAddress={handleAddNewAddress}
                    onUpdateAddress={handleUpdateAddress}
                />
            )}
        </div>
    );
}

export default CheckoutPage;