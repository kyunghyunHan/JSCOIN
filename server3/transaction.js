const CryptoJS = require("crypto-js");
const ecdsa = require("elliptic");
const _ = require("lodash");

const EC = new ecdsa.ec("secp256k1");

const COINBASE_AMOUNT = 50;

class UnspentTxOut {
  constructor(txOutId, txOutIndex, address, amount) {
    this.txOutId = txOutId;
    this.txOutIndex = txOutIndex;
    this.address = address;
    this.amount = amount;
  }
}

class TxIn {
  constructor(txOutId, txOutIndex, signature) {
    this.txOutId = txOutId;
    this.txOutIndex = txOutIndex;
    this.signature = signature;
  }
}

class TxOut {
  constructor(address, amount) {
    this.address = address;
    this.amount = amount;
  }
}

class Transaction {
  constructor(id, txIns, txOuts) {
    this.id = id;
    this.txIns = txIns;
    this.txOuts = txOuts;
  }
}

const getTransactionId = (transaction) => {
  const txInContent = transaction.txIns
    .map((txIn) => txIn.txOutId + txIn.txOutIndex)
    .reduce((a, b) => a + b, "");
  const txOutContent = transaction.txOuts
    .map((txOut) => txOut.address + txOut.amount)
    .reduce((a, b) => a + b, "");
  return CryptoJS.SHA256(txInContent + txOutContent).toString();
};

const validateTransaction = (transaction, aUnspentTxOuts) => {
  if (!isValidTransactionStructure(transaction)) {
    return false;
  }
  if (getTransactionId(transaction) !== transaction.id) {
    return false;
  }

  const hasValidTxIns = transaction.txIns
    .map((txIn) => validateTxIn(txIn, transaction, aUnspentTxOuts))
    .reduce((a, b) => a && b, true);
  if (!hasValidTxIns) {
    return false;
  }

  const totalTxInValues = transaction.txIns
    .map((txIn) => getTxInAmount(txIn, aUnspentTxOuts))
    .reduce((a, b) => a + b, 0);

  const totalTxOutValues = transaction.txOuts
    .map((txOut) => txOut.amount)
    .reduce((a, b) => a + b, 0);

  if (totalTxOutValues !== totalTxInValues) {
    return false;
  }

  return true;
};

const validateBlockTransactions = (
  aTransactions,
  aUnspentTxOuts,
  blockIndex
) => {
  const coinbaseTx = aTransactions[0];
  if (!validateCoinbaseTx(coinbaseTx, blockIndex)) {
    return false;
  }

  const txIns = _(aTransactions)
    .map((tx) => tx.txIns)
    .flatten()
    .value();

  if (hasDuplicates(txIns)) {
    return false;
  }

  const normalTransactions = aTransactions.slice(1);
  return normalTransactions
    .map((tx) => validateTransaction(tx, aUnspentTxOuts))
    .reduce((a, b) => a && b, true);
};

const hasDuplicates = (txIns) => {
  const groups = _.countBy(txIns, (txIn) => txIn.txOutId + txIn.txOutIndex);
  return _(groups)
    .map((value, key) => {
      if (value > 1) {
        console.log("duplicate txIn: " + key);
        return true;
      } else {
        return false;
      }
    })
    .includes(true);
};

const validateCoinbaseTx = (transaction, blockIndex) => {
  if (transaction == null) {
    return false;
  }
  if (getTransactionId(transaction) !== transaction.id) {
    return false;
  }
  if (transaction.txIns.length !== 1) {
    return;
  }
  if (transaction.txIns[0].txOutIndex !== blockIndex) {
    return false;
  }
  if (transaction.txOuts.length !== 1) {
    return false;
  }
  if (transaction.txOuts[0].amount !== COINBASE_AMOUNT) {
    return false;
  }
  return true;
};


const validateTxIn = (txIn, transaction, aUnspentTxOuts) => {
  const referencedUTxOut = aUnspentTxOuts.find(
    (uTxO) =>
      uTxO.txOutId === txIn.txOutId &&
      uTxO.txOutIndex === txIn.txOutIndex
  );
  if (referencedUTxOut == null) {
    return false;
  }
  const address = referencedUTxOut.address;
  const key = EC.keyFromPublic(address, "hex");
  const validSignature = key.verify(transaction.id, txIn.signature);
  if (!validSignature) {
    console.log("(검사실패) 본인의 서명이 아닌 모양입니다");
    return false;
  }
  return true;
};


const getTxInAmount = (txIn, aUnspentTxOuts) => {
  return findUnspentTxOut(txIn.txOutId, txIn.txOutIndex, aUnspentTxOuts).amount;
};

