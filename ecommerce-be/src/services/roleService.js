import db from "../models/index.js";

// 1. Lấy danh sách tất cả các Role có trong DB
export const getAllRolesService = async () => {
  try {
    let data = await db.roles.findAll({
      attributes: ["id", "name", "description"],
    });
    return {
      EM: "Lấy danh sách roles thành công",
      EC: 0,
      DT: data,
    };
  } catch (e) {
    console.log(e);
    return { EM: "Lỗi server", EC: -1, DT: [] };
  }
};

// 2. Cập nhật Role cho User (Xóa cũ thêm mới)
export const updateUserRoleService = async (userId, roleIds) => {
  try {
    let user = await db.users.findOne({ where: { id: userId } });
    if (!user) {
      return { EM: "User không tồn tại", EC: 1, DT: "" };
    }
    const cleanRoleIds = Array.isArray(roleIds)
      ? roleIds.map((id) => parseInt(id)).filter((id) => !isNaN(id))
      : [];

    // Dùng hàm đặc biệt của Sequelize cho quan hệ Many-to-Many
    // Nó sẽ tự động xóa các bản ghi cũ trong bảng trung gian và thêm mới
    await user.setRoles(cleanRoleIds);

    return {
      EM: "Cập nhật vai trò thành công",
      EC: 0,
      DT: "",
    };
  } catch (e) {
    console.log(e);
    return { EM: "Lỗi server", EC: -1, DT: "" };
  }
};
