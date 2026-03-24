import { Model } from "sequelize";

export default class messages extends Model {
  static init(sequelize, DataTypes) {
    return super.init(
      {
        id: {
          autoIncrement: true,
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
        },
        conversation_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "conversations",
            key: "id",
          },
        },
        sender_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "users",
            key: "id",
          },
        },
        sender_type: {
          type: DataTypes.STRING(20),
          allowNull: false,
        },
        message_type: {
          type: DataTypes.STRING(20),
          allowNull: true,
          defaultValue: "TEXT",
        },
        content: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: "messages",
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
            name: "idx_messages_conversation_id_created_at",
            using: "BTREE",
            fields: [
              { name: "conversation_id" },
              { name: "created_at", order: "ASC" },
            ],
          },
        ],
      },
    );
  }
}
