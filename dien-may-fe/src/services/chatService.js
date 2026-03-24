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

export {
  getUnreadCountApi,
  getUserMessagesApi,
  getConversationsApi,
  getAdminMessagesApi,
};
