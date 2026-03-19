import axios from "../setUp/axios"; // Đường dẫn cấu hình axios của bạn

export const fetchAllOrders = (page, limit, status) => {
  let url = `/admin/orders?page=${page}&limit=${limit}`;
  if (status) url += `&status=${status}`;
  return axios.get(url);
};

export const fetchOrderDetail = (id) => {
  return axios.get(`/admin/orders/${id}`);
};

export const updateOrderStatus = (id, status, admin_note) => {
  return axios.put(`/admin/orders/${id}/status`, { status, admin_note });
};
