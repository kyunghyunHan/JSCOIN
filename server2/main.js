
const   bodyParser =require('body-parser') ;
const express  =require('express') ;
const cors = require("cors");
const {
    Block, generateNextBlock, generatenextBlockWithTransaction, generateRawNextBlock, getAccountBalance,
    getBlockchain, getMyUnspentTransactionOutputs, getUnspentTxOuts, sendTransaction
} =require('./blockchain') ;
const { getSockets, initConnection } = require("./p2p");
const {getTransactionPool} =require('./transactionPool') ;
const {getPublicFromWallet, initWallet} =require('./wallet') ;
const httpPort = parseInt(process.env.HTTP_PORT) || 3002;
const p2pPort = parseInt(process.env.P2P_PORT) || 6002;
const { sequelize } = require("./models");
/**이 서버를 사용하여 다음과 같은 걸 할거에요.

블록의 리스트 가져오기
새로운 블록을 만들기
노드 목록을 가져오거나 새로운 노드를 추가하기 curl명령어로도 노드를 제어할 수 있어요. */
sequelize
  .sync({ force: false })
  .then(() => {
    console.log("DB Ready");
    BlcokChainDB.findAll().then((bc) => {
      dbBlockCheck(bc);
    });
  })
  .catch((err) => {
    console.error(err);
  });

const initHttpServer = (myHttpPort) => {
    const app = express();
    app.use(cors());
    app.use(bodyParser.json());
    app.use((err, req, res, next) => {
        if (err) {
            res.status(400).send(err.message);
        }
    });
    app.get('/blocks', (req, res) => {
      console.log(getBlockchain());
        res.send(getBlockchain());
    });
    app.get('/unspentTransactionOutputs', (req, res) => {
        res.send(getUnspentTxOuts());
    });
    app.get('/myUnspentTransactionOutputs', (req, res) => {
        res.send(getMyUnspentTransactionOutputs());
    });
    app.post('/mineRawBlock', (req, res) => {
        if (req.body.data == null) {
            res.send('데이터 매개변수가 없습니다');
            return;
        }
        const newBlock = generateRawNextBlock(req.body.data);
        if (newBlock === null) {
            res.status(400).send('블록을 생성할 수 없습니다');
        }
        else {
            res.send(newBlock);
        }
    });
    app.post('/mineBlock', (req, res) => {
        const newBlock = generateNextBlock();
        if (newBlock === null) {
            res.status(400).send('블록을 생성할 수 없습니다');
        }
        else {
            res.send(newBlock);
        }
    });
    app.get('/balance', (req, res) => {
        const balance = getAccountBalance();
        res.send({ 'balance': balance });
        console.log(getAccountBalance())
    });
    app.get('/address', (req, res) => {
        const address = getPublicFromWallet();
        console.log(getPublicFromWallet())
        res.send({ 'address': address });
    });
    //지갑을 사용하기 위해 기능을 넣어 보죠.
    //위에서 보듯 사용자는 단지 주소와 코인금액만 제공하면 되요. 블럭체인의 노드가 나머지는 알아서 뿅.
    app.post('/mineTransaction', (req, res) => {
        const address = req.body.address;
        const amount = req.body.amount;
        try {
            const resp = generatenextBlockWithTransaction(address, amount);
            res.send(resp);
        }
        catch (e) {
            console.log(e.message);
            res.status(400).send(e.message);
        }
    });
    //새로운 HTTP 인터페이스가 하나 더 필요해요. POST타입의 /sendTransaction. 이를 이용해 wallet에 트랜젝션을 만들고 이 트랜젝션을 트랜젝션풀에 넣는 기능을 더할 거에요. 블럭체인에 새 트랜젝션을 포함시키고자 할 때, 이 인터페이스를 우선적으로 사용할 거에요.
    app.post('/sendTransaction', (req, res) => {
        try {
            const address = req.body.address;
            const amount = req.body.amount;
            if (address === undefined || amount === undefined) {
                throw Error('잘못된 주소 또는 금액');
            }
            const resp = sendTransaction(address, amount);
            res.send(resp);
        }
        catch (e) {
            console.log(e.message);
            res.status(400).send(e.message);
        }
    });
    app.get('/transactionPool', (req, res) => {
        res.send(getTransactionPool());
    });
    app.get("/peers", (req, res) => {
        let socketinfo = [];
        getSockets().forEach((S) => {
          socketinfo.push(S._socket.remoteAddress + " : " + S._socket.remotePort);
        });
        console.log(socketinfo.length);
        res.send(socketinfo);
      });
    
    app.post("/addPeers", (req, res) => {
        const WebSocket = require("ws");
        const peers = req.body.peers || [];
    
        const ws = new WebSocket(peers);
        ws.on("open", () => {
          initConnection(ws), res.send("Peer 연결완료");
        });
        ws.on("error", () => {
          res.send("Peer 연결실패");
        });
    
      });
    
    app.post('/stop', (req, res) => {
        res.send({ 'msg': 'stopping server' });
        process.exit();
    });
    app.listen(myHttpPort, () => {
        console.log('Listening http on port: ' + myHttpPort);
    });
};
initHttpServer(httpPort);
initWallet();


