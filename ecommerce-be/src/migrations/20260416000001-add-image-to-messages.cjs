"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("messages", "image_url", {
      type: Sequelize.STRING(500),
      allowNull: true,
    });

    await queryInterface.addColumn("messages", "public_id", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("messages", "image_url");
    await queryInterface.removeColumn("messages", "public_id");
  },
};
