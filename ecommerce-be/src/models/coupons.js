import { Model } from "sequelize";

export default class coupons extends Model {
  static init(sequelize, DataTypes) {
    return super.init(
      {
        id: {
          autoIncrement: true,
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
        },
        code: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: "code",
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        discount_type: {
          type: DataTypes.STRING(20),
          allowNull: false,
        },
        value: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
        },
        min_order_value: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: true,
          defaultValue: 0.0,
        },
        max_discount_amount: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: true,
        },
        usage_limit: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        used_count: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0,
        },
        active: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: 1,
        },
        multiple: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: 0,
        },
        start_date: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: sequelize.fn("current_timestamp"),
        },
        end_date: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: sequelize.fn("current_timestamp"),
        },
      },
      {
        sequelize,
        tableName: "coupons",
        timestamps: false,
        indexes: [
          {
            name: "PRIMARY",
            unique: true,
            using: "BTREE",
            fields: [{ name: "id" }],
          },
          {
            name: "code",
            unique: true,
            using: "BTREE",
            fields: [{ name: "code" }],
          },
        ],
      },
    );
  }
}
