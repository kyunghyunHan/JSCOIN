// const WebSocket = require('ws')
// const wsPORT = process.env.WS_PORT || 6008
// const {addBlockToChain, Block, getBlockchain, getLatestBlock, isValidBlockStructure, replaceChain,calculateHash} =require('./blockchain') ;
// //소켓에 주소를 넣을 공간 마련
// let sockets = []
// function getSockets(){ return sockets }
// function broadcastLatest(message) {
//     sockets.forEach((socket) => {
//       write(socket, message);
//     });
//   }
  
// const MessageAction = {
//     QUERY_LAST:0,
//     QUERY_ALL:1,
//     RESPONSE_BLOCK:2,
// }
// //메세지를 받앗을떄 타입에 따라 함수 실행
// function initMessageHandler(ws){
//     ws.on("message",data => {
//         const message = JSON.parse(data)
//         switch(message.type){
//             case MessageAction.QUERY_LAST:
//                 write(ws,responseLastMsg()) 
//             break;
//             case MessageAction.QUERY_ALL://
//                 write(ws,responseBlockMsg())
//             break;
//             case MessageAction.RESPONSE_BLOCK:
//                 handleBlockResponse(message)
//             break;
//         }
//     })
// }

// function queryAllMsg(){
//     return {
//         type:MessageAction.QUERY_ALL,
//         data:null
//     }
// }


// function queryBlockMsg(){
//     return {
//         type:MessageAction.QUERY_LAST,
//         data:null
//     }
// }

// function responseLastMsg(){
//     return {
//         type:MessageAction.RESPONSE_BLOCK,
//         data:JSON.stringify([getLatestBlock()]) 
//     }
// }

// function responseBlockMsg(){
//     return {
//         type:MessageAction.RESPONSE_BLOCK,
//         data:JSON.stringify(getBlockchain())
//     }
// }

// function handleBlockResponse(message){
//     const receivedBlocks = JSON.parse(message.data) 
//     const lastBlockReceived = receivedBlocks[receivedBlocks.length - 1] 
//     const lastBlockHeld = getLatestBlock() 

//     if (lastBlockReceived.header.index > lastBlockHeld.header.index) {
//         console.log(
//             "블록의 갯수 \n" +
//             `내가 받은 블록의 index 값 ${lastBlockReceived.header.index}\n` +
//             `내가 가지고있는 블럭의 index 값 ${lastBlockHeld.header.index}\n`
//         )
        

//         if (calculateHash(lastBlockHeld) === lastBlockReceived.header.previousHash) {//받은 블록 중 마지막 블록의 이전해시값이 내 마지막 블록으로 만들어진 암호화값이 같을떄
//             console.log(`마지막 하나만 비어있는경우에는 하나만 추가합니다.`)
//             if (addBlockToChain(lastBlockReceived)) {
//                 broadcast(responseLastMsg())
//             }
//         } else if (receivedBlocks.length === 1) {//받은 블록의 길이가 1일 때
//             console.log(`피어로부터 블록을 연결해야합니다!`)
//             broadcast(queryAllMsg())
//         } else {//많이 차이가 날 때
//             console.log(`블럭을 최신화를 진행합니다.`)
//             replaceChain(receivedBlocks)
//         }

//     } else {
//         console.log('블럭이 이미 최신화입니다.')
//     }
// }

// function initErrorHandler(ws){
//     ws.on("close",()=>{ closeConnection(ws) })
//     ws.on("error",()=>{ closeConnection(ws) })
// }

// function closeConnection(ws){
//     console.log(`Connection close ${ws.url}`)
//     sockets.splice(sockets.indexOf(ws),1)
// }

// //서버의 역활
// //포트를 설정하므로 웹소켓 서버를 개설하는코드
// function wsInit(){
//     const server = new WebSocket.Server({ port:wsPORT})
//     server.on("connection",(ws)=>{
//         console.log('ws는 과연 무엇일까요?')
//         console.log(ws)
//         init(ws)

//     })
// }

// function write(ws,message){ ws.send(JSON.stringify(message)) }
// //연결된 모든 소켓에세 메세지 전송
// function broadcast(message){//
//     sockets.forEach( socket => {
//         write(socket,message)
//     })
// }
// //클라이언트에서 웹소켓에 접속
// function connectionToPeers(newPeers){
//     newPeers.forEach(peer=>{ 
       
//         const ws = new WebSocket(peer)//클라이언트가 접속해서 작동을 할떄
//         ws.on("open",()=>{ init(ws) })
//         ws.on("error",()=>{  console.log("connection failed") })
//     })
// }

// function init(ws){
//     sockets.push(ws)
//     initMessageHandler(ws)
//     initErrorHandler(ws)
//     write(ws,queryBlockMsg())
// }

// module.exports = {
//     wsInit,
//     getSockets,
//     broadcastLatest,
//     responseLastMsg,
//     connectionToPeers,
    
// }

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
          write(ws, responseAllChainMsg());
          break;
          ``;
        case MessageType.RESPONSE_BLOCKCHAIN:
          handleBolckChainResponse(message);
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
    'data': JSON.stringify(getLatestBlock())
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