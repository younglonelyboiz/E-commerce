import axios from "../setUp/axios";

const addToCartApi = (productId, quantity) => {
  return axios.post("/cart/add", { productId, quantity });
};

const getCartApi = () => {
  return axios.get("/cart");
};

const removeFromCartApi = (productId) => {
  return axios.delete(`/cart/remove/${productId}`);
};

export { addToCartApi, getCartApi, removeFromCartApi };
