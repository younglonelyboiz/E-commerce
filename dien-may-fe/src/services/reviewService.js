import axios from "../setup/axios"; // Đường dẫn file cấu hình axios của bạn

const createReviewApi = (data) => {
  return axios.post("/review/create", data);
};

const getReviewsApi = (productId, params) => {
  return axios.get(`/review/list/${productId}`, { params });
};

const getAllReviewsAdminApi = (params) => {
  return axios.get("/admin/reviews", { params });
};

const replyReviewAdminApi = (id, reply) => {
  return axios.put(`/admin/reviews/${id}/reply`, { reply });
};

export {
  createReviewApi,
  getReviewsApi,
  getAllReviewsAdminApi,
  replyReviewAdminApi,
};
