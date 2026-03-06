import db from "../models/index.js";

const getCategories = async () => {
  try {
    const categories = await db.categories.findAll({
      attributes: ["id", "name", "slug", "icon"],
      order: [["id", "ASC"]],
    });
    return {
      EC: 0,
      EM: "Lấy danh sách danh mục thành công",
      DT: categories,
    };
  } catch (error) {
    console.error(">>> Check error:", error);
    return { EC: -1, EM: "Lỗi phía database", DT: [] };
  }
};
export default { getCategories };
