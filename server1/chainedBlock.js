const fs = require("fs");
const merkle = require("merkle");
const cryptojs = require("crypto-js");
const { BlcokChainDB, CoinDB } = require("./models");
const random = require("random");

class Block {
  constructor(header, body) {
    this.header = header;
    this.body = body;
  }
}

class BlockHeader {
  constructor(
    version,
    index,
    previousHash,
    timestamp,
    merkleRoot,
    difficulty,
    nonce,
    hash
  ) {
    this.version = version;
    this.index = index;
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.merkleRoot = merkleRoot;
    this.difficulty = difficulty;
    this.nonce = nonce;
    this.hash = hash;
  }
}
function getVersion() {
  const package = fs.readFileSync("package.json");
  return JSON.parse(package).version;
}

function creatGenesisBlock() {
  const version = getVersion();
  const index = 0;
  const previousHash = "0".repeat(64);
  const timestamp = 1231006505;
  const body = [
    "The Times 03/Jan/2009 Chancellor on brink of second bailout for banks",
  ];
  const hash = findBlock();
  const tree = merkle("sha256").sync(body);
  const merkleRoot = tree.root() || "0".repeat(64);
  const difficulty = 3;
  const nonce = 0;
  const header = new BlockHeader(
    version,
    index,
    previousHash,
    timestamp,
    merkleRoot,
    difficulty,
    nonce,
    hash
  );
  return new Block(header, body);
}
let Blocks = [creatGenesisBlock()];

function getBlocks() {
  return Blocks;
}

function getLastBlock() {
  return Blocks[Blocks.length - 1];
}

function createHash(data) {
  const {
    version,
    index,
    previousHash,
    timestamp,
    merkleRoot,
    difficulty,
    nonce,
  } = data.header;
  const blockString =
    version +
    index +
    previousHash +
    timestamp +
    merkleRoot +
    difficulty +
    nonce;
  const hash = cryptojs.SHA256(blockString).toString();
  return hash;
}

function calculateHash(
  version,
  index,
  previousHash,
  timestamp,
  merkleRoot,
  difficulty,
  nonce
) {
  const blockString =
    version +
    index +
    previousHash +
    timestamp +
    merkleRoot +
    difficulty +
    nonce;
  const hash = cryptojs.SHA256(blockString).toString();
  return hash;
}

function nextBlock(bodyData) {
  const prevBlock = getLastBlock();
  const hash = findBlock();
  const version = getVersion();
  const index = prevBlock.header.index + 1;
  const previousHash = createHash(prevBlock);
  const timestamp = parseInt(Date.now() / 1000);
  const tree = merkle("sha256").sync(bodyData);
  const merkleRoot = tree.root() || "0".repeat(64);
  const difficulty = getDifficulty(getBlocks());

  const header = findBlock(
    version,
    index,
    previousHash,
    timestamp,
    merkleRoot,
    difficulty,
    hash
  );
  return new Block(header, bodyData);
}

function addBlock(bodyData) {
  const newBlock = nextBlock(bodyData);
  Blocks.push(newBlock);
}

function hexToBinary(s) {
  const lookupTable = {
    0: "0000",
    1: "0001",
    2: "0010",
    3: "0011",
    4: "0100",
    5: "0101",
    6: "0110",
    7: "0111",
    8: "1000",
    9: "1001",
    A: "1010",
    B: "1011",
    C: "1100",
    D: "1101",
    E: "1110",
    F: "1111",
  };

  let ret = "";
  for (let i = 0; i < s.length; i++) {
    if (lookupTable[s[i]]) {
      ret += lookupTable[s[i]];
    } else {
      return null;
    }
  }
  return ret;
}

function hashMatchesDifficulty(hash, difficulty) {
  const hashBinary = hexToBinary(hash.toUpperCase());
  const requirePrefix = "0".repeat(difficulty);
  return hash.startsWith(requirePrefix);
}

function findBlock(
  currentVersion,
  nextIndex,
  previousHash,
  nextTimestamp,
  merkleRoot,
  difficulty
) {
  let nonce = 0;
  while (true) {
    let hash = calculateHash(
      currentVersion,
      nextIndex,
      previousHash,
      nextTimestamp,
      merkleRoot,
      difficulty,
      nonce
    );

    if (hashMatchesDifficulty(hash, difficulty)) {
      return new BlockHeader(
        currentVersion,
        nextIndex,
        previousHash,
        nextTimestamp,
        merkleRoot,
        difficulty,
        nonce,
        hash
      );
    }
    nonce++;
  }
}

const BLOCK_GENERATION_INTERVAL = 10;
const DIFFICULTY_ADJUSTMENT_INTERVAL = 10;

