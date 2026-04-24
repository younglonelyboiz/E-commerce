import axios from "../setup/axios";

export const readAllRoles = () => {
  return axios.get("/role/read");
};

export const updateRole = (data) => {
  return axios.put("/user/update-role", data);
};
