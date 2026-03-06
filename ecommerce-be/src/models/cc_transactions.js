import Sequelize, { Model } from "sequelize";
export default class cc_transactions extends Model {
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
          type: DataTypes.STRING(255),
          allowNull: true,
          unique: "code",
        },
        order_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "orders",
            key: "id",
          },
        },
        transdate: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: sequelize.fn("current_timestamp"),
        },
        processor: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        processor_trans_id: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        amount: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
        },
        status: {
          type: DataTypes.STRING(20),
          allowNull: false,
        },
        card_last4: {
          type: DataTypes.STRING(4),
          allowNull: true,
        },
        card_brand: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        payment_token: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        response_json: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: "cc_transactions",
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
          {
            name: "order_id",
            using: "BTREE",
            fields: [{ name: "order_id" }],
          },
        ],
      },
    );
  }
}
