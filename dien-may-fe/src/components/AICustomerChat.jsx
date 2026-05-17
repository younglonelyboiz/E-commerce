import React, { useState, useEffect, useContext, useRef } from 'react';
import { UserContext } from '../context/UserContext';
import { getAIApiHistory, sendAIApiMessage, resetAIApiSession } from '../services/chatService';
import { toast } from 'react-toastify';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import { Modal, Button } from 'react-bootstrap';
import ConfirmModal from './ConfirmModal';
import './AICustomerChat.scss';

const AICustomerChat = () => {
    const { user } = useContext(UserContext); // Lấy thông tin user đăng nhập
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isAITyping, setIsAITyping] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    const messagesEndRef = useRef(null);

    // 1. Fetch dữ liệu khởi tạo khi mở cửa sổ chat
    useEffect(() => {
        if (isOpen && user && user.auth && user.roles && !user.roles.includes("ADMIN")) {
            fetchInitialData();
        }
    }, [isOpen, user]);

    const fetchInitialData = async () => {
        try {
            const resHistory = await getAIApiHistory();
            if (resHistory && resHistory.EC === 0 && Array.isArray(resHistory.DT)) {
                setMessages(resHistory.DT);
            }
        } catch (error) {
            console.error("Lỗi fetch AI chat history:", error);
        }
    };

    // Cuộn xuống cuối mỗi khi có tin nhắn mới hoặc AI đang gõ
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isAITyping, isOpen]);

    // Hàm format thời gian (tương tự CustomerChat)
    const formatTime = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        if (isNaN(date)) return "";
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return "Vừa xong";
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24 && date.getDate() === now.getDate()) {
            return `${diffInHours} giờ trước`;
        }
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + " " + date.toLocaleDateString('vi-VN');
    };

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    const handleResetChat = async () => {
        setShowResetConfirm(false);
        try {
            const res = await resetAIApiSession();
            if (res && res.EC === 0) {
                setMessages([]);
                toast.success("Đã xóa lịch sử trò chuyện.");
            } else {
                toast.error("Lỗi khi xóa lịch sử.");
            }
        } catch (error) {
            console.error("Lỗi reset chat:", error);
            toast.error("Không thể kết nối đến máy chủ.");
        }
    };

    // 3. Khách hàng Gửi tin nhắn
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputValue.trim() || isAITyping) return;

        const question = inputValue.trim();
        setInputValue('');
        setIsAITyping(true);

        // Thêm tin nhắn của user vào state ngay lập tức để UI cập nhật
        const userMsg = {
            sender_type: 'USER',
            content: question,
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, userMsg]);

        try {
            const res = await sendAIApiMessage({ question });
            if (res && res.EC === 0) {
                const aiMsg = {
                    sender_type: 'AI',
                    content: res.DT.answer,
                    source_products: res.DT.source_products,
                    created_at: new Date().toISOString()
                };
                setMessages(prev => [...prev, aiMsg]);
            } else {
                toast.error(res.EM || "AI gặp sự cố.");
                // Có thể thêm tin nhắn lỗi giả vào
                const errorMsg = {
                    sender_type: 'AI',
                    content: "Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau.",
                    created_at: new Date().toISOString()
                };
                setMessages(prev => [...prev, errorMsg]);
            }
        } catch (error) {
            console.error("Lỗi gửi tin nhắn AI:", error);
            toast.error("Lỗi mạng hoặc server không phản hồi.");
            const errorMsg = {
                sender_type: 'AI',
                content: "Hệ thống AI đang bảo trì hoặc mất kết nối. Vui lòng thử lại sau.",
                created_at: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsAITyping(false);
        }
    };

    // Không hiển thị nếu chưa đăng nhập hoặc là ADMIN
    if (!user || !user.auth || user.roles?.includes("ADMIN")) return null;

    return (
        <div className="ai-customer-chat-container">
            {isOpen && (
                <div className="chat-window shadow-lg">
                    <div className="chat-header text-white d-flex justify-content-between align-items-center">
                        <span className="fw-bold"><i className="bi bi-robot me-2"></i> Trợ lý ảo AI (Thử nghiệm)</span>
                        <div>
                            <button className="btn btn-sm text-white me-2" onClick={() => setShowResetConfirm(true)} title="Làm mới cuộc trò chuyện">
                                <i className="bi bi-arrow-clockwise"></i>
                            </button>
                            <button className="btn btn-sm text-white" onClick={toggleChat} title="Đóng">
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>
                    </div>
                    <div className="chat-body">
                        {messages.length === 0 && (
                            <div className="text-center text-muted mt-4 fs-6">
                                <i className="bi bi-stars fs-1 text-primary d-block mb-2"></i>
                                Xin chào! Tôi là Trợ lý AI.<br />Hãy hỏi tôi bất kỳ thông tin nào về sản phẩm nhé!
                            </div>
                        )}
                        {messages.map((msg, idx) => (
                            <div key={msg.id || idx} className={`message-wrapper ${msg.sender_type === 'USER' ? 'right' : 'left'}`}>
                                <div className={`message-bubble`}>
                                    {msg.sender_type === 'AI' ? (
                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    ) : (
                                        msg.content
                                    )}
                                </div>
                                
                                {msg.source_products && msg.source_products.length > 0 && (
                                    <div className="product-suggestions">
                                        {msg.source_products.map((product, pIdx) => (
                                            <Link key={pIdx} to={`/product/${product.slug}`} className="product-card" target="_blank" rel="noopener noreferrer">
                                                <img 
                                                    src={product.thumbnail || "https://via.placeholder.com/40?text=SP"} 
                                                    alt={product.name} 
                                                    className="product-image"
                                                    onError={(e) => { e.target.src = "https://via.placeholder.com/40?text=SP"; }}
                                                />
                                                <div className="product-info">
                                                    <p className="product-name" title={product.name}>{product.name}</p>
                                                    <p className="product-price">
                                                        {product.discount_price 
                                                            ? Number(product.discount_price).toLocaleString('vi-VN') + 'đ' 
                                                            : Number(product.regular_price).toLocaleString('vi-VN') + 'đ'
                                                        }
                                                    </p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                                
                                <div className={`small mt-1 ${msg.sender_type === 'USER' ? 'text-muted text-end' : 'text-muted text-start'}`} style={{ fontSize: '10px' }}>
                                    {formatTime(msg.createdAt || msg.created_at)}
                                </div>
                            </div>
                        ))}
                        {isAITyping && (
                            <div className="typing-indicator shadow-sm">
                                <span className="dot"></span>
                                <span className="dot"></span>
                                <span className="dot"></span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="chat-footer">
                        <form onSubmit={handleSendMessage} className="d-flex gap-2 w-100">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Hỏi AI về sản phẩm..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                disabled={isAITyping}
                            />
                            <button type="submit" className="btn btn-primary" disabled={isAITyping || !inputValue.trim()}>
                                <i className="bi bi-send-fill"></i>
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div className="chat-trigger-btn shadow" onClick={toggleChat} title="Trợ lý AI">
                <i className="bi bi-robot fs-3 text-white"></i>
            </div>

            <ConfirmModal
                show={showResetConfirm}
                onHide={() => setShowResetConfirm(false)}
                onConfirm={handleResetChat}
                title="Xác nhận xóa"
                message="Bạn có chắc chắn muốn xóa toàn bộ lịch sử chat với AI?"
                confirmText="Xác nhận xóa"
                type="danger"
            />
        </div>
    );
};
export default AICustomerChat;
