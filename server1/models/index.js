//시퀄라이즈  기본 연결 

const Sequelize = require("sequelize");     //시퀄라이즈 
const env = process.env.NODE_ENV || "development";
const config = require("../../config/config.json")[env];

const BlcokChainDB = require("./BlcokChainDB");
const CoinDB =require("./CoinDB");

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



db.CoinDB = CoinDB;

CoinDB.init(sequelize);

CoinDB.associate(db);
module.exports = db;
