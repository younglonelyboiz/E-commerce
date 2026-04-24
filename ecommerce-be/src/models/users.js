import { Model } from "sequelize";

export default class users extends Model {
  static init(sequelize, DataTypes) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
          defaultValue: null,
        },
        email: {
          type: DataTypes.STRING(255),
          allowNull: true,
          unique: "email",
        },
        user_name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        password_hash: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        active: {
          type: DataTypes.TINYINT,
          allowNull: true,
          defaultValue: 1,
        },
      },
      {
        sequelize,
        tableName: "users",
        timestamps: false,
        indexes: [
          {
            name: "PRIMARY",
            unique: true,
            using: "BTREE",
            fields: [{ name: "id" }],
          },
          {
            name: "email",
            unique: true,
            using: "BTREE",
            fields: [{ name: "email" }],
          },
        ],
      },
    );
  }
}
