import db from "../models/index.js";

const addProductToCart = async (userId, productId, quantity) => {
  try {
    // 1. Tìm hoặc tạo giỏ hàng cho user
    let [cart, created] = await db.carts.findOrCreate({
      where: { user_id: userId },
      defaults: { user_id: userId },
    });

    const cartId = cart.id;

    // 2. Kiểm tra xem sản phẩm đã có trong giỏ hàng của user chưa
    let cartProduct = await db.cart_products.findOne({
      where: {
        cart_id: cartId,
        product_id: productId,
      },
    });

    if (cartProduct) {
      // Nếu đã có, cộng dồn số lượng
      await cartProduct.update({
        quantity: cartProduct.quantity + quantity,
      });
    } else {
      // Nếu chưa có, thêm mới vào giỏ
      await db.cart_products.create({
        cart_id: cartId,
        product_id: productId,
        quantity: quantity,
      });
    }

    return {
      EC: 0,
      EM: "Thêm sản phẩm vào giỏ hàng thành công!",
      DT: "",
    };
  } catch (error) {
    console.error(">>> Lỗi ở cartService:", error);
    return {
      EC: -1,
      EM: `Lỗi hệ thống: ${error.message}`,
      DT: "",
    };
  }
};

const getCartByUserId = async (userId) => {
  try {
    // 1. Tìm giỏ hàng của User
    let cart = await db.carts.findOne({
      where: { user_id: userId },
    });

    if (!cart) {
      return { EC: 0, EM: "Giỏ hàng trống", DT: [] };
    }

    // 2. Lấy danh sách sản phẩm trong giỏ kèm thông tin Product
    let cartProducts = await db.cart_products.findAll({
      where: { cart_id: cart.id },
      include: [
        {
          model: db.products,
          as: "product",
          attributes: ["id", "name", "slug", "discount_price", "regular_price"],
          include: [
            {
              model: db.product_images,
              as: "product_images",
              where: { is_thumbnail: 1 },
              required: false,
              attributes: ["url"],
            },
          ],
        },
      ],
    });

    return { EC: 0, EM: "Lấy giỏ hàng thành công", DT: cartProducts };
  } catch (error) {
    console.error(">>> Lỗi ở cartService (getCart):", error);
    return { EC: -1, EM: `Lỗi hệ thống: ${error.message}`, DT: [] };
  }
};

const removeProductFromCart = async (userId, productId) => {
  try {
    // Tìm giỏ hàng của user
    let cart = await db.carts.findOne({
      where: { user_id: userId },
    });

    if (!cart) {
      return { EC: 1, EM: "Giỏ hàng không tồn tại", DT: "" };
    }

    // Xóa sản phẩm khỏi giỏ hàng
    const deletedRow = await db.cart_products.destroy({
      where: {
        cart_id: cart.id,
        product_id: productId,
      },
    });

    if (deletedRow) {
      return { EC: 0, EM: "Xóa sản phẩm khỏi giỏ hàng thành công", DT: "" };
    }
    return { EC: 1, EM: "Không tìm thấy sản phẩm trong giỏ hàng", DT: "" };
  } catch (error) {
    console.error(">>> Lỗi ở cartService (removeProduct):", error);
    return { EC: -1, EM: `Lỗi hệ thống: ${error.message}`, DT: "" };
  }
};

export { addProductToCart, getCartByUserId, removeProductFromCart };
