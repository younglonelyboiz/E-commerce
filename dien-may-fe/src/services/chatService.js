import axios from "../setup/axios";

// --- API Dành cho Khách Hàng ---
const getUnreadCountApi = () => {
  return axios.get("/chat/unread-count");
};

const getUserMessagesApi = () => {
  return axios.get("/chat/user-messages");
};

// --- API Dành cho Admin ---
const getConversationsApi = () => {
  return axios.get("/chat/conversations");
};

const getAdminMessagesApi = (conversationId) => {
  return axios.get(`/chat/conversations/${conversationId}/messages`);
};

// Upload ảnh cho tin nhắn
const uploadChatImageApi = (formData) => {
  return axios.post("/chat/upload-image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export {
  getUnreadCountApi,
  getUserMessagesApi,
  getConversationsApi,
  getAdminMessagesApi,
  uploadChatImageApi,
};
