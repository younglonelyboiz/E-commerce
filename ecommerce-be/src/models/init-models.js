import { DataTypes } from "sequelize";
import _brands from "./brands.js";
import _cart_products from "./cart_products.js";
import _carts from "./carts.js";
import _categories from "./categories.js";
import _conversations from "./conversations.js";
import _cc_transactions from "./cc_transactions.js";
import _coupons from "./coupons.js";
import _order_products from "./order_products.js";
import _order_statuses from "./order_statuses.js";
import _orders from "./orders.js";
import _permissions from "./permissions.js";
import _product_images from "./product_images.js";
import _messages from "./messages.js";
import _products from "./products.js";
import _reviews from "./reviews.js";
import _role_permissions from "./role_permissions.js";
import _roles from "./roles.js";
import _sequelizemeta from "./sequelizemeta.js";
import _user_addresses from "./user_addresses.js";
import _user_roles from "./user_roles.js";
import _users from "./users.js";

export default function initModels(sequelize) {
  // KHỞI TẠO MODEL DÙNG .init()
  const brands = _brands.init(sequelize, DataTypes);
  const cart_products = _cart_products.init(sequelize, DataTypes);
  const carts = _carts.init(sequelize, DataTypes);
  const categories = _categories.init(sequelize, DataTypes);
  const conversations = _conversations.init(sequelize, DataTypes);
  const cc_transactions = _cc_transactions.init(sequelize, DataTypes);
  const coupons = _coupons.init(sequelize, DataTypes);
  const order_products = _order_products.init(sequelize, DataTypes);
  const order_statuses = _order_statuses.init(sequelize, DataTypes);
  const orders = _orders.init(sequelize, DataTypes);
  const permissions = _permissions.init(sequelize, DataTypes);
  const product_images = _product_images.init(sequelize, DataTypes);
  const messages = _messages.init(sequelize, DataTypes);
  const products = _products.init(sequelize, DataTypes);
  const reviews = _reviews.init(sequelize, DataTypes);
  const role_permissions = _role_permissions.init(sequelize, DataTypes);
  const roles = _roles.init(sequelize, DataTypes);
  const sequelizemeta = _sequelizemeta.init(sequelize, DataTypes);
  const user_addresses = _user_addresses.init(sequelize, DataTypes);
  const user_roles = _user_roles.init(sequelize, DataTypes);
  const users = _users.init(sequelize, DataTypes);

  // --- THIẾT LẬP QUAN HỆ (ASSOCIATIONS) ---

  // 1. PHÂN QUYỀN: USERS <-> ROLES (Many-to-Many)
  users.belongsToMany(roles, {
    as: "roles",
    through: user_roles,
    foreignKey: "user_id",
    otherKey: "role_id",
  });
  roles.belongsToMany(users, {
    as: "users",
    through: user_roles,
    foreignKey: "role_id",
    otherKey: "user_id",
  });

  // 2. PHÂN QUYỀN: ROLES <-> PERMISSIONS (Many-to-Many)
  // Sửa lỗi: Xóa bỏ belongsTo ngược gây lỗi FK #1452
  roles.belongsToMany(permissions, {
    as: "permissions",
    through: role_permissions,
    foreignKey: "role_id",
    otherKey: "permission_id",
  });
  permissions.belongsToMany(roles, {
    as: "roles",
    through: role_permissions,
    foreignKey: "permission_id",
    otherKey: "role_id",
  });

  // 3. QUAN HỆ BẢNG TRUNG GIAN (Để query chi tiết nếu cần)
  user_roles.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(user_roles, { as: "user_roles", foreignKey: "user_id" });
  user_roles.belongsTo(roles, { as: "role", foreignKey: "role_id" });
  roles.hasMany(user_roles, { as: "user_roles", foreignKey: "role_id" });

  role_permissions.belongsTo(roles, { as: "role", foreignKey: "role_id" });
  roles.hasMany(role_permissions, {
    as: "role_permissions",
    foreignKey: "role_id",
  });
  role_permissions.belongsTo(permissions, {
    as: "permission",
    foreignKey: "permission_id",
  });
  permissions.hasMany(role_permissions, {
    as: "role_permissions",
    foreignKey: "permission_id",
  });

  // 4. SẢN PHẨM & THƯƠNG HIỆU & DANH MỤC
  products.belongsTo(brands, { as: "brand", foreignKey: "brand_id" });
  brands.hasMany(products, { as: "products", foreignKey: "brand_id" });
  products.belongsTo(categories, { as: "category", foreignKey: "category_id" });
  categories.hasMany(products, { as: "products", foreignKey: "category_id" });

  product_images.belongsTo(products, {
    as: "product",
    foreignKey: "product_id",
  });
  products.hasMany(product_images, {
    as: "product_images",
    foreignKey: "product_id",
  });

  // 5. GIỎ HÀNG
  cart_products.belongsTo(carts, { as: "cart", foreignKey: "cart_id" });
  carts.hasMany(cart_products, { as: "cart_products", foreignKey: "cart_id" });

  carts.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasOne(carts, { as: "cart", foreignKey: "user_id" });

  cart_products.belongsTo(products, {
    as: "product",
    foreignKey: "product_id",
  });
  products.hasMany(cart_products, {
    as: "cart_products",
    foreignKey: "product_id",
  });

  // 6. ĐƠN HÀNG & GIAO DỊCH
  cc_transactions.belongsTo(orders, { as: "order", foreignKey: "order_id" });
  orders.hasMany(cc_transactions, {
    as: "cc_transactions",
    foreignKey: "order_id",
  });

  order_products.belongsTo(orders, { as: "order", foreignKey: "order_id" });
  orders.hasMany(order_products, {
    as: "order_products",
    foreignKey: "order_id",
  });

  order_products.belongsTo(products, {
    as: "product",
    foreignKey: "product_id",
  });
  products.hasMany(order_products, {
    as: "order_products",
    foreignKey: "product_id",
  });

  orders.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(orders, { as: "orders", foreignKey: "user_id" });

  // 7. ĐÁNH GIÁ & ĐỊA CHỈ
  reviews.belongsTo(orders, { as: "order", foreignKey: "order_id" });
  orders.hasMany(reviews, { as: "reviews", foreignKey: "order_id" });

  reviews.belongsTo(products, { as: "product", foreignKey: "product_id" });
  products.hasMany(reviews, { as: "reviews", foreignKey: "product_id" });

  reviews.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(reviews, { as: "reviews", foreignKey: "user_id" });

  user_addresses.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(user_addresses, {
    as: "user_addresses",
    foreignKey: "user_id",
  });

  // 8. CHAT (CONVERSATIONS & MESSAGES)
  conversations.belongsTo(users, { as: "customer", foreignKey: "user_id" });
  users.hasMany(conversations, {
    as: "customer_conversations",
    foreignKey: "user_id",
  });

  conversations.belongsTo(users, { as: "assignee", foreignKey: "assignee_id" });
  users.hasMany(conversations, {
    as: "assigned_conversations",
    foreignKey: "assignee_id",
  });

  messages.belongsTo(conversations, {
    as: "conversation",
    foreignKey: "conversation_id",
  });
  conversations.hasMany(messages, {
    as: "messages",
    foreignKey: "conversation_id",
  });

  messages.belongsTo(users, { as: "sender", foreignKey: "sender_id" });
  users.hasMany(messages, { as: "messages", foreignKey: "sender_id" });

  // Móc nối messages làm last_message vào bảng conversations nếu cần query kèm last message chi tiết
  conversations.belongsTo(messages, {
    as: "last_message",
    foreignKey: "last_message_id",
  });

  return {
    brands,
    cart_products,
    carts,
    categories,
    conversations,
    cc_transactions,
    coupons,
    order_products,
    order_statuses,
    orders,
    permissions,
    product_images,
    messages,
    products,
    reviews,
    role_permissions,
    roles,
    sequelizemeta,
    user_addresses,
    user_roles,
    users,
  };
}
