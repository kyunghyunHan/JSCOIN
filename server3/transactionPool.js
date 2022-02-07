const _ = require("lodash");
const TX = require("./transaction");

let transactionPool = [];

const getTransactionPool = () => {
  return _.cloneDeep(transactionPool);
};

const addToTransactionPool = (tx, unspentTxOuts) => {
  if (!TX.validateTransaction(tx, unspentTxOuts)) {
    throw Error("에러 발생");
  }
  if (!isValidTxForPool(tx, transactionPool)) {
    throw Error("에러 발생");
  }
  transactionPool.push(tx);
};

const hasTxIn = (txIn, unspentTxOuts) => {
  const foundTxIn = unspentTxOuts.find((uTxO) => {
    return uTxO.txOutId === txIn.txOutId && uTxO.txOutIndex === txIn.txOutIndex;
  });
  return foundTxIn !== undefined;
};


const updateTransactionPool = (unspentTxOuts) => {
  const invalidTxs = [];

  for (const tx of transactionPool) {
    for (const txIn of tx.txIns) {
      if (!hasTxIn(txIn, unspentTxOuts)) {
        invalidTxs.push(tx);
        break;
      }
    }
  }
  if (invalidTxs.length > 0) {
    transactionPool = _.without(transactionPool, ...invalidTxs);
  }
};

const getTxPoolIns = (aTransactionPool) => {
  return _(aTransactionPool)
    .map((tx) => tx.txIns)
    .flatten()
    .value();
};

const isValidTxForPool = (tx, aTtransactionPool) => {
  const txPoolIns = getTxPoolIns(aTtransactionPool);
  const containsTxIn = (txIns, txIn) => {
    return _.find(txPoolIns, (txPoolIn) => {
      return (
        txIn.txOutIndex === txPoolIn.txOutIndex &&
        txIn.txOutId === txPoolIn.txOutId
      );
    });
  };
  for (const txIn of tx.txIns) {
    if (containsTxIn(txPoolIns, txIn)) {
      return false;
    }
  }
  return true;
};

module.exports = {
  addToTransactionPool,
  getTransactionPool,
  updateTransactionPool,
};
