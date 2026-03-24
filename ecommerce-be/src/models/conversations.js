import { Model } from "sequelize";

export default class conversations extends Model {
  static init(sequelize, DataTypes) {
    return super.init(
      {
        id: {
          autoIncrement: true,
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "users",
            key: "id",
          },
        },
        assignee_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: {
            model: "users",
            key: "id",
          },
        },
        status: {
          type: DataTypes.STRING(20),
          allowNull: true,
          defaultValue: "OPEN",
        },
        last_message_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        last_message_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        last_sender_type: {
          type: DataTypes.STRING(20),
          allowNull: true,
        },
        assigned_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        unread_count_user: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0,
        },
        unread_count_admin: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0,
        },
      },
      {
        sequelize,
        tableName: "conversations",
        timestamps: true,
        paranoid: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
        indexes: [
          {
            name: "PRIMARY",
            unique: true,
            using: "BTREE",
            fields: [{ name: "id" }],
          },
          {
            name: "idx_conversations_user_id",
            using: "BTREE",
            fields: [{ name: "user_id" }],
          },
          {
            name: "idx_conversations_assignee_last_message",
            using: "BTREE",
            fields: [
              { name: "assignee_id" },
              { name: "last_message_at", order: "DESC" },
            ],
          },
        ],
      },
    );
  }
}
