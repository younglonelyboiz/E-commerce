"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Thêm Products
    await queryInterface.bulkInsert("products", [
      {
        sku: "PROD-001",
        name: "Nồi chiên Philips",
        slug: "noi-chien-philips",
        description: "Dung tích 4.1L",
        regular_price: 2500000,
        discount_price: 1990000,
        quantity: 50,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // Thêm Ảnh (Giả sử ID sản phẩm đầu tiên là 1)
    return queryInterface.bulkInsert("product_images", [
      {
        product_id: 1,
        url: "https://example.com/philips.jpg",
        is_thumbnail: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("product_images", null, {});
    await queryInterface.bulkDelete("products", null, {});
  },
};
