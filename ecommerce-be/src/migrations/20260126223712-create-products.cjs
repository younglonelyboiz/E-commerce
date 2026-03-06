// src/migrations/20260126223712-create-products.js
"use strict";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("products", {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    // Lưu ý: Đã bỏ sku, name, description cũ
    slug: {
      type: Sequelize.STRING(255),
      allowNull: false,
      unique: true,
    },
    brand_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    product_status_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    regular_price: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    discount_price: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    quantity: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    taxable: {
      type: Sequelize.BOOLEAN, // Đổi sang Boolean cho chuẩn Model
      allowNull: true,
      defaultValue: false,
    },
    // --- CÁC CỘT MỚI ---
    full_name: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },
    display_name: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },
    rating: {
      type: Sequelize.DECIMAL(2, 1),
      allowNull: true,
    },
    sold: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    gift: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },
    image_url: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    spec_1: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },
    spec_2: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },
    // Nếu bạn muốn dùng createdAt, updatedAt thì bỏ comment dòng dưới
    // createdAt: { allowNull: false, type: Sequelize.DATE },
    // updatedAt: { allowNull: false, type: Sequelize.DATE }
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable("products");
}
