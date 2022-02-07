const p2p_port = process.env.P2P_PORT || 6001;
const WebSocket = require("ws");
const {
  checkAddBlock,
  replaceChain,
  getLastBlock,
  getBlocks,
  createHash,
} = require("./chainedBlock");
//
function initP2PServer() {
  const server = new WebSocket.Server({ port: p2p_port });
  server.on("connection", (ws) => {
    initConnection(ws);
  });
  console.log(p2p_port + "번 포트 대기중...");
}

initP2PServer();

let sockets = [];
function getSockets() {
  return sockets;
}
function initConnection(ws) {
  sockets.push(ws);
  initErrorHandler(ws);
  initMessageHandler(ws);

  write(ws, queryLatesmsg());
}

function write(ws, message) {
  ws.send(JSON.stringify(message));
}

function broadcast(message) {
  sockets.forEach((socket) => {
    write(socket, message);
  });
}

const MessageType = {
  QUERY_LATEST: 0,
  QUERY_ALL: 1,
  RESPONSE_BLOCKCHAIN: 2,
};

function initMessageHandler(ws) {
  ws.on("message", (data) => {
    const message = JSON.parse(data);
    switch (message.type) {
      case MessageType.QUERY_LATEST:
        write(ws, responseLatestMsg());
        break;
      case MessageType.QUERY_ALL:
        write(ws, responseAllChainMsg());
        break;
        ``;
      case MessageType.RESPONSE_BLOCKCHAIN:
        handleBolckChainResponse(message);
        break;
    }
  });
}

function responseLatestMsg() {
  return {
    type: MessageType.RESPONSE_BLOCKCHAIN,
    data: JSON.stringify([getLastBlock()]),
  };
}
function responseAllChainMsg() {
  return {
    type: MessageType.RESPONSE_BLOCKCHAIN,
    data: JSON.stringify(getBlocks()),
  };
}

function handleBolckChainResponse(message) {
  const receiveBlocks = message.data;
  const latestReceiveBlock = receiveBlocks[receiveBlocks.length - 1];
  const latesMyBlock = getLastBlock();

  if (latestReceiveBlock.header.index > latesMyBlock.header.index) {
    console.log(
      "블록의 총갯수\n" +
        `전달받은 블록의 index값 ${latestReceiveBlock.header.index}\n` +
        `현재 보유중인 index값 ${latesMyBlock.header.index}\n`
    );

    if (createHash(latesMyBlock) === latestReceiveBlock.header.previousHash) {
      console.log(
        `내 최신 해시값=남 이전 해시값`
      );

      if (checkAddBlock(latestReceiveBlock)) {
        broadcast(responseLatestMsg());
        console.log("블록 추가\n");
      } else {
        console.log("유효하지 않은 블록입니다.");
      }
    } else if (receiveBlocks.length === 1) {
      console.log(`Peer로부터 연결 필요\n`);
      broadcast(queryAllmsg());
    } else {
      console.log(`Block renewal`);
      replaceChain(receiveBlocks);
    }
  } else {
    console.log("Block initialized...");
  }
}

function queryAllmsg() {
  return {
    type: MessageType.QUERY_ALL,
    data: null,
  };
}
function queryLatesmsg() {
  return {
    type: MessageType.QUERY_LATEST,
    data: null,
  };
}

function initErrorHandler(ws) {
  ws.on("close", () => {
    closeConnection(ws);
  });
  ws.on("error", () => {
    closeConnection(ws);
  });
}
function closeConnection(ws) {
  console.log(`connection close ${ws.url}`);
  sockets.splice(sockets.indexOf(ws), 1);
}

module.exports = {
  initConnection,
  write,
  getSockets,
  broadcast,
  responseLatestMsg,
  sockets,
  queryLatesmsg,
};
