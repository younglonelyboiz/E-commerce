// src/services/userService.js
import axios from "../setUp/axios";

export const registerNewUser = (userData) => {
  return axios.post("/register-user", {
    email: userData.email,
    password: userData.password,
    user_name: userData.user_name,
    confirmPassword: userData.confirmPassword,
  });
};

export const loginApi = (email, password) => {
  return axios.post("/login", { email, password });
};

// --- GOOGLE OAUTH ---
export const getGoogleAuthUrlApi = () => {
  return axios.get("/auth/google/url");
};

// --- THÊM HÀM NÀY ĐỂ FIX LỖI ---
export const getUserAccount = () => {
  return axios.get("/account"); // Đường dẫn này phải khớp với router.get("/account",...) ở Backend
};

export const logoutUser = () => {
  return axios.post("/logout"); // axios này là cái instance đã có withCredentials
};

export const fetchAllUserByAdmin = (page, limit, search, sortBy, sortOrder) => {
  return axios.get(
    `/admin/users?page=${page}&limit=${limit}&search=${search}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
  );
};

export const readUserDetail = (id) => {
  return axios.get(`/admin/users/${id}`);
};

export const changePasswordApi = (oldPassword, newPassword) => {
  return axios.put("/user/change-password", { oldPassword, newPassword });
};
