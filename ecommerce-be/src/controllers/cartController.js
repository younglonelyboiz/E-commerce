import { addProductToCart, getCartByUserId } from "../services/cartService.js";

const addToCart = async (req, res) => {
  try {
    // Đảm bảo lấy đúng ID từ Token (tuỳ thuộc bạn encode là id hay userId)
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      return res.status(200).json({
        EC: -1,
        EM: "Lỗi Token: Không tìm thấy ID người dùng!",
        DT: "",
      });
    }
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
      return res.status(200).json({
        EC: 1,
        EM: "Thiếu thông tin sản phẩm hoặc số lượng!",
        DT: "",
      });
    }

    let response = await addProductToCart(userId, productId, quantity);
    return res.status(200).json(response);
  } catch (error) {
    console.error(">>> Lỗi ở cartController:", error);
    return res.status(500).json({
      EC: -1,
      EM: "Lỗi server (Controller)",
      DT: "",
    });
  }
};

const getCart = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      return res.status(200).json({
        EC: -1,
        EM: "Lỗi Token: Không tìm thấy ID người dùng!",
        DT: [],
      });
    }

    let response = await getCartByUserId(userId);
    return res.status(200).json(response);
  } catch (error) {
    console.error(">>> Lỗi ở cartController (getCart):", error);
    return res.status(500).json({
      EC: -1,
      EM: "Lỗi server (Controller)",
      DT: "",
    });
  }
};

export { addToCart, getCart };