function getDifficulty(blocks) {
  const lastBlock = blocks[blocks.length - 1];
  if (
    lastBlock.header.index % DIFFICULTY_ADJUSTMENT_INTERVAL === 0 &&
    lastBlock.header.index != 0
  ) {
    return getAdjustedDifficulty(lastBlock, blocks);
  }
  return lastBlock.header.difficulty;
}

function getAdjustedDifficulty(lastBlock, blocks) {
  const preAdjustmentBlock =
    blocks[blocks.length - DIFFICULTY_ADJUSTMENT_INTERVAL];
  const timeToken =
    lastBlock.header.timestamp - preAdjustmentBlock.header.timestamp;
  const timeExpected =
    DIFFICULTY_ADJUSTMENT_INTERVAL * BLOCK_GENERATION_INTERVAL;

  if (timeExpected / 2 > timeToken) {
    return preAdjustmentBlock.header.difficulty + 1;
  } else if (timeExpected * 2 < timeToken) {
    if (preAdjustmentBlock.header.difficulty > 0) {
      return preAdjustmentBlock.header.difficulty - 1;
    }
    return preAdjustmentBlock.header.difficulty;
  } else {
    return preAdjustmentBlock.header.difficulty;
  }
}

function getCurrentTimestamp() {
  return Math.round(new Date().getTime() / 1000);
}

function isValidTimestamp(newBlock, prevBlock) {
  if (newBlock.header.timestamp < prevBlock.header.timestamp - 5000) return true;
  if (getCurrentTimestamp() > newBlock.header.timestamp - 5000) return true;

  return false;
}

async function replaceChain(newBlocks) {
  if (isValidChain(newBlocks)) {
    if (
      newBlocks.length > Blocks.length ||
      (newBlocks.length === Blocks.length && random.boolean())
    ) {
      Blocks = newBlocks;
      const nw = require("./p2pServer");
      nw.broadcast(nw.responseLatestMsg());
      BlcokChainDB.destroy({ where: {}, truncate: true });

      for (let i = 0; i < newBlocks.length; i++) {
        await BlcokChainDB.create({ BlockChain: newBlocks[i] });
      }
    }
  }
}

function isValidChain(newBlocks) {
  console.log(JSON.stringify(newBlocks[0]));
  console.log(JSON.stringify(Blocks[0]));
  if (
    JSON.stringify(
      newBlocks[0].body &&
      newBlocks[0].header.version &&
      newBlocks[0].header.index &&
      newBlocks[0].header.timestamp &&
      newBlocks[0].header.merkleRoot &&
      newBlocks[0].header.previousHash &&
      newBlocks[0].header.hash
    ) !==
    JSON.stringify(
      Blocks[0].body &&
      Blocks[0].header.version &&
      Blocks[0].header.index &&
      Blocks[0].header.timestamp &&
      Blocks[0].header.merkleRoot &&
      Blocks[0].header.previousHash &&
      Blocks[0].header.hash
    )
  ) {
    return false;
  }

  var tempBlocks = [newBlocks[0]];
  const { isValidNewBlock } = require("./blockCheck");

  for (var i = 1; i < newBlocks.length; i++) {
    if (isValidNewBlock(newBlocks[i], tempBlocks[i - 1])) {
      tempBlocks.push(newBlocks[i]);
    } else {
      return false;
    }
  }
  return true;
}

function checkAddBlock(newBlock) {
  const { isValidNewBlock } = require("./blockCheck");
  if (isValidNewBlock(newBlock, getLastBlock())) {
    Blocks.push(newBlock);
    BlcokChainDB.create({
      BlockChain: newBlock,
      Coin: 50,
    });
    CoinDB.create({
      Coin: 50,
    });
    return true;
  }
  return false;
}

function dbBlockCheck(DBBC) {
  let bc = [];
  DBBC.forEach((blocks) => {
    bc.push(blocks.BlockChain);
  });

  if (bc.length === 0) {
    BlcokChainDB.create({ BlockChain: creatGenesisBlock() });
    bc.push(creatGenesisBlock());
  }
  const DBBlock = bc[bc.length - 1];
  const latesMyBlock = getLastBlock();

  if (DBBlock.header.index < latesMyBlock.header.index) {
    if (createHash(DBBlock) === latesMyBlock.header.previousHash) {
      BlcokChainDB.create({
        BlockChain: latesMyBlock,
      }).catch((err) => {
        console.log(err);
        throw err;
      });
    } else {
      replaceChain(getBlocks());
    }
  } else {
    Blocks = bc;
  }
}

module.exports = {
  Block,
  checkAddBlock,
  dbBlockCheck,
  replaceChain,
  hashMatchesDifficulty,
  isValidTimestamp,
  getBlocks,
  createHash,
  Blocks,
  getLastBlock,
  nextBlock,
  addBlock,
  getVersion,
  creatGenesisBlock,
};
