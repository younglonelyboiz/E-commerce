import express from "express";
import { checkUserJWT, checkAdminRole } from "../middlewares/JWTAction.js";
import handleImageUpload from "../middlewares/uploadMiddleware.js";
import uploadCloud from "../config/cloudinary.config.js";
import aiChatRoutes from "./aiChatRoutes.js";

import {
  readProducts,
  createProduct,
  deleteProductbyID,
  updateProductbyID,
  getSaleList,
  getSalingList,
  getSuggestions,
  readProductsForAdmin,
  getProductDetail,
} from "../controllers/productController.js";

import { getAllBrands } from "../controllers/brandController.js";
import { getAllCategories } from "../controllers/categoriesController.js";

import {
  registerNewUser,
  handleLogin,
  getUserAccount,
  handleLogout,
  readUsersAdmin,
  readUserDetail,
  changePassword,
  getGoogleAuthUrl,
  handleGoogleCallback,
  handleQuickLogin,
} from "../controllers/userController.js";

import { readAllRoles, updateRole } from "../controllers/roleController.js";

import {
  addToCart,
  getCart,
  removeCartItem,
} from "../controllers/cartController.js";

import {
  getUserAddresses,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
} from "../controllers/addressController.js";

import {
  createOrder,
  readAllOrders,
  readOrderDetail,
  changeOrderStatus,
  readOrdersByUser,
  cancelOrderByUser,
} from "../controllers/orderController.js";

import {
  createPaymentLink,
  handlePayosWebhook,
  retryPaymentLink,
} from "../controllers/paymentController.js";

import {
  createReview,
  getReviews,
  getAllReviewsAdmin,
  replyReview,
} from "../controllers/reviewController.js";

import {
  getUnreadCount,
  getConversations,
  getMessages,
  getUserMessages,
  uploadChatImage,
} from "../controllers/chatController.js";

import { getDashboardData } from "../controllers/dashboardController.js";

const initApiRoutes = (app) => {
  const router = express.Router();

  // --- AI Chat (module riêng, mount trước) ---
  app.use("/api/v1/ai-chat", aiChatRoutes);

  // --- Products ---
  router.get("/admin/products", checkUserJWT, checkAdminRole, readProductsForAdmin);
  router.post("/create-product", checkUserJWT, checkAdminRole, handleImageUpload, createProduct);
  router.delete("/delete-product/:id", checkUserJWT, checkAdminRole, deleteProductbyID);
  router.put("/update-product/:id", checkUserJWT, checkAdminRole, handleImageUpload, updateProductbyID);
  router.get("/products", readProducts);
  router.get("/products/suggestions", getSuggestions);
  router.get("/products/:id", getProductDetail);
  router.get("/top-sale", getSaleList);
  router.get("/top-selling", getSalingList);
  router.get("/brands", getAllBrands);
  router.get("/categories", getAllCategories);

  // --- Users ---
  router.post("/register-user", registerNewUser);
  router.post("/login", handleLogin);
  router.post("/logout", handleLogout);
  router.post("/quick-login", handleQuickLogin);
  router.get("/account", checkUserJWT, getUserAccount);
  router.put("/user/change-password", checkUserJWT, changePassword);
  router.get("/user/profile", checkUserJWT, (req, res) => {
    return res.status(200).json({ EC: 0, EM: "Lấy thông tin người dùng thành công!", DT: req.user });
  });
  router.get("/admin/users", checkUserJWT, checkAdminRole, readUsersAdmin);
  router.get("/admin/users/:id", checkUserJWT, checkAdminRole, readUserDetail);

  // --- Roles ---
  router.get("/role/read", checkUserJWT, checkAdminRole, readAllRoles);
  router.put("/user/update-role", checkUserJWT, checkAdminRole, updateRole);

  // --- Cart ---
  router.post("/cart/add", checkUserJWT, addToCart);
  router.get("/cart", checkUserJWT, getCart);
  router.delete("/cart/remove/:productId", checkUserJWT, removeCartItem);

  // --- Addresses ---
  router.get("/user/addresses", checkUserJWT, getUserAddresses);
  router.post("/user/addresses", checkUserJWT, addUserAddress);
  router.put("/user/addresses/:id", checkUserJWT, updateUserAddress);
  router.delete("/user/addresses/:id", checkUserJWT, deleteUserAddress);

  // --- Orders ---
  router.post("/order/create", checkUserJWT, createOrder);
  router.get("/user/orders", checkUserJWT, readOrdersByUser);
  router.put("/user/orders/:id/cancel", checkUserJWT, cancelOrderByUser);
  router.get("/admin/orders", checkUserJWT, checkAdminRole, readAllOrders);
  router.get("/admin/orders/:id", checkUserJWT, checkAdminRole, readOrderDetail);
  router.put("/admin/orders/:id/status", checkUserJWT, checkAdminRole, changeOrderStatus);

  // --- Payment ---
  router.post("/payment/webhook", handlePayosWebhook);
  router.post("/payment/create-link", checkUserJWT, createPaymentLink);
  router.post("/payment/retry", checkUserJWT, retryPaymentLink);

  // --- Auth Google ---
  router.get("/auth/google/url", getGoogleAuthUrl);
  router.get("/auth/google/callback", handleGoogleCallback);

  // --- Reviews ---
  router.post("/review/create", checkUserJWT, createReview);
  router.get("/review/list/:productId", getReviews);
  router.get("/admin/reviews", checkUserJWT, checkAdminRole, getAllReviewsAdmin);
  router.put("/admin/reviews/:id/reply", checkUserJWT, checkAdminRole, replyReview);

  // --- Chat (User ↔ Admin) ---
  router.get("/chat/unread-count", checkUserJWT, getUnreadCount);
  router.get("/chat/user-messages", checkUserJWT, getUserMessages);
  router.get("/chat/conversations", checkUserJWT, checkAdminRole, getConversations);
  router.get("/chat/conversations/:id/messages", checkUserJWT, checkAdminRole, getMessages);
  router.post("/chat/upload-image", checkUserJWT, uploadCloud.single("image"), uploadChatImage);

  // --- Dashboard ---
  router.get("/admin/dashboard", checkUserJWT, checkAdminRole, getDashboardData);

  return app.use("/api/v1", router);
};

export default initApiRoutes;
