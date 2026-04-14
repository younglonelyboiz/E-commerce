"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Dọn dẹp bảng nếu bị kẹt từ lần chạy lỗi trước đó
    await queryInterface.dropTable("messages").catch(() => {});

    await queryInterface.createTable("messages", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      conversation_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "conversations", // Tham chiếu về bảng conversations vừa tạo
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      sender_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      sender_type: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      message_type: {
        type: Sequelize.STRING(20),
        allowNull: true,
        defaultValue: "TEXT",
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE },
      deleted_at: { allowNull: true, type: Sequelize.DATE },
    });

    try {
      await queryInterface.addIndex(
        "messages",
        ["conversation_id", "created_at"],
        { name: "idx_messages_conversation_id_created_at" },
      );
    } catch (error) {
      console.log("Index existed and safely skipped.");
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("messages");
  },
};
