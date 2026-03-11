import express from "express";
import { checkUserJWT, checkAdminRole } from "../middlewares/JWTAction.js";

// Đảm bảo tên hàm ở đây khớp chính xác với 'export const ...' ở Controller
import {
  readProducts, // Thay cho getProductsWithFilter và getProductByID vì dùng chung logic ID
  createProduct,
  deleteProductbyID,
  updateProductbyID,
  getSaleList, // Tên hàm xử lý logic top-sale ở Controller
  getSalingList,
  readProductsForAdmin, // Tên hàm xử lý logic top-selling ở Controller
  getProductDetail, // Thêm mới: Lấy chi tiết sản phẩm theo ID
} from "../controllers/productController.js";

import { getAllBrands } from "../controllers/brandController.js";
import { getAllCategories } from "../controllers/categoriesController.js";
import {
  registerNewUser,
  handleLogin,
  getUserAccount,
  handleLogout,
} from "../controllers/userController.js";

const initApiRoutes = (app) => {
  const router = express.Router(); // --- Routes cho sản phẩm --- // Hàm readProducts xử lý cả lấy list (có filter) và lấy 1 sản phẩm theo ID

  router.get(
    "/admin/products",
    checkUserJWT,
    checkAdminRole,
    readProductsForAdmin,
  );
  router.post("/create-product", checkUserJWT, checkAdminRole, createProduct);
  router.delete(
    "/delete-product/:id",
    checkUserJWT,
    checkAdminRole,
    deleteProductbyID,
  );
  router.put(
    "/update-product/:id",
    checkUserJWT,
    checkAdminRole,
    updateProductbyID,
  ); // --- Routes cho trang chủ (Điện Máy Xanh style) ---

  router.get("/products", readProducts);
  router.get("/products/:id", getProductDetail);

  router.get("/top-sale", getSaleList);
  router.get("/top-selling", getSalingList); // --- Các routes khác ---

  router.get("/brands", getAllBrands);
  router.get("/categories", getAllCategories);

  // Route này yêu cầu phải có Cookie hợp lệ mới vào được
  router.get("/account", checkUserJWT, getUserAccount);
  router.post("/login", handleLogin);
  router.post("/register-user", registerNewUser); // Route kiểm tra JWT
  router.post("/logout", checkUserJWT, handleLogout);

  router.get("/user/profile", checkUserJWT, (req, res) => {
    return res.status(200).json({
      EC: 0,
      EM: "Lấy thông tin người dùng thành công!",
      DT: req.user,
    });
  });

  return app.use("/api/v1", router);
};

export default initApiRoutes;
