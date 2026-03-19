import db from "../models/index.js";

export const getUserAddressesService = async (userId) => {
  try {
    const addresses = await db.user_addresses.findAll({
      where: { user_id: userId },
      order: [
        ["is_default", "DESC"],
        ["id", "DESC"],
      ], // Ưu tiên địa chỉ mặc định lên đầu
    });
    return {
      EC: 0,
      EM: "Lấy danh sách địa chỉ thành công",
      DT: addresses,
    };
  } catch (error) {
    console.error(">>> Lỗi getUserAddressesService:", error);
    return { EC: -1, EM: "Lỗi hệ thống", DT: [] };
  }
};

export const addUserAddressService = async (userId, data) => {
  try {
    // 1. Kiểm tra xem user đã có địa chỉ nào chưa
    const addressCount = await db.user_addresses.count({
      where: { user_id: userId },
    });

    // Nếu là địa chỉ đầu tiên, tự động set làm mặc định
    const isDefault =
      addressCount === 0 ||
      data.is_default === true ||
      data.is_default === "true";

    // 2. Nếu user chọn làm mặc định, phải gỡ mặc định của các địa chỉ cũ đi
    if (isDefault && addressCount > 0) {
      await db.user_addresses.update(
        { is_default: false },
        { where: { user_id: userId } },
      );
    }

    // 3. Tạo mới
    const newAddress = await db.user_addresses.create({
      user_id: userId,
      receiver_name: data.receiver_name,
      phone: data.phone,
      specific_address: data.specific_address,
      ward: data.ward,
      district: data.district,
      province: data.province,
      is_default: isDefault,
    });

    return {
      EC: 0,
      EM: "Thêm địa chỉ thành công",
      DT: newAddress,
    };
  } catch (error) {
    console.error(">>> Lỗi addUserAddressService:", error);
    return { EC: -1, EM: "Lỗi hệ thống", DT: "" };
  }
};

export const updateUserAddressService = async (userId, addressId, data) => {
  try {
    const address = await db.user_addresses.findOne({
      where: { id: addressId, user_id: userId },
    });

    if (!address) {
      return { EC: 1, EM: "Địa chỉ không tồn tại", DT: "" };
    }

    const isDefault =
      data.is_default === true ||
      data.is_default === "true" ||
      data.is_default === 1;

    if (isDefault) {
      await db.user_addresses.update(
        { is_default: false },
        { where: { user_id: userId } },
      );
    }

    await db.user_addresses.update(
      {
        ...data,
        is_default: isDefault,
      },
      { where: { id: addressId, user_id: userId } },
    );

    return { EC: 0, EM: "Cập nhật địa chỉ thành công", DT: "" };
  } catch (error) {
    console.error(">>> Lỗi updateUserAddressService:", error);
    return { EC: -1, EM: "Lỗi hệ thống", DT: "" };
  }
};

export const deleteUserAddressService = async (userId, addressId) => {
  try {
    const address = await db.user_addresses.findOne({
      where: { id: addressId, user_id: userId },
    });

    if (!address) {
      return {
        EC: 1,
        EM: "Địa chỉ không tồn tại hoặc không có quyền xóa",
        DT: "",
      };
    }

    await db.user_addresses.destroy({
      where: { id: addressId, user_id: userId },
    });

    return { EC: 0, EM: "Xóa địa chỉ thành công", DT: "" };
  } catch (error) {
    console.error(">>> Lỗi deleteUserAddressService:", error);
    return { EC: -1, EM: "Lỗi hệ thống", DT: "" };
  }
};
