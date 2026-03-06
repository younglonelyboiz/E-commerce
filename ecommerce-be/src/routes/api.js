import express from "express";
import { checkUserJWT } from "../middlewares/JWTAction.js";

// Đảm bảo tên hàm ở đây khớp chính xác với 'export const ...' ở Controller
import {
  readProducts, // Thay cho getProductsWithFilter và getProductByID vì dùng chung logic ID
  createProduct,
  deleteProductbyID,
  updateProductbyID,
  getSaleList, // Tên hàm xử lý logic top-sale ở Controller
  getSalingList,
  readProductsForAdmin, // Tên hàm xử lý logic top-selling ở Controller
} from "../controllers/productController.js";

import { getAllBrands } from "../controllers/brandController.js";
import { getAllCategories } from "../controllers/categoriesController.js";
import { registerNewUser } from "../controllers/userController.js";

const initApiRoutes = (app) => {
  const router = express.Router(); // --- Routes cho sản phẩm --- // Hàm readProducts xử lý cả lấy list (có filter) và lấy 1 sản phẩm theo ID

  router.get("/admin/products", readProductsForAdmin);

  router.get("/products", readProducts);
  router.get("/products/:id", readProducts);
  router.post("/create-product", createProduct);
  router.delete("/delete-product/:id", deleteProductbyID);
  router.put("/update-product/:id", updateProductbyID); // --- Routes cho trang chủ (Điện Máy Xanh style) ---

  router.get("/top-sale", getSaleList);
  router.get("/top-selling", getSalingList); // --- Các routes khác ---

  router.get("/brands", getAllBrands);
  router.get("/categories", getAllCategories);
  router.post("/register-user", registerNewUser); // Route kiểm tra JWT

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
