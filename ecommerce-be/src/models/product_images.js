import { Model } from "sequelize";

export default class product_images extends Model {
  static init(sequelize, DataTypes) {
    return super.init(
      {
        id: {
          autoIncrement: true,
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
        },
        product_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
          allowNull: false,
          references: {
            model: "products",
            key: "id",
          },
        },
        url: {
          type: DataTypes.STRING(500),
          allowNull: false,
        },
        is_thumbnail: {
          type: DataTypes.TINYINT,
          allowNull: true,
          defaultValue: 0,
        },
      },
      {
        sequelize,
        tableName: "product_images",
        timestamps: false,
        indexes: [
          {
            name: "PRIMARY",
            unique: true,
            using: "BTREE",
            fields: [{ name: "id" }],
          },
          {
            name: "product_id",
            using: "BTREE",
            fields: [{ name: "product_id" }],
          },
        ],
      },
    );
  }
}
