import { Model } from "sequelize";

export default class categories extends Model {
  static init(sequelize, DataTypes) {
    return super.init(
      {
        id: {
          autoIncrement: true,
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        slug: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        icon: {
          // THÊM DÒNG NÀY VÀO ĐÂY
          type: DataTypes.STRING(255),
          allowNull: true,
          defaultValue: "bi-box",
        },
      },
      {
        sequelize,
        tableName: "categories",
        timestamps: true,
        indexes: [
          {
            name: "PRIMARY",
            unique: true,
            using: "BTREE",
            fields: [{ name: "id" }],
          },
        ],
      },
    );
  }
}
