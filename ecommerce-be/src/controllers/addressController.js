import {
  getUserAddressesService,
  addUserAddressService,
  updateUserAddressService,
  deleteUserAddressService,
} from "../services/addressService.js";

export const getUserAddresses = async (req, res) => {
  try {
    const userId = req.user.id; // Lấy từ middleware verify Token
    let data = await getUserAddressesService(userId);
    return res.status(200).json(data);
  } catch (error) {
    console.error(">>> Lỗi ở getUserAddresses:", error);
    return res.status(500).json({ EC: -1, EM: "Lỗi server", DT: "" });
  }
};

export const deleteUserAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.id;
    let data = await deleteUserAddressService(userId, addressId);
    return res.status(200).json(data);
  } catch (error) {
    console.error(">>> Lỗi ở deleteUserAddress:", error);
    return res.status(500).json({ EC: -1, EM: "Lỗi server", DT: "" });
  }
};

export const updateUserAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.id;
    let data = await updateUserAddressService(userId, addressId, req.body);
    return res.status(200).json(data);
  } catch (error) {
    console.error(">>> Lỗi ở updateUserAddress:", error);
    return res.status(500).json({ EC: -1, EM: "Lỗi server", DT: "" });
  }
};

export const addUserAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    let data = await addUserAddressService(userId, req.body);
    return res.status(200).json(data);
  } catch (error) {
    console.error(">>> Lỗi ở addUserAddress:", error);
    return res.status(500).json({ EC: -1, EM: "Lỗi server", DT: "" });
  }
};
