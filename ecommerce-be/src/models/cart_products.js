import { Model } from "sequelize";

export default class cart_products extends Model {
  static init(sequelize, DataTypes) {
    return super.init(
      {
        cart_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          references: {
            model: "carts",
            key: "id",
          },
        },
        product_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
        },
        quantity: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1,
        },
      },
      {
        sequelize,
        tableName: "cart_products",
        timestamps: false,
        indexes: [
          {
            name: "PRIMARY",
            unique: true,
            using: "BTREE",
            fields: [{ name: "cart_id" }, { name: "product_id" }],
          },
        ],
      },
    );
  }
}