const findUnspentTxOut = (transactionId, index, aUnspentTxOuts) => {
  return aUnspentTxOuts.find(
    (uTxO) => uTxO.txOutId === transactionId && uTxO.txOutIndex === index
  );
};

const getCoinbaseTransaction = (address, blockIndex) => {
  const t = new Transaction();
  const txIn = new TxIn();
  txIn.signature = "";
  txIn.txOutId = "";
  txIn.txOutIndex = blockIndex;

  t.txIns = [txIn];
  t.txOuts = [new TxOut(address, COINBASE_AMOUNT)];
  t.id = getTransactionId(t);
  return t;
};

const signTxIn = (transaction, txInIndex, privateKey, aUnspentTxOuts) => {
  const txIn = transaction.txIns[txInIndex];

  const dataToSign = transaction.id;
  const referencedUnspentTxOut = findUnspentTxOut(
    txIn.txOutId,
    txIn.txOutIndex,
    aUnspentTxOuts
  );
  if (referencedUnspentTxOut == null) {
    throw Error();
  }
  const referencedAddress = referencedUnspentTxOut.address;

  if (getPublicKey(privateKey) !== referencedAddress) {
    throw Error();
  }
  const key = EC.keyFromPrivate(privateKey, "hex");
  const signature = toHexString(key.sign(dataToSign).toDER());

  return signature;
};

const updateUnspentTxOuts = (aTransactions, aUnspentTxOuts) => {
  const newUnspentTxOuts = aTransactions
    .map((t) => {
      return t.txOuts.map(
        (txOut, index) =>
          new UnspentTxOut(t.id, index, txOut.address, txOut.amount)
      );
    })
    .reduce((a, b) => a.concat(b), []);

  const consumedTxOuts = aTransactions
    .map((t) => t.txIns)
    .reduce((a, b) => a.concat(b), [])
    .map((txIn) => new UnspentTxOut(txIn.txOutId, txIn.txOutIndex, "", 0));

  const resultingUnspentTxOuts = aUnspentTxOuts
    .filter(
      (uTxO) => !findUnspentTxOut(uTxO.txOutId, uTxO.txOutIndex, consumedTxOuts)
        .concat(newUnspentTxOuts)
    );
  return resultingUnspentTxOuts;
};

const processTransactions = (aTransactions, aUnspentTxOuts, blockIndex) => {
  if (!validateBlockTransactions(aTransactions, aUnspentTxOuts, blockIndex)) {
    return null;
  }
  return updateUnspentTxOuts(aTransactions, aUnspentTxOuts);
};

const toHexString = (byteArray) => {
  return Array.from(byteArray, (byte) => {
    return ("0" + (byte & 0xff).toString(16)).slice(-2);
  }).join("");
};

const getPublicKey = (aPrivateKey) => {
  return EC.keyFromPrivate(aPrivateKey, "hex").getPublic().encode("hex");
};

const isValidTxInStructure = (txIn) => {
  if (txIn == null) {
    return false;
  } else if (typeof txIn.signature !== "string") {
    return false;
  } else if (typeof txIn.txOutId !== "string") {
    return false;
  } else if (typeof txIn.txOutIndex !== "number") {
    return false;
  } else {
    return true;
  }
};

const isValidTxOutStructure = (txOut) => {
  if (txOut == null) {
    return false;
  } else if (typeof txOut.address !== "string") {
    return false;
  } else if (!isValidAddress(txOut.address)) {
    return false;
  } else if (typeof txOut.amount !== "number") {
    return false;
  } else {
    return true;
  }
};

const isValidTransactionStructure = (transaction) => {
  if (typeof transaction.id !== "string") {
    return false;
  }
  if (!(transaction.txIns instanceof Array)) {
    return false;
  }
  if (
    !transaction.txIns.map(isValidTxInStructure).reduce((a, b) => a && b, true)
  ) {
    return false;
  }
  if (!(transaction.txOuts instanceof Array)) {
    return false;
  }
  if (
    !transaction.txOuts
      .map(isValidTxOutStructure)
      .reduce((a, b) => a && b, true)
  ) {
    return false;
  }
  return true;
};

const isValidAddress = (address) => {
  if (address.length !== 130) {
    return false;
  } else if (address.match("^[a-fA-F0-9]+$") === null) {
    return false;
  } else if (!address.startsWith("04")) {
    return false;
  }
  return true;
};

module.exports = {
  processTransactions,
  signTxIn,
  getTransactionId,
  isValidAddress,
  validateTransaction,
  UnspentTxOut,
  TxIn,
  TxOut,
  getCoinbaseTransaction,
  getPublicKey,
  hasDuplicates,
  Transaction,
};
