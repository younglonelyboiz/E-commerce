import axios from "../setUp/axios";

export const getAdminDashboardApi = () => {
  return axios.get("/admin/dashboard");
};
