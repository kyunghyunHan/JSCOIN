const Sequelize = require("sequelize");

module.exports = class BlcokChainDB extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        BCNUM: {
          type: Sequelize.INTEGER.UNSIGNED,
          primaryKey: true,
          allowNull: false,
          autoIncrement: true,
        },

        BlockChain: {
          type: Sequelize.JSON,
          allowNull: true,
        },
        Coin: {
          type: Sequelize.INTEGER(100),
          allowNull: true,
        },
      },
      {
        sequelize,
        timestamps: false,
        underscored: false,
        modelName: "MIMI1",
        tableName: "MIMI1",
        paranoid: false,
        charset: "utf8",
        collate: "utf8_general_ci",
      }
    );
  }

  static associate(db) { }
};
