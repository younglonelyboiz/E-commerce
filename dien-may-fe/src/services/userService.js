// src/services/userService.js
import axios from "../setUp/axios";

export const registerNewUser = (userData) => {
  return axios.post("/register-user", {
    email: userData.email,
    password: userData.password,
    user_name: userData.user_name,
  });
};

export const loginApi = (email, password) => {
  return axios.post("/login", { email, password });
};

// --- THÊM HÀM NÀY ĐỂ FIX LỖI ---
export const getUserAccount = () => {
  return axios.get("/account"); // Đường dẫn này phải khớp với router.get("/account",...) ở Backend
};

export const logoutUser = () => {
  return axios.post("/logout"); // axios này là cái instance đã có withCredentials
};
