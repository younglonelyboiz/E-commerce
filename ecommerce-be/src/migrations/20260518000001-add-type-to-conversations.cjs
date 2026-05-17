"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("conversations", "type", {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: "HUMAN",
      after: "status", // MariaDB: đặt sau cột status cho gọn
    });

    // Index để query nhanh theo type
    await queryInterface.addIndex("conversations", ["type"], {
      name: "idx_conversations_type",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex("conversations", "idx_conversations_type");
    await queryInterface.removeColumn("conversations", "type");
  },
};
