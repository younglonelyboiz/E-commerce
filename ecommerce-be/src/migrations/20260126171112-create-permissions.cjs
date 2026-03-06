"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("permissions", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },

      code: { type: Sequelize.STRING, allowNull: false, unique: true },
      resource: { type: Sequelize.STRING, allowNull: false },
      action: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT },

      // Thay vì inserted_at, hãy đổi thành:
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("now"), // Tự động lấy giờ hiện tại
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("now"),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("permissions");
  },
};
