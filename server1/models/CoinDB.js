const Sequelize = require("sequelize");

module.exports = class CoinDB extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        BCNUM: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          allowNull: false,
          autoIncrement: true,
        },
        Coin: {
          type: Sequelize.INTEGER(100),
          allowNull: false,
        },
      },
      {
        sequelize,
        timestamps: false,
        underscored: false,
        modelName: "CoinDB",
        tableName: "CoinDB",
        paranoid: false,
        charset: "utf8",
        collate: "utf8_general_ci",
      }
    );
  }

  static associate(db) { }
};
