import { Model } from "sequelize";

export default class products extends Model {
  static init(sequelize, DataTypes) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        category_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: {
            model: "categories",
            key: "id",
          },
        },
        sku: {
          type: DataTypes.STRING(100),
          allowNull: true,
          unique: "sku",
        },
        name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        slug: {
          type: DataTypes.STRING(255),
          allowNull: true,
          unique: "slug",
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        regular_price: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: true,
          defaultValue: 0.0,
        },
        discount_price: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: true,
          defaultValue: 0.0,
        },
        quantity: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0,
        },
        brand_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: {
            model: "brands",
            key: "id",
          },
        },
        status: {
          type: DataTypes.STRING(20),
          allowNull: true,
          defaultValue: "active",
        },
      },
      {
        sequelize,
        tableName: "products",
        hasTrigger: true,
        timestamps: false,
        indexes: [
          {
            name: "PRIMARY",
            unique: true,
            using: "BTREE",
            fields: [{ name: "id" }],
          },
          {
            name: "sku",
            unique: true,
            using: "BTREE",
            fields: [{ name: "sku" }],
          },
          {
            name: "slug",
            unique: true,
            using: "BTREE",
            fields: [{ name: "slug" }],
          },
          {
            name: "brand_id",
            using: "BTREE",
            fields: [{ name: "brand_id" }],
          },
          {
            name: "fk_product_category",
            using: "BTREE",
            fields: [{ name: "category_id" }],
          },
        ],
      },
    );
  }
}
