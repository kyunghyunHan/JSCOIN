// const p2p_port = process.env.P2P_PORT || 6003;
// const WebSocket = require("ws");
// const {getLastBlock}=require("./blockchain")
// const {
//     addBlockToChain,
//   replaceChain,
//   getBlockchain,
//   calculateHash,
// } = require("./blockchain");
// //
// function initP2PServer() {
//   const server = new WebSocket.Server({ port: p2p_port });
//   server.on("connection", (ws) => {
//     initConnection(ws);
//   });
//   console.log(p2p_port + "번 포트 대기중...");
// }

// initP2PServer();

// let sockets = [];
// function getSockets() {
//   return sockets;
// }
// function initConnection(ws) {
//   sockets.push(ws);
//   initErrorHandler(ws);
//   initMessageHandler(ws);

//   write(ws, queryLatesmsg());
// }

// function write(ws, message) {
//   ws.send(JSON.stringify(message));
// }

// function broadcast(message) {
//   sockets.forEach((socket) => {
//     write(socket, message);
//   });
// }

// const MessageType = {
//   QUERY_LATEST: 0,
//   QUERY_ALL: 1,
//   RESPONSE_BLOCKCHAIN: 2,
// };

// function initMessageHandler(ws) {
//   ws.on("message", (data) => {
//     const message = JSON.parse(data);
//     switch (message.type) {
//       case MessageType.QUERY_LATEST:
//         write(ws, responseLatestMsg());
//         break;
//       case MessageType.QUERY_ALL:
//         write(ws, responseAllChainMsg());
//         break;
//         ``;
//       case MessageType.RESPONSE_BLOCKCHAIN:
//         handleBolckChainResponse(message);
//         break;
//     }
//   });
// }

// function responseLatestMsg() {
//   return {
//     type: MessageType.RESPONSE_BLOCKCHAIN,
//     data: JSON.stringify([getLastBlock()]),
//   };
// }
// function responseAllChainMsg() {
//   return {
//     type: MessageType.RESPONSE_BLOCKCHAIN,
//     data: JSON.stringify(getBlockchain()),
//   };
// }

// function handleBolckChainResponse(message) {
//   const receiveBlocks = message.data;
//   const latestReceiveBlock = receiveBlocks[receiveBlocks.length - 1];
//   const latesMyBlock = getLastBlock();

//   if (latestReceiveBlock.header.index > latesMyBlock.header.index) {
//     console.log(
//       "블록의 총갯수\n" +
//         `전달받은 블록의 index값 ${latestReceiveBlock.header.index}\n` +
//         `현재 보유중인 index값 ${latesMyBlock.header.index}\n`
//     );

//     if (createHash(latesMyBlock) === latestReceiveBlock.header.previousHash) {
//       console.log(
//         `내 최신 해시값=남 이전 해시값`
//       );

//       if (addBlockToChain(latestReceiveBlock)) {
//         broadcast(responseLatestMsg());
//         console.log("블록 추가\n");
//       } else {
//         console.log("유효하지 않은 블록입니다.");
//       }
//     } else if (receiveBlocks.length === 1) {
//       console.log(`Peer로부터 연결 필요\n`);
//       broadcast(queryAllmsg());
//     } else {
//       console.log(`Block renewal`);
//       replaceChain(receiveBlocks);
//     }
//   } else {
//     console.log("Block initialized...");
//   }
// }

// function queryAllmsg() {
//   return {
//     type: MessageType.QUERY_ALL,
//     data: null,
//   };
// }
// function queryLatesmsg() {
//   return {
//     type: MessageType.QUERY_LATEST,
//     data: null,
//   };
// }

// function initErrorHandler(ws) {
//   ws.on("close", () => {
//     closeConnection(ws);
//   });
//   ws.on("error", () => {
//     closeConnection(ws);
//   });
// }
// function closeConnection(ws) {
//   console.log(`connection close ${ws.url}`);
//   sockets.splice(sockets.indexOf(ws), 1);
// }

// module.exports = {
//   initConnection,
//   write,
//   getSockets,
//   broadcast,
//   responseLatestMsg,
//   sockets,
//   queryLatesmsg,
// };


