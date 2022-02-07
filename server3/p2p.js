const WebSocket = require("ws");
const BC = require("./blockchain");
const TX = require("./transaction");
const TP = require("./transactionPool");
const sockets = [];

const MessageType = {
  QUERY_LATEST: 0,
  QUERY_ALL: 1,
  RESPONSE_BLOCKCHAIN: 2,
  //트랜젝션 메시지
  QUERY_TRANSACTION_POOL: 3,
  RESPONSE_TRANSACTION_POOL: 4,
};


const initP2PServer = (p2pPort) => {
  const server = new WebSocket.Server({ port: p2pPort });
  server.on("connection", (ws) => {
    initConnection(ws);
  });
  console.log(p2pPort + "번 포트 대기중...");
};

const getSockets = () => sockets;

const initConnection = (ws) => {
  sockets.push(ws);
  initMessageHandler(ws);
  initErrorHandler(ws);
  write(ws, queryChainLengthMsg());
  setTimeout(() => {
    broadcast(queryTransactionPoolMsg());
  }, 500);
};

const initMessageHandler = (ws) => {
  const { handleReceivedTransaction } = require("./blockchain");
  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data);
      if (message === null) {
        console.log(data + "에 메시지가 빈값입니다.");
        return;
      }
      switch (message.type) {
        case MessageType.QUERY_LATEST:
          write(ws, responseLatestMsg());
          break;
        case MessageType.QUERY_ALL:
          write(ws, responseChainMsg());
          break;
        case MessageType.RESPONSE_BLOCKCHAIN:
          const receivedBlocks = JSON.parse(message.data);
          if (receivedBlocks === null) {
            break;
          }
          handleBlockchainResponse(receivedBlocks);
          break;
        case MessageType.QUERY_TRANSACTION_POOL:
          write(ws, responseTransactionPoolMsg());
          break;
        case MessageType.RESPONSE_TRANSACTION_POOL:
          const receivedTransactions = JSON.parse(message.data);
          receivedTransactions.forEach((transaction) => {
            try {
              handleReceivedTransaction(transaction);
              broadCastTransactionPool();
            } catch (e) {
              console.log(e.message);
            }
          });
          break;
      }
    } catch (e) {
      console.log(e);
    }
  });
};

const write = (ws, message) => ws.send(JSON.stringify(message));

const broadcast = (message) =>
  sockets.forEach((socket) => write(socket, message));

const queryChainLengthMsg = () => ({
  type: MessageType.QUERY_LATEST,
  data: null,
});

const queryAllMsg = () => ({ type: MessageType.QUERY_ALL, data: null });

function responseChainMsg() {
  const { getBlockchain } = require("./blockchain");
  return {
    type: MessageType.RESPONSE_BLOCKCHAIN,
    data: JSON.stringify(getBlockchain()),
  };
}

function responseLatestMsg() {
  const { getLatestBlock } = require("./blockchain");
  return {
    type: MessageType.RESPONSE_BLOCKCHAIN,
    data: JSON.stringify([getLatestBlock()]),
  };
}

const queryTransactionPoolMsg = () => ({
  type: MessageType.QUERY_TRANSACTION_POOL,
  data: null,
});

const responseTransactionPoolMsg = () => ({
  type: MessageType.RESPONSE_TRANSACTION_POOL,
  data: JSON.stringify(TP.getTransactionPool()),
});

const initErrorHandler = (ws) => {
  const closeConnection = (myWs) => {
    sockets.splice(sockets.indexOf(myWs), 1);
  };
  ws.on("close", () => closeConnection(ws));
  ws.on("error", () => closeConnection(ws));
};

const handleBlockchainResponse = (receivedBlocks) => {
  const {
    isValidBlockStructure,
    getLatestBlock,
    replaceChain,
    addBlockToChain,
  } = require("./blockchain");
  if (receivedBlocks.length === 0) {
    return;
  }

  const latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];

  if (!isValidBlockStructure(latestBlockReceived)) {
    return;
  }
  const latestBlockHeld = getLatestBlock();
  if (latestBlockReceived.index > latestBlockHeld.index) {
    if (latestBlockHeld.hash === latestBlockReceived.previousHash) {
      if (addBlockToChain(latestBlockReceived)) {
        broadcast(responseLatestMsg());
      }
    } else if (receivedBlocks.length === 1) {
      broadcast(queryAllMsg());
    } else {
      replaceChain(receivedBlocks);
    }
  }
};

const broadcastLatest = () => {
  broadcast(responseLatestMsg());
};

const connectToPeers = (newPeer) => {
  const ws = new WebSocket(newPeer);
  ws.on("open", () => {
    initConnection(ws), res.send("Peer 연결완료");
  });
  ws.on("error", () => {
    res.send("Peer 연결실패");
  });
};

const broadCastTransactionPool = () => {
  broadcast(responseTransactionPoolMsg());
};

module.exports = {
  connectToPeers,
  broadcastLatest,
  broadCastTransactionPool,
  initP2PServer,
  getSockets,
};
