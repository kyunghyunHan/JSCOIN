const CryptoJS = require("crypto-js");
const _ = require("lodash");
const P2P = require("./p2p");
const TX = require("./transaction");
const TP = require("./transactionPool");
const { hexToBinary } = require("./util");
const WALLET = require("./wallet");

class Block {
  constructor(index, hash, previousHash, timestamp, data, difficulty, nonce) {
    this.index = index;
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.data = data;
    this.hash = hash;
    this.difficulty = difficulty;
    this.nonce = nonce;
  }
}

const genesisTransaction = {
  'txIns': [{ 'signature': '', 'txOutId': '', 'txOutIndex': 0 }],
  'txOuts': [{
    'address': '04bfcab8722991ae774db48f934ca79cfb7dd991229153b9f732ba5334aafcd8e7266e47076996b55a14bf9913ee3145ce0cfc1372ada8ada74bd287450313534a',
    'amount': 50
  }],
  'id': 'e655f6a5f26dc9b4cac6e46f52336428287759cf81ef5ff10854f69d68f43fa3'
};

const genesisBlock = new Block(0, '91a73664bc84c0baa1fc75ea6e4aa6d1d20c5df664c724e3159aefc2e1186627', '', 1465154705, [genesisTransaction], 0, 0);

let blockchain = [genesisBlock];

let unspentTxOuts = TX.processTransactions(blockchain[0].data, [], 0);

const getBlockchain = () => blockchain;

const getUnspentTxOuts = () => _.cloneDeep(unspentTxOuts);

const setUnspentTxOuts = (newUnspentTxOut) => {
  unspentTxOuts = newUnspentTxOut;
  console.log("공용장부(unspentTxouts)를 최신화합니다");
};

const getLatestBlock = () => blockchain[blockchain.length - 1];

const BLOCK_GENERATION_INTERVAL = 10;

const DIFFICULTY_ADJUSTMENT_INTERVAL = 5;

const getDifficulty = (aBlockchain) => {
  const latestBlock = aBlockchain[blockchain.length - 1];
  if (
    latestBlock.index % DIFFICULTY_ADJUSTMENT_INTERVAL === 0 &&
    latestBlock.index !== 0
  ) {
    if (latestBlock.difficulty == 0) {
      return latestBlock.difficulty;
    }
    return getAdjustedDifficulty(latestBlock, aBlockchain);
  } else {
    return latestBlock.difficulty;
  }
};

const getAdjustedDifficulty = (latestBlock, aBlockchain) => {
  const prevAdjustmentBlock =
    aBlockchain[blockchain.length - DIFFICULTY_ADJUSTMENT_INTERVAL];
  const timeExpected =
    BLOCK_GENERATION_INTERVAL * DIFFICULTY_ADJUSTMENT_INTERVAL;
  const timeTaken = latestBlock.timestamp - prevAdjustmentBlock.timestamp;
  if (timeTaken < timeExpected / 2) {
    return prevAdjustmentBlock.difficulty + 1;
  } else if (timeTaken > timeExpected * 2) {
    return prevAdjustmentBlock.difficulty - 1;
  } else {
    return prevAdjustmentBlock.difficulty;
  }
};

const getCurrentTimestamp = () => Math.round(new Date().getTime() / 1000);

const generateRawNextBlock = (blockData) => {
  const previousBlock = getLatestBlock();
  const difficulty = getDifficulty(getBlockchain());
  const nextIndex = previousBlock.index + 1;
  const nextTimestamp = getCurrentTimestamp();
  const newBlock = findBlock(
    nextIndex,
    previousBlock.hash,
    nextTimestamp,
    blockData,
    difficulty
  );
  if (addBlockToChain(newBlock)) {
    P2P.broadcastLatest();
    return newBlock;
  } else {
    return null;
  }
};

const getMyUnspentTransactionOutputs = () => {
  return WALLET.findUnspentTxOuts(
    WALLET.getPublicFromWallet(),
    getUnspentTxOuts()
  );
};

const generateNextBlock = () => {
  const coinbaseTx = TX.getCoinbaseTransaction(
    WALLET.getPublicFromWallet(),
    getLatestBlock().index + 1
  );
  const blockData = [coinbaseTx].concat(TP.getTransactionPool());
  return generateRawNextBlock(blockData);
};

const generatenextBlockWithTransaction = (receiverAddress, amount) => {
  if (!TX.isValidAddress(receiverAddress)) {
    throw Error("잘못된 주소입니다.");
  }
  if (typeof amount !== "number") {
    throw Error("숫자만 입력해주세요.");
  }
  const coinbaseTx = TX.getCoinbaseTransaction(
    WALLET.getPublicFromWallet(),
    getLatestBlock().index + 1
  );
  const tx = WALLET.createTransaction(
    receiverAddress,
    amount,
    WALLET.getPrivateFromWallet(),
    getUnspentTxOuts(),
    TP.getTransactionPool()
  );

  const blockData = [coinbaseTx, tx];
  return generateRawNextBlock(blockData);
};


const findBlock = (index, previousHash, timestamp, data, difficulty) => {
  let nonce = 0;
  while (true) {
    const hash = calculateHash(
      index,
      previousHash,
      timestamp,
      data,
      difficulty,
      nonce
    );
    if (hashMatchesDifficulty(hash, difficulty)) {
      return new Block(
        index,
        hash,
        previousHash,
        timestamp,
        data,
        difficulty,
        nonce
      );
    }
    nonce++;
  }
};

