const Sequelize = require("sequelize");
const env = process.env.NODE_ENV || "development";
const config = require("../../config/config.json")[env];

const BlcokChainDB = require("./BlcokChainDB");

const db = {};

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config,
);

db.sequelize = sequelize;
db.Sequelize = Sequelize;


db.BlcokChainDB = BlcokChainDB;

BlcokChainDB.init(sequelize);

BlcokChainDB.associate(db);


module.exports = db;
