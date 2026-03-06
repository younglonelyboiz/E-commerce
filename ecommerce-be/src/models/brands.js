import { Model } from "sequelize";

export default class brands extends Model {
  static init(sequelize, DataTypes) {
    return super.init(
      {
        id: {
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
          allowNull: true,
          unique: "slug",
        },
      },
      {
        sequelize,
        tableName: "brands",
        timestamps: false,
        indexes: [
          {
            name: "PRIMARY",
            unique: true,
            using: "BTREE",
            fields: [{ name: "id" }],
          },
          {
            name: "slug",
            unique: true,
            using: "BTREE",
            fields: [{ name: "slug" }],
          },
        ],
      },
    );
  }
}
