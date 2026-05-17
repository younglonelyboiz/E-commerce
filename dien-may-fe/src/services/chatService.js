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

// --- API Dành cho AI Assistant ---
const getAIApiHistory = () => {
  return axios.get("/ai-chat/history");
};

const sendAIApiMessage = (data) => {
  return axios.post("/ai-chat", data);
};

const resetAIApiSession = () => {
  return axios.delete("/ai-chat");
};

export {
  getUnreadCountApi,
  getUserMessagesApi,
  getConversationsApi,
  getAdminMessagesApi,
  uploadChatImageApi,
  getAIApiHistory,
  sendAIApiMessage,
  resetAIApiSession,
};
