import axios from "../setUp/axios";

export const registerNewUser = async (userData) => {
  return axios.post("/register-user", {
    email: userData.email,
    password: userData.password,
    confirmPassword: userData.confirmPassword,
    user_name: userData.user_name,
  });
};