const getAccountBalance = () => {
  return WALLET.getBalance(WALLET.getPublicFromWallet(), getUnspentTxOuts());
};

const sendTransaction = (address, amount) => {
  const tx = WALLET.createTransaction(
    address,
    amount,
    WALLET.getPrivateFromWallet(),
    getUnspentTxOuts(),
    TP.getTransactionPool()
  );
  TP.addToTransactionPool(tx, getUnspentTxOuts());
  P2P.broadCastTransactionPool();
  return tx;
};

const calculateHashForBlock = (block) =>
  calculateHash(
    block.index,
    block.previousHash,
    block.timestamp,
    block.data,
    block.difficulty,
    block.nonce
  );

const calculateHash = (
  index,
  previousHash,
  timestamp,
  data,
  difficulty,
  nonce
) =>
  CryptoJS.SHA256(
    index + previousHash + timestamp + data + difficulty + nonce
  ).toString();

const isValidBlockStructure = (block) => {
  return (
    typeof block.index === "number" &&
    typeof block.hash === "string" &&
    typeof block.previousHash === "string" &&
    typeof block.timestamp === "number" &&
    typeof block.data === "object"
  );
};

const isValidNewBlock = (newBlock, previousBlock) => {
  if (!isValidBlockStructure(newBlock)) {
    return false;
  }
  if (previousBlock.index + 1 !== newBlock.index) {
    return false;
  } else if (previousBlock.hash !== newBlock.previousHash) {
    return false;
  } else if (!isValidTimestamp(newBlock, previousBlock)) {
    return false;
  } else if (!hasValidHash(newBlock)) {
    return false;
  }
  return true;
};

// 누적 난이도 계산해주는 녀석
const getAccumulatedDifficulty = (aBlockchain) => {
  return aBlockchain
    .map((block) => block.difficulty)
    .map((difficulty) => Math.pow(2, difficulty))
    .reduce((a, b) => a + b);
};

const isValidTimestamp = (newBlock, previousBlock) => {
  return (
    previousBlock.timestamp - 60 < newBlock.timestamp &&
    newBlock.timestamp - 60 < getCurrentTimestamp()
  );
};

const hasValidHash = (block) => {
  if (!hashMatchesBlockContent(block)) {
    return false;
  }
  if (!hashMatchesDifficulty(block.hash, block.difficulty)) {
    return false;
  }
  return true;
};

const hashMatchesBlockContent = (block) => {
  const blockHash = calculateHashForBlock(block);
  return blockHash === block.hash;
};

const hashMatchesDifficulty = (hash, difficulty) => {
  const hashInBinary = hexToBinary(hash);
  const requiredPrefix = "0".repeat(difficulty);
  return hashInBinary.startsWith(requiredPrefix);
};

const isValidChain = (blockchainToValidate) => {
  const isValidGenesis = (block) => {
    return JSON.stringify(block) === JSON.stringify(genesisBlock);
  };
  if (!isValidGenesis(blockchainToValidate[0])) {
    return null;
  }

  let aUnspentTxOuts = [];

  for (let i = 0; i < blockchainToValidate.length; i++) {
    const currentBlock = blockchainToValidate[i];
    if (
      i !== 0 &&
      !isValidNewBlock(blockchainToValidate[i], blockchainToValidate[i - 1])
    ) {
      return null;
    }
    aUnspentTxOuts = TX.processTransactions(
      currentBlock.data,
      aUnspentTxOuts,
      currentBlock.index
    );
    if (aUnspentTxOuts === null) {
      return null;
    }
  }
  return aUnspentTxOuts;
};

const addBlockToChain = (newBlock) => {
  if (isValidNewBlock(newBlock, getLatestBlock())) {
    const retVal = TX.processTransactions(
      newBlock.data,
      getUnspentTxOuts(),
      newBlock.index
    );
    if (retVal === null) {
      return false;
    } else {
      blockchain.push(newBlock);
      setUnspentTxOuts(retVal);
      TP.updateTransactionPool(unspentTxOuts);
      return true;
    }
  }
  return false;
};

const replaceChain = (newBlocks) => {
  const aUnspentTxOuts = isValidChain(newBlocks);
  const validChain = aUnspentTxOuts !== null;
  if (
    validChain &&
    getAccumulatedDifficulty(newBlocks) >
    getAccumulatedDifficulty(getBlockchain())
  ) {
    blockchain = newBlocks;
    setUnspentTxOuts(aUnspentTxOuts);
    TP.updateTransactionPool(unspentTxOuts);
    P2P.broadcastLatest();
  }
};
const handleReceivedTransaction = (transaction) => {
  TP.addToTransactionPool(transaction, getUnspentTxOuts());
};

module.exports = {
  Block,
  getBlockchain,
  getUnspentTxOuts,
  getLatestBlock,
  sendTransaction,
  generateRawNextBlock,
  generateNextBlock,
  generatenextBlockWithTransaction,
  handleReceivedTransaction,
  getMyUnspentTransactionOutputs,
  getAccountBalance,
  isValidBlockStructure,
  replaceChain,
  addBlockToChain,
};
