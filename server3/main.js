const bodyParser = require("body-parser");
const express = require("express");
const cors = require("cors");
const _ = require("lodash");
const BC = require("./blockchain");
const P2P = require("./p2p");
const TX = require("./transaction");
const TP = require("./transactionPool");
const WALLET = require("./wallet");

const httpPort = parseInt(process.env.HTTP_PORT) || 3003;
const p2pPort = parseInt(process.env.P2P_PORT) || 6003;

const initHttpServer = (httpPort) => {
  const app = express();
  app.use(cors());
  app.use(bodyParser.json());

  app.use((err, req, res, next) => {
    if (err) {
      res.status(400).send(err.message);
    }
  });

  app.get("/blocks", (req, res) => {
    console.log(BC.getBlockchain());
    res.send(BC.getBlockchain());
  });

  app.get("/block/:hash", (req, res) => {
    const block = _.find(BC.getBlockchain(), { hash: req.params.hash });
    res.send(block);
  });

  app.get("/transaction/:id", (req, res) => {
    const tx = _(BC.getBlockchain())
      .map((blocks) => blocks.data)
      .flatten()
      .find({ id: req.params.id });
    res.send(tx);
  });

  app.get("/address/:address", (req, res) => {
    const unspentTxOuts = _.filter(
      BC.getUnspentTxOuts(),
      (uTxO) => uTxO.address === req.params.address
    );
    res.send({ unspentTxOuts: unspentTxOuts });
  });

  app.get("/unspentTransactionOutputs", (req, res) => {
    res.send(BC.getUnspentTxOuts());
  });

  app.get("/myUnspentTransactionOutputs", (req, res) => {
    res.send(BC.getMyUnspentTransactionOutputs());
  });

  app.post("/mineRawBlock", (req, res) => {
    if (req.body.data == null) {
      res.send("data parameter is missing");
      return;
    }
    const newBlock = BC.generateRawNextBlock(req.body.data);
    if (newBlock === null) {
      res.status(400).send("could not generate block");
    } else {
      res.send(newBlock);
    }
  });

  app.post("/mineBlock", (req, res) => {
    const newBlock = BC.generateNextBlock();
    if (newBlock === null) {
      res.status(400).send("can't mine");
    } else {
      res.send(newBlock);
    }
  });

  app.get("/balance", (req, res) => {
    const balance = BC.getAccountBalance();
    res.send({ balance: balance });
  });

  app.get("/address", (req, res) => {
    const address = WALLET.getPublicFromWallet();
    res.send({ address: address });
  });

  app.post("/mineTransaction", (req, res) => {
    const address = req.body.address;
    const amount = req.body.amount;
    try {
      const resp = BC.generatenextBlockWithTransaction(address, amount);
      res.send(resp);
    } catch (e) {
      console.log(e.message);
      res.status(400).send(e.message);
    }
  });

  app.post("/sendTransaction", (req, res) => {
    try {
      const address = req.body.address;
      const amount = parseInt(req.body.amount);
      if (address === undefined || amount === undefined) {
        throw Error("에러 발생");
      }
      const resp = BC.sendTransaction(address, amount);
      res.send(resp);
    } catch (e) {
      console.log(e.message);
      res.status(400).send(e.message);
    }
  });

  app.get("/transactionPool", (req, res) => {
    res.send(TP.getTransactionPool());
  });

  app.get("/peers", (req, res) => {
    res.send(
      P2P.getSockets().map(
        (s) => s._socket.remoteAddress + ":" + s._socket.remotePort
      )
    );
  });

  app.post("/addPeer", (req, res) => {
    P2P.connectToPeers(req.body.peer);
    res.send();
  });

  app.post("/stop", (req, res) => {
    res.send({ msg: "stopping server" });
    process.exit();
  });

  app.listen(httpPort, () => {
    console.log(httpPort + "포트에서 대기중..");
  });
};

initHttpServer(httpPort);
P2P.initP2PServer(p2pPort);
WALLET.initWallet();
