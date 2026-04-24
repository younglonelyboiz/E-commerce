import axios from "../setup/axios";

export const getAdminDashboardApi = () => {
  return axios.get("/admin/dashboard");
};
