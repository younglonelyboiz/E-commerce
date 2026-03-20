import axios from "../setUp/axios"; // Đường dẫn file axios của bạn

export const getUserAddressesApi = () => {
  return axios.get("/user/addresses");
};

export const addUserAddressApi = (data) => {
  return axios.post("/user/addresses", data);
};

export const updateUserAddressApi = (id, data) => {
  return axios.put(`/user/addresses/${id}`, data);
};

export const deleteUserAddressApi = (id) => {
  return axios.delete(`/user/addresses/${id}`);
};

export const createOrderApi = (data) => {
  // data chứa: shipping_name, shipping_phone, shipping_address_snapshot, payment_method
  return axios.post("/order/create", data);
};
export const createPaymentLinkApi = (orderCode, amount, description) => {
  return axios.post("/payment/create-link", {
    orderCode,
    amount,
    description,
  });
};

export const retryPaymentLinkApi = (orderId) => {
  return axios.post("/payment/retry", { orderId });
};
