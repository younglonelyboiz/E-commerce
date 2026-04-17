import * as dashboardService from "../services/dashboardService.js";

export const getDashboardData = async (req, res) => {
  try {
    const result = await dashboardService.getDashboardDataService();
    return res.status(200).json(result);
  } catch (error) {
    console.error(">>> [Dashboard Controller Error]:", error);
    return res.status(500).json({
      EC: -1,
      EM: "Lỗi Server khi lấy dữ liệu Dashboard",
      DT: null,
    });
  }
};
