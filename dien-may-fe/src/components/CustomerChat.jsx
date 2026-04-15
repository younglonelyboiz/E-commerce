import React, { useState, useEffect, useContext, useRef } from 'react';
import { UserContext } from '../context/UserContext';
import { io } from 'socket.io-client';
import { getUserMessagesApi, getUnreadCountApi, uploadChatImageApi } from '../services/chatService';
import { toast } from 'react-toastify';
import './CustomerChat.scss';

const CustomerChat = () => {
    const { user } = useContext(UserContext); // Lấy thông tin user đăng nhập
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const [isAdminTyping, setIsAdminTyping] = useState(false);
    const [socket, setSocket] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const isTypingRef = useRef(false);
    const isOpenRef = useRef(isOpen);
    const fileInputRef = useRef(null);
    useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);

    // 1. Khởi tạo Socket & Load lịch sử tin nhắn
    useEffect(() => {
        if (user && user.auth && user.roles && !user.roles.includes("ADMIN")) {
            const newSocket = io(import.meta.env.VITE_BACKEND_URL || "http://localhost:8080", {
                withCredentials: true
            });
            setSocket(newSocket);

            const userId = user?.id || user?.account?.id;

            // Lắng nghe admin đang gõ
            newSocket.on("admin_typing", ({ isTyping }) => {
                setIsAdminTyping(isTyping);
            });

            newSocket.on("receive_message", (newMessage) => {
                setIsAdminTyping(false); // Tắt chỉ báo khi nhận được tin nhắn
                setMessages((prev) => [...prev, newMessage]);

                // Nếu khung chat đang đóng thì tăng số lượng chưa đọc
                if (!isOpenRef.current) {
                    setUnreadCount(prev => prev + 1);
                } else {
                    // Nếu đang mở thì báo là đã đọc
                    if (userId) newSocket.emit("user_read_message", userId);
                }
            });

            // Fetch dữ liệu khởi tạo
            fetchInitialData();

            return () => newSocket.disconnect();
        }
    }, [user]);

    const fetchInitialData = async () => {
        try {
            const resHistory = await getUserMessagesApi();
            if (resHistory && resHistory.EC === 0 && Array.isArray(resHistory.DT)) {
                setMessages(resHistory.DT);
            }

            if (!isOpen) {
                const resUnread = await getUnreadCountApi();
                if (resUnread && resUnread.EC === 0) setUnreadCount(resUnread.DT);
            }
        } catch (error) {
            console.error("Lỗi fetch chat data:", error);
        }
    };

    // Cuộn xuống cuối mỗi khi có tin nhắn mới
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    // Hàm tính toán thời gian "Vừa xong", "X phút trước"
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

    // 2. Xử lý mở/đóng khung chat
    const toggleChat = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setUnreadCount(0); // Reset unread khi mở
            if (socket) socket.emit("user_read_message", user.id || user.account?.id);
        }
    };

    // 3. Khách hàng Gửi tin nhắn
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputValue.trim() || !socket) return;

        const userId = user?.id || user?.account?.id;

        // Báo cho admin là mình đã ngừng gõ
        socket.emit("user_typing", { userId, isTyping: false });
        isTypingRef.current = false;
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        socket.emit("send_message", {
            userId: userId,
            content: inputValue
        });

        setInputValue('');
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setInputValue(val);

        if (!socket) {
            return;
        }

        const userId = user?.id || user?.account?.id;
        if (!userId) {
            return;
        }

        if (val.trim() !== '') {
            if (!isTypingRef.current) {
                isTypingRef.current = true;
                socket.emit("user_typing", { userId, isTyping: true });
            }

            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

            typingTimeoutRef.current = setTimeout(() => {
                socket.emit("user_typing", { userId, isTyping: false });
                isTypingRef.current = false;
            }, 3000); // Ngừng gõ sau 3s không có hoạt động
        } else {
            socket.emit("user_typing", { userId, isTyping: false });
            isTypingRef.current = false;
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        }
    };

    // Xử lý upload ảnh
    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !socket) return;

        // Kiểm tra file
        if (!file.type.startsWith('image/')) {
            toast.error("Vui lòng chọn một file ảnh!");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Dung lượng ảnh không được vượt quá 5MB!");
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('caption', '');

            const res = await uploadChatImageApi(formData);
            if (res && res.EC === 0) {
                const { imageUrl, publicId } = res.DT;
                const userId = user?.id || user?.account?.id;

                // Báo admin đã ngừng gõ
                socket.emit("user_typing", { userId, isTyping: false });
                isTypingRef.current = false;
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

                // Gửi ảnh qua socket
                socket.emit("send_image", {
                    userId: userId,
                    imageUrl: imageUrl,
                    publicId: publicId,
                    caption: ""
                });

                toast.success("Gửi ảnh thành công!");
                if (fileInputRef.current) fileInputRef.current.value = '';
            } else {
                toast.error(res.EM || "Lỗi upload ảnh");
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Lỗi khi upload ảnh");
        } finally {
            setIsUploading(false);
        }
    };

    // Không hiển thị chat nếu chưa đăng nhập hoặc là ADMIN
    if (!user || !user.auth || user.roles?.includes("ADMIN")) return null;

    return (
        <div className="customer-chat-container">
            {isOpen && (
                <div className="chat-window shadow-lg">
                    <div className="chat-header bg-danger text-white d-flex justify-content-between align-items-center">
                        <span className="fw-bold"><i className="bi bi-headset me-2"></i> Hỗ trợ trực tuyến</span>
                        <button className="btn btn-sm text-white" onClick={toggleChat}>
                            <i className="bi bi-x-lg"></i>
                        </button>
                    </div>
                    <div className="chat-body">
                        {messages.length === 0 && <div className="text-center text-muted mt-3 fs-6">Bắt đầu trò chuyện với chúng tôi!</div>}
                        {messages.map((msg, idx) => {
                            const isImage = msg.message_type === 'IMAGE';
                            return (
                                <div key={msg.id || idx} className={`message-wrapper ${msg.sender_type === 'USER' ? 'right' : 'left'}`}>
                                    {msg.message_type === 'SYSTEM' ? (
                                        <div className="system-msg text-center w-100 my-2"><span className="badge bg-secondary opacity-75">{msg.content}</span></div>
                                    ) : (
                                        <div className={`message-bubble ${msg.sender_type === 'USER' ? 'bg-danger text-white' : 'bg-light text-dark border'}`}>
                                            {isImage ? (
                                                <div>
                                                    <img
                                                        src={msg.image_url}
                                                        alt="chat-image"
                                                        style={{ maxWidth: '100%', borderRadius: '8px' }}
                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                    />
                                                    {msg.content && msg.content !== '📷 Ảnh' && (
                                                        <p className="mb-0 mt-2">{msg.content}</p>
                                                    )}
                                                </div>
                                            ) : (
                                                msg.content
                                            )}
                                            <div className={`small mt-1 ${msg.sender_type === 'USER' ? 'text-white-50 text-end' : 'text-muted text-start'}`} style={{ fontSize: '10px' }}>
                                                {formatTime(msg.createdAt || msg.created_at)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {isAdminTyping && (
                            <div className="message-wrapper left">
                                <div className="message-bubble bg-light text-dark border d-flex align-items-center">
                                    <em className="text-muted small me-2">Nhân viên đang soạn tin</em>
                                    <div className="typing-indicator">
                                        <span className="dot"></span>
                                        <span className="dot"></span>
                                        <span className="dot"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="chat-footer">
                        <form onSubmit={handleSendMessage} className="d-flex gap-2 w-100">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Nhập tin nhắn..."
                                value={inputValue}
                                onChange={handleInputChange}
                            />
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                style={{ display: 'none' }}
                            />
                            <button
                                type="button"
                                className="btn btn-outline-danger"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                title="Gửi ảnh"
                            >
                                <i className="bi bi-image"></i>
                            </button>
                            <button type="submit" className="btn btn-danger" disabled={isUploading}>
                                <i className="bi bi-send-fill"></i>
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div className="chat-trigger-btn bg-danger text-white shadow" onClick={toggleChat}>
                <i className="bi bi-chat-dots-fill fs-3"></i>
                {unreadCount > 0 && <span className="unread-badge bg-warning text-dark">{unreadCount}</span>}
            </div>
        </div>
    );
};
export default CustomerChat;