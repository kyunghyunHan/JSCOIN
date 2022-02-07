const fs = require("fs");
const ecdsa = require("elliptic");
const ec = new ecdsa.ec("secp256k1");

const privateKeyLocation =
  "server1/wallet/" + (process.env.PRIVATE_KEY || "default");
const privateKeyFile = privateKeyLocation + "/private_key";

function initWallet() {
  if (fs.existsSync(privateKeyFile)) {
    console.log("privateKey 경로 : " + privateKeyFile);
    return;
  }
  if (!fs.existsSync("server1/wallet/")) {
    fs.mkdirSync("server1/wallet/");
  }
  if (!fs.existsSync(privateKeyLocation)) {
    fs.mkdirSync(privateKeyLocation);
  }
  if (!fs.existsSync(privateKeyFile)) {
    console.log(`privateKey 생성중`);
    const newPrivateKey = generatePrivateKey();
    fs.writeFileSync(privateKeyFile, newPrivateKey);
    console.log(`privateKey 생성완료`);
  }
}

function generatePrivateKey() {
  const keyPair = ec.genKeyPair();
  const privateKey = keyPair.getPrivate();
  return privateKey.toString(16);
}

function getPrivateKeyFromWallet() {
  const buffer = fs.readFileSync(privateKeyFile, "utf8");
  return buffer.toString();
}

function getPublicKeyFromWallet() {
  const privateKey = getPrivateKeyFromWallet();
  const key = ec.keyFromPrivate(privateKey, "hex");
  return key.getPublic().encode("hex");
}

module.exports = { getPublicKeyFromWallet, initWallet };
