import axios from "../setup/axios";
export const getUserOrdersApi = () => {
  return axios.get("/user/orders");
};

export const cancelUserOrderApi = (orderId) => {
  return axios.put(`/user/orders/${orderId}/cancel`);
};
