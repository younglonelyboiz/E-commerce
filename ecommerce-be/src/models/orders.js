import { Model, DataTypes } from "sequelize";

export default class orders extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          autoIncrement: true,
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
        },
        code: { type: DataTypes.STRING(50), allowNull: false },
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        grand_total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        order_date: { type: DataTypes.DATE, allowNull: false },
        payment_method: { type: DataTypes.STRING(50), allowNull: true },
        payment_status: { type: DataTypes.STRING(50), allowNull: true },
        order_status: { type: DataTypes.STRING(50), allowNull: true },
        shipping_address_snapshot: { type: DataTypes.TEXT, allowNull: true },
        shipping_name: { type: DataTypes.STRING(255), allowNull: true },
        shipping_phone: { type: DataTypes.STRING(50), allowNull: true },
        customer_note: { type: DataTypes.TEXT, allowNull: true },
        admin_note: { type: DataTypes.TEXT, allowNull: true },
        shipping_tracking_code: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        cancel_reason: { type: DataTypes.TEXT, allowNull: true },
      },
      {
        sequelize,
        tableName: "orders",
        timestamps: false,
      },
    );
  }
}
