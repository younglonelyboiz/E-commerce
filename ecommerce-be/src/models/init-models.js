import { DataTypes } from "sequelize";
import _brands from "./brands.js";
import _cart_products from "./cart_products.js";
import _carts from "./carts.js";
import _categories from "./categories.js";
import _cc_transactions from "./cc_transactions.js";
import _coupons from "./coupons.js";
import _order_products from "./order_products.js";
import _order_statuses from "./order_statuses.js";
import _orders from "./orders.js";
import _permissions from "./permissions.js";
import _product_images from "./product_images.js";
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
  const cc_transactions = _cc_transactions.init(sequelize, DataTypes);
  const coupons = _coupons.init(sequelize, DataTypes);
  const order_products = _order_products.init(sequelize, DataTypes);
  const order_statuses = _order_statuses.init(sequelize, DataTypes);
  const orders = _orders.init(sequelize, DataTypes);
  const permissions = _permissions.init(sequelize, DataTypes);
  const product_images = _product_images.init(sequelize, DataTypes);
  const products = _products.init(sequelize, DataTypes);
  const reviews = _reviews.init(sequelize, DataTypes);
  const role_permissions = _role_permissions.init(sequelize, DataTypes);
  const roles = _roles.init(sequelize, DataTypes);
  const sequelizemeta = _sequelizemeta.init(sequelize, DataTypes);
  const user_addresses = _user_addresses.init(sequelize, DataTypes);
  const user_roles = _user_roles.init(sequelize, DataTypes);
  const users = _users.init(sequelize, DataTypes);

  // THIẾT LẬP QUAN HỆ (ASSOCIATIONS)
  roles.belongsToMany(users, {
    as: "user_id_users",
    through: user_roles,
    foreignKey: "role_id",
    otherKey: "user_id",
  });
  users.belongsToMany(roles, {
    as: "role_id_roles",
    through: user_roles,
    foreignKey: "user_id",
    otherKey: "role_id",
  });
  products.belongsTo(brands, { as: "brand", foreignKey: "brand_id" });
  brands.hasMany(products, { as: "products", foreignKey: "brand_id" });
  cart_products.belongsTo(carts, { as: "cart", foreignKey: "cart_id" });
  carts.hasMany(cart_products, { as: "cart_products", foreignKey: "cart_id" });
  products.belongsTo(categories, { as: "category", foreignKey: "category_id" });
  categories.hasMany(products, { as: "products", foreignKey: "category_id" });
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
  reviews.belongsTo(orders, { as: "order", foreignKey: "order_id" });
  orders.hasMany(reviews, { as: "reviews", foreignKey: "order_id" });
  order_products.belongsTo(products, {
    as: "product",
    foreignKey: "product_id",
  });
  products.hasMany(order_products, {
    as: "order_products",
    foreignKey: "product_id",
  });
  product_images.belongsTo(products, {
    as: "product",
    foreignKey: "product_id",
  });
  products.hasMany(product_images, {
    as: "product_images",
    foreignKey: "product_id",
  });
  reviews.belongsTo(products, { as: "product", foreignKey: "product_id" });
  products.hasMany(reviews, { as: "reviews", foreignKey: "product_id" });
  roles.belongsTo(role_permissions, {
    as: "id_role_permission",
    foreignKey: "id",
  });
  role_permissions.hasOne(roles, { as: "role", foreignKey: "id" });
  user_roles.belongsTo(roles, { as: "role", foreignKey: "role_id" });
  roles.hasMany(user_roles, { as: "user_roles", foreignKey: "role_id" });
  orders.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(orders, { as: "orders", foreignKey: "user_id" });
  reviews.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(reviews, { as: "reviews", foreignKey: "user_id" });
  user_addresses.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(user_addresses, {
    as: "user_addresses",
    foreignKey: "user_id",
  });
  user_roles.belongsTo(users, { as: "user", foreignKey: "user_id" });
  users.hasMany(user_roles, { as: "user_roles", foreignKey: "user_id" });

  return {
    brands,
    cart_products,
    carts,
    categories,
    cc_transactions,
    coupons,
    order_products,
    order_statuses,
    orders,
    permissions,
    product_images,
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