const WebSocket =require('ws') ;
const {Server} =require('ws') ;
const {addBlockToChain, Block, getBlockchain, getLatestBlock, isValidBlockStructure, replaceChain} =require ('./blockchain');

const sockets = [];
var MessageType;
(function (MessageType) {
    MessageType[MessageType["QUERY_LATEST"] = 0] = "QUERY_LATEST";
    MessageType[MessageType["QUERY_ALL"] = 1] = "QUERY_ALL";
    MessageType[MessageType["RESPONSE_BLOCKCHAIN"] = 2] = "RESPONSE_BLOCKCHAIN";
})(MessageType || (MessageType = {}));

const initP2PServer = (p2pPort) => {
    const server = new WebSocket.Server({ port: p2pPort });
    server.on('connection', (ws) => {
        initConnection(ws);
    });
    console.log('포트대기: ' + p2pPort);
};
const getSockets = () => sockets;
const initConnection = (ws) => {
    sockets.push(ws);
    initMessageHandler(ws);
    initErrorHandler(ws);
    write(ws, queryChainLengthMsg());
};

function initMessageHandler(ws) {
    ws.on("message", (data) => {
      const message = JSON.parse(data);
      switch (message.type) {
        case MessageType.QUERY_LATEST:
          write(ws, responseLatestMsg());
          break;
        case MessageType.QUERY_ALL:
          write(ws, responseChainMsg());
          break;
          ``;
        case MessageType.RESPONSE_BLOCKCHAIN:
          handleBlockchainResponse(message);
          break;
      }
    });
  }
const write = (ws, message) => ws.send(JSON.stringify(message));
const broadcast = (message) => sockets.forEach((socket) => write(socket, message));
const queryChainLengthMsg = () => ({ 'type': MessageType.QUERY_LATEST, 'data': null });
const queryAllMsg = () => ({ 'type': MessageType.QUERY_ALL, 'data': null });
const responseChainMsg = () => ({
    'type': MessageType.RESPONSE_BLOCKCHAIN, 'data': JSON.stringify(getBlockchain())
});
const responseLatestMsg = () => ({
    'type': MessageType.RESPONSE_BLOCKCHAIN,
    'data': JSON.stringify([getLatestBlock()])
});
const initErrorHandler = (ws) => {
    const closeConnection = (myWs) => {
        console.log('connection failed to peer: ' + myWs.url);
        sockets.splice(sockets.indexOf(myWs), 1);
    };
    ws.on('close', () => closeConnection(ws));
    ws.on('error', () => closeConnection(ws));
};
const handleBlockchainResponse = (receivedBlocks) => {
    if (receivedBlocks.length === 0) {
        console.log('received block chain size of 0');
        return;
    }
    const latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];
    if (!isValidBlockStructure(latestBlockReceived)) {
        console.log('block structuture not valid');
        return;
    }
    const latestBlockHeld = getLatestBlock();
    if (latestBlockReceived.index > latestBlockHeld.index) {
        console.log('블록체인이 뒤에 있을 수 있습니다. 우리는 얻었다: '
            + latestBlockHeld.index + ' Peer got: ' + latestBlockReceived.index);
        if (latestBlockHeld.hash === latestBlockReceived.previousHash) {
            if (addBlockToChain(latestBlockReceived)) {
                broadcast(responseLatestMsg());
            }
        }
        else if (receivedBlocks.length === 1) {
            console.log('피어로부터 체인을 쿼리해야 합니다.');
            broadcast(queryAllMsg());
        }
        else {
            console.log('수신된 블록체인이 현재 블록체인보다 깁니다.');
            replaceChain(receivedBlocks);
        }
    }
    else {
        console.log('수신된 블록체인은 수신된 블록체인보다 길지 않습니다. 아무것도하지 마세요');
    }
};
const broadcastLatest = () => {
    broadcast(responseLatestMsg());
};
const connectToPeers = (newPeer) => {
    const ws = new WebSocket(newPeer);
    ws.on('open', () => {
        initConnection(ws);
    });
    ws.on('error', () => {
        console.log('연결에 실패');
    });
};
module.exports= { connectToPeers, broadcastLatest, initP2PServer, getSockets };