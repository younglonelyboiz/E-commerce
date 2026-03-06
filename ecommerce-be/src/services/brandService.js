import db from "../models/index.js";

const getBrands = async () => {
  try {
    // Sửa db.Brand thành db.brands (viết thường theo init-models.js)
    const brands = await db.brands.findAll({
      attributes: ["id", "name"],
      order: [["id", "ASC"]],
    });

    return {
      EC: 0,
      EM: "Lấy danh sách thương hiệu thành công",
      DT: brands,
    };
  } catch (error) {
    console.error(">>> Check error:", error);
    return { EC: -1, EM: "Lỗi phía database", DT: [] };
  }
};

export default { getBrands };
