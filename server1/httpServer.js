const http_port = process.env.HTTP_PORT || 3001;
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const {
  getBlocks,
  getVersion,
  checkAddBlock,
  nextBlock,
  dbBlockCheck,
  addBlock,
} = require("./chainedBlock");
const { getSockets, initConnection } = require("./p2pServer");
const { getPublicKeyFromWallet, initWallet } = require("./encryption");

const { sequelize } = require("./models");
const { BlcokChainDB } = require("./models");
const { CoinDB } = require("./models");

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

function initHttpServer() {

  const app = express();
  app.use(cors());
  app.use(express.json());

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

  app.get("/peers", (req, res) => {
    let socketinfo = [];
    getSockets().forEach((S) => {
      socketinfo.push(S._socket.remoteAddress + " : " + S._socket.remotePort);
    });
    console.log(socketinfo.length);
    res.send(socketinfo);
  });

  app.get("/", async (req, res) => {

    await BlcokChainDB.findAll()
      .then((bc) => {
        res.send(bc);
      })
      .catch((err) => {
        console.log(err);
        throw err;
      });
  });
  app.get("/1", async (req, res) => {
    await CoinDB.findOne({
      where: { Coin: 50 }
    })
      .then((bc) => {
        res.send(bc);
      })
      .catch((err) => {
        console.log(err);
        throw err;
      });
  });

  app.get("/Blocks", (req, res) => {

    res.send(getBlocks());
  });

  app.get("/version", (req, res) => {
    res.send(getVersion());
  });

  app.post("/mineBlock", (req, res) => {

    const data = req.body.data || ["데이터를 입력해주세요."];
    const block = nextBlock(data);

    const { sockets, broadcast, responseLatestMsg } = require("./p2pServer");

    if (checkAddBlock(block)) {
      res.send("블록생성 완료");
      console.log(addBlock);
    } else {
      res.send("블록생성 실패");
    }

    if (sockets.length > 0) {
      console.log("새블록 전송");
      broadcast(responseLatestMsg());
    }
  });

  app.post("/stop", (req, res) => {
    res.send("서버 종료");
    process.exit();
  });

  app.get("/address", (req, res) => {
    initWallet();
    const address = getPublicKeyFromWallet().toString();
    if (address != "") {
      res.send({ address: address });
    } else {
      res.send("주소가 없습니다.");
    }
  });



  app.get("/coinadd", async (req, res) => {
    try {
      const fulljam = await BlcokChainDB.findOne({
        where: {
          Coin: req.body.Coin,
        },
      });

      res.status(201).json({ success: true, fulljam });
      console.log(success);
    } catch (error) {
      console.error(error);
      return res.status(400).send(error);
    }
  });
  app.listen(http_port, () => {
    console.log(http_port + "번 포트에서 대기중...");
  });
}

initHttpServer();
