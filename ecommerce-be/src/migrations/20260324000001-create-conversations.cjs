"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Dọn dẹp bảng nếu bị kẹt từ lần chạy lỗi trước đó
    await queryInterface.dropTable("conversations").catch(() => {});

    await queryInterface.createTable("conversations", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      assignee_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: true,
        defaultValue: "OPEN",
      },
      last_message_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      last_message_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      last_sender_type: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      assigned_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      unread_count_user: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      unread_count_admin: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE },
      deleted_at: { allowNull: true, type: Sequelize.DATE },
    });

    // Tạo Indexes để tối ưu tốc độ truy vấn
    try {
      await queryInterface.addIndex("conversations", ["user_id"], {
        name: "idx_conversations_user_id",
      });
      await queryInterface.addIndex(
        "conversations",
        ["assignee_id", "last_message_at"],
        { name: "idx_conversations_assignee_last_message" },
      );
    } catch (error) {
      console.log("Indexes existed and safely skipped.");
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("conversations");
  },
};
