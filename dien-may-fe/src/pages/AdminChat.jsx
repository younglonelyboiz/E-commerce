import React, { useState, useEffect, useContext, useRef } from 'react';
import { UserContext } from '../context/UserContext';
import { io } from 'socket.io-client';
import { getConversationsApi, getAdminMessagesApi } from '../services/chatService';
import { toast } from 'react-toastify';
import './AdminChat.scss';

const AdminChat = () => {
    const { user } = useContext(UserContext);
    const [conversations, setConversations] = useState([]);
    const [activeConv, setActiveConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [socket, setSocket] = useState(null);
    const [typingConversations, setTypingConversations] = useState({});

    const messagesEndRef = useRef(null);
    const adminTypingTimeoutRef = useRef(null);
    const isAdminTypingRef = useRef(false);

    const activeConvRef = useRef(activeConv);
    useEffect(() => {
        activeConvRef.current = activeConv;
    }, [activeConv]);

    // Gọi API qua Service chuẩn mực
    const fetchConversations = async () => {
        try {
            const res = await getConversationsApi();
            if (res && res.EC === 0) {
                setConversations(res.DT);
            }
        } catch (error) {
            console.error(error);
            toast.error("Lỗi khi tải danh sách hội thoại");
        }
    };

    useEffect(() => {
        fetchConversations();
    }, []);

    // Khởi tạo Socket
    useEffect(() => {
        if (user && user.auth && user.roles?.includes("ADMIN")) {
            const newSocket = io(import.meta.env.VITE_BACKEND_URL || "http://localhost:8080", {
                withCredentials: true
            });
            setSocket(newSocket);

            // Lắng nghe khách hàng đang gõ
            newSocket.on("user_typing", ({ userId, isTyping }) => {
                setTypingConversations(prev => ({ ...prev, [String(userId)]: isTyping }));
            });

            // Có tin nhắn mới từ Khách -> Cập nhật danh sách & khung chat nếu đang mở
            newSocket.on("admin_receive_message", (data) => {
                // Tắt chỉ báo typing khi nhận được tin
                const custId = data.conversation?.user_id || data.conversation?.customer?.id;
                setTypingConversations(prev => ({ ...prev, [String(custId)]: false }));

                fetchConversations();
                if (activeConvRef.current && activeConvRef.current.id === data.conversation.id) {
                    setMessages(prev => [...prev, data.message]);
                    newSocket.emit("admin_open_conversation", { conversationId: activeConvRef.current.id });
                }
            });

            // Admin khác vừa đọc -> Reset Unread Badge
            newSocket.on("admin_read_update", (data) => {
                setConversations(prev => prev.map(c =>
                    c.id === data.conversationId ? { ...c, unread_count_admin: 0 } : c
                ));
            });

            // Ai đó vừa rep khách hoặc Cướp cờ -> Đồng bộ UI chung
            newSocket.on("admin_reply_update", (data) => {
                fetchConversations();
                if (activeConvRef.current && activeConvRef.current.id === data.conversation?.id) {
                    setMessages(prev => [...prev, data.message]);
                }
            });

            // Đóng hội thoại
            newSocket.on("admin_chat_closed", (data) => {
                setConversations(prev => prev.filter(c => c.id !== data.conversationId));
                if (activeConvRef.current && activeConvRef.current.id === data.conversationId) {
                    setActiveConv(null);
                    setMessages([]);
                    toast.info("Hội thoại đã được hoàn tất và chuyển vào Lịch sử.");
                }
            });

            newSocket.on("admin_error", (data) => {
                toast.error(data.message);
                fetchConversations(); // Tải lại vì có thể ai đó đã cướp cờ trước
            });

            return () => newSocket.disconnect();
        }
    }, [user]);

    // Click mở 1 hội thoại -> Xóa Badge & Gọi API lịch sử
    const handleSelectConversation = async (conv) => {
        setActiveConv(conv);
        try {
            const res = await getAdminMessagesApi(conv.id);
            if (res && res.EC === 0) {
                setMessages(res.DT);
            }
            if (socket && conv.unread_count_admin > 0) {
                socket.emit("admin_open_conversation", { conversationId: conv.id });
                setConversations(prev => prev.map(c =>
                    c.id === conv.id ? { ...c, unread_count_admin: 0 } : c
                ));
            }
        } catch (error) {
            toast.error("Lỗi tải tin nhắn chi tiết!");
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Gửi tin nhắn -> Kích hoạt Atomic Update ghim ca
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputValue.trim() || !socket || !activeConv) return;

        // Báo cho khách là mình đã ngừng gõ
        socket.emit("admin_typing", {
            userId: activeConv.user_id || activeConv.customer?.id,
            isTyping: false
        });
        isAdminTypingRef.current = false;
        if (adminTypingTimeoutRef.current) clearTimeout(adminTypingTimeoutRef.current);

        socket.emit("admin_reply", {
            adminId: user.id || user.account?.id,
            conversationId: activeConv.id,
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
        if (!activeConv) {
            return;
        }

        const custId = activeConv.user_id || activeConv.customer?.id;

        if (val.trim() !== '') {
            if (!isAdminTypingRef.current) {
                isAdminTypingRef.current = true;
                socket.emit("admin_typing", { userId: custId, isTyping: true });
            }

            if (adminTypingTimeoutRef.current) clearTimeout(adminTypingTimeoutRef.current);

            adminTypingTimeoutRef.current = setTimeout(() => {
                socket.emit("admin_typing", { userId: custId, isTyping: false });
                isAdminTypingRef.current = false;
            }, 3000);
        } else {
            socket.emit("admin_typing", { userId: custId, isTyping: false });
            isAdminTypingRef.current = false;
            if (adminTypingTimeoutRef.current) clearTimeout(adminTypingTimeoutRef.current);
        }
    };

    // Thực thi Takeover (Cướp quyền)
    const handleTakeOver = () => {
        if (!socket || !activeConv) return;
        socket.emit("admin_takeover", {
            newAdminId: user.id || user.account?.id,
            conversationId: activeConv.id,
            newAdminName: user.userName || "Admin",
            userId: activeConv.user_id || activeConv.customer?.id
        });
    };

    const handleCloseChat = () => {
        if (!socket || !activeConv) return;
        if (window.confirm("Vấn đề đã được giải quyết? Hoàn tất hội thoại này?")) {
            socket.emit("admin_close_chat", { conversationId: activeConv.id });
        }
    };

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
        if (diffInHours < 24 && date.getDate() === now.getDate()) return `${diffInHours} giờ trước`;

        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + " " + date.toLocaleDateString('vi-VN');
    };

    return (
        <div className="admin-chat-dashboard bg-white rounded shadow-sm m-3">
            <div className="row g-0 h-100">
                {/* Cột trái: Danh sách Hội thoại */}
                <div className="col-md-4 border-end chat-list-container">
                    <div className="p-3 border-bottom bg-light">
                        <h5 className="mb-0 fw-bold text-danger"><i className="bi bi-headset me-2"></i>Trực Tổng Đài</h5>
                    </div>
                    <div className="chat-list">
                        {conversations.length === 0 ? (
                            <div className="text-center text-muted p-4">Hiện không có khách nào đang cần hỗ trợ</div>
                        ) : (
                            conversations.map(c => {
                                const isUnread = c.unread_count_admin > 0;
                                const isActive = activeConv?.id === c.id;
                                const adminId = user.id || user.account?.id;
                                const custId = c.user_id || c.customer?.id;
                                return (
                                    <div
                                        key={c.id}
                                        className={`chat-item p-3 border-bottom cursor-pointer ${isActive ? 'bg-danger text-white' : 'hover-bg-light'}`}
                                        onClick={() => handleSelectConversation(c)}
                                    >
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <strong className="text-truncate">{c.customer?.user_name || 'Khách hàng'}</strong>
                                            <small className={isActive ? 'text-white-50' : 'text-muted'}>{formatTime(c.last_message_at)}</small>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span className={`text-truncate small ${isUnread && !isActive ? 'fw-bold text-dark' : (isActive ? 'text-white' : 'text-secondary')}`} style={{ maxWidth: '80%' }}>
                                                {typingConversations[String(custId)] ? (
                                                    <em className={isActive ? 'text-white' : 'text-primary'}>Khách hàng đang soạn tin...</em>
                                                ) : (<>
                                                    {c.last_sender_type === 'USER' ? (isActive ? 'Khách: ' : 'Khách: ') : 'Bạn: '}
                                                    {c.last_message?.content || 'Hình ảnh/Tệp đính kèm'}
                                                </>)}
                                            </span>
                                            {isUnread && <span className="badge bg-warning text-dark rounded-pill">{c.unread_count_admin}</span>}
                                        </div>
                                        <div className="mt-2 small">
                                            {c.assignee_id === null ? (
                                                <span className="badge bg-light border text-dark"><i className="bi bi-hourglass-split me-1"></i>Chờ nhận ca</span>
                                            ) : c.assignee_id === adminId ? (
                                                <span className="badge bg-success"><i className="bi bi-person-check me-1"></i>Đang phụ trách</span>
                                            ) : (
                                                <span className="badge bg-secondary"><i className="bi bi-lock me-1"></i>Khóa bởi: {c.assignee?.user_name}</span>
                                            )}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* Cột phải: Nội dung chi tiết */}
                <div className="col-md-8 chat-content-container d-flex flex-column">
                    {activeConv ? (
                        <>
                            {/* Header Chat Detail */}
                            <div className="p-3 border-bottom bg-light d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="mb-0 fw-bold">{activeConv.customer?.user_name || 'Khách hàng'}</h6>
                                    <small className="text-muted">{activeConv.customer?.email}</small>
                                </div>
                                <div>
                                    {/* Nút Hoàn Tất */}
                                    {(activeConv.assignee_id === (user.id || user.account?.id)) && (
                                        <button className="btn btn-sm btn-success me-2 fw-bold" onClick={handleCloseChat}>
                                            <i className="bi bi-check-circle me-1"></i>Hoàn tất xử lý
                                        </button>
                                    )}

                                    {/* Logic hiển thị Nút Tiếp quản: Đã có người nhận, không phải bản thân, và trôi qua 10 phút */}
                                    {activeConv.assignee_id !== null &&
                                        activeConv.assignee_id !== (user.id || user.account?.id) &&
                                        (new Date() - new Date(activeConv.last_message_at)) > 10 * 60 * 1000 && (
                                            <button className="btn btn-sm btn-warning text-dark fw-bold" onClick={handleTakeOver}>
                                                <i className="bi bi-lightning-charge me-1"></i>Tiếp quản
                                            </button>
                                        )}
                                </div>
                            </div>

                            {/* Body Chat */}
                            <div className="chat-body p-3 flex-grow-1 overflow-auto" style={{ backgroundColor: '#f0f2f5' }}>
                                {messages.map((msg, idx) => {
                                    const isAdmin = msg.sender_type === 'ADMIN';
                                    const isSystem = msg.message_type === 'SYSTEM';

                                    if (isSystem) {
                                        return (
                                            <div key={idx} className="text-center my-3">
                                                <span className="badge bg-secondary opacity-75">{msg.content}</span>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={idx} className={`d-flex mb-3 ${isAdmin ? 'justify-content-end' : 'justify-content-start'}`}>
                                            <div className={`message-bubble p-2 px-3 rounded-3 shadow-sm ${isAdmin ? 'bg-danger text-white' : 'bg-white border'}`} style={{ maxWidth: '75%' }}>
                                                {msg.content}
                                                <div className={`small mt-1 text-end ${isAdmin ? 'text-white-50' : 'text-muted'}`} style={{ fontSize: '11px' }}>
                                                    {formatTime(msg.createdAt || msg.created_at)}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                                {activeConv && typingConversations[String(activeConv.user_id || activeConv.customer?.id)] && (
                                    <div className="d-flex mb-3 justify-content-start">
                                        <div className="message-bubble p-2 px-3 rounded-3 shadow-sm bg-white border d-flex align-items-center">
                                            <em className="text-muted small me-2">Khách hàng đang soạn tin</em>
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

                            {/* Footer Input */}
                            <div className="p-3 border-top bg-white">
                                {(activeConv.assignee_id === null || activeConv.assignee_id === (user.id || user.account?.id)) ? (
                                    <form onSubmit={handleSendMessage} className="d-flex">
                                        <input
                                            type="text"
                                            className="form-control me-2"
                                            placeholder="Nhập phản hồi cho khách hàng..."
                                            value={inputValue}
                                            onChange={handleInputChange}
                                        />
                                        <button type="submit" className="btn btn-danger px-4">
                                            <i className="bi bi-send-fill"></i>
                                        </button>
                                    </form>
                                ) : (
                                    <div className="text-center text-danger small py-2 bg-light rounded border">
                                        <i className="bi bi-lock-fill me-1"></i> Hội thoại này đang được hỗ trợ bởi <strong>{activeConv.assignee?.user_name}</strong>. Bạn chỉ được xem!
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="h-100 d-flex flex-column align-items-center justify-content-center text-muted" style={{ backgroundColor: '#f8f9fa' }}>
                            <i className="bi bi-headset opacity-25" style={{ fontSize: '6rem' }}></i>
                            <h5 className="mt-3 text-secondary">Chọn một khách hàng để bắt đầu hỗ trợ</h5>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminChat;