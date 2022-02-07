// const ecdsa = require('elliptic');
// const ec = ecdsa.ec("secp256k1")
// // console.log(ec)

// // //키를 만드는 방법
// // console.log(ec.genKeyPair())
// // console.log(ec.genKeyPair().getPrivate().toString(16))

// function generatorPrivateKey(){
//     //랜덤하게 글자를 만들어주는 행위임.
//     const KeyPair = ec.genKeyPair()
//     const privateKey =KeyPair.getPrivate()
//     return privateKey.toString(16).toUpperCase()
// }

// console.log(generatorPrivateKey())

// const fs = require('fs')//내장객체
// const privateKeyLocation = "wallet/"+( process.env.PRIVATE_KEY || "default")//환경변수 사용
// //파일명
// // const privateFile = privateKeyLocation + "/private_key"
// const privateFile = `${privateKeyLocation}/private_key`

// function initWallet(){
//     //console.log(fs.existsSync('wallet/'))//true false 반환함
//     if(!fs.existsSync('wallet/')){
//         //폴더를 생성하는 코드를 작성해주면 된다.
//             fs.mkdirSync("wallet/")
//     }
//     if(!fs.existsSync(privateKeyLocation)){
//         //폴더를 생성하는 코드를 작성해주면 된다.
//             fs.mkdirSync(privateKeyLocation)
//     }
//     if(!fs.existsSync(privateFile)){
//         //파일이 없다면 true이고 있으면 false임
//         console.log(`주소값 키값을 생성중입니다.`)
//         const newPrivateKey = generatorPrivateKey()
//         fs.writeFileSync(privateFile,newPrivateKey)
//         //첫번째 인자값은 경로+파일명, 넣을 내용들
//         console.log(`개인키 생성이 완료되었습니다.`)
        
//         fs.mkdirSync(privateKeyLocation)
//     }
    
// }
// initWallet()

// //파일을 읽어서 출력해주느 함수 만들기
// function getPrivateFromWallet(){
//     const buffer = fs.readFileSync(privateFile)
//     //console.log(buffer.toString())//toString()붙이면 우리가 알아들을 수 있는 결과물로 출력한다.
//     return buffer.toString()
// }

// getPrivateFromWallet()

// //공개키(지갑주소) 
// // 비밀키(transaction)인증서라고 생각하면 편함

// //비밀키를 조작해서 공개키를 만드는 과정을 만듦. 컴퓨터를 사용해서 복호화 가능하게 함 
// //근데 원래 복호화가 안되도록 하는게 맞음.


// function getPublicFromWallet(){
//     const privateKey = getPrivateFromWallet();
//     const key = ec.keyFromPrivate(privateKey,"hex")
//     return key.getPublic().encode("hex")
// }

// console.log(getPublicFromWallet())
// console.log('--------------')
// console.log(getPrivateFromWallet())

// //AWS pem도 비슷한 인증방식임. RSA인증방식

// module.exports={
//     initWallet,
//     getPrivateFromWallet,
//     getPublicFromWallet,
    
// }



const { ec } =require('elliptic');
const { existsSync, readFileSync, writeFileSync } =require ('fs');
const _ =require ('lodash');
const { getPublicKey, getTransactionId, signTxIn, Transaction, TxIn, TxOut } =require ('./transaction');
const EC = new ec('secp256k1');
// private key를 암호화하지는 않은 채로 node/wallet/private_key 이 경로에 만들도록 하죠.
const privateKeyLocation = process.env.PRIVATE_KEY || "server2/wallet/private_key";
/**wallet 인터페이스를 만드는 거에요. 엔드유저는

private key를 가진 지갑(wallet)을 만들 수 있어야 하고
지갑에 잔액을 볼 수 있어야 하고
코인을 다른 노드로 보낼 수 있어야 해요.
txIns나 txOut같은 것들이 어떻게 작동하는지 엔드유저는 알 필요가 없어요. 비트코인처럼 어떤 노드로 코인을 보내고, 또 코인을 받을 나만의 주소를 가질 수 있으면 되는 거죠. */
const getPrivateFromWallet = () => {
    const buffer = readFileSync(privateKeyLocation, 'utf8');
    return buffer.toString();
};
//이미 살펴봤듯이 private key로부터 public key(=address, 주소의 역할)를 만들어 낼 거에요.
// wallet은 오직 하나의 private key만을 가져야 하고 이로부터 pulic하게 접근가능한 address를 가진 지갑을 만들 거에요.
const getPublicFromWallet = () => {
    const privateKey = getPrivateFromWallet();
    const key = EC.keyFromPrivate(privateKey, 'hex');
    return key.getPublic().encode('hex');
};
const generatePrivateKey = () => {
    const keyPair = EC.genKeyPair();
    const privateKey = keyPair.getPrivate();
    return privateKey.toString(16);
};
const initWallet = () => {
    // let's not override existing private keys
    if (existsSync(privateKeyLocation)) {
        return;
    }
    const newPrivateKey = generatePrivateKey();
    writeFileSync(privateKeyLocation, newPrivateKey);
    console.log('생성된 개인 키가 있는 새 지갑 : %s', privateKeyLocation);
};
const deleteWallet = () => {
    if (existsSync(privateKeyLocation)) {
        unlinkSync(privateKeyLocation);
    }
};

/**이 아웃풋 목록은 당연히 당신만의 private key와 매칭된 public address값을 가지고 있죠.

그럼 ‘잔고’계산은 참 쉽겠죠잉? 걍 ‘쓰이지 않은 트랜잭션 아웃풋(unspent transaction outputs)’을 다 더해버리면 되는 거죠. */
const getBalance = (address, unspentTxOuts) => {
    return _(findUnspentTxOuts(address, unspentTxOuts))
        .map((uTxO) => uTxO.amount)
        .sum();
};
const findUnspentTxOuts = (ownerAddress, unspentTxOuts) => {
    return _.filter(unspentTxOuts, (uTxO) => uTxO.address === ownerAddress);
};
//코드로 확인해 보죠. 먼저 트랜잭션 인풋을 만들어야 해요. 이를 위해 ‘소진되지 않은 트랜잭션 아웃(unspent transaction outputs)’ 목록을 순회하며 우리가 원하는 금액이 될 때까지 반복문을 돌리죠.
const findTxOutsForAmount = (amount, myUnspentTxOuts) => {
    let currentAmount = 0;
    const includedUnspentTxOuts = [];
    for (const myUnspentTxOut of myUnspentTxOuts) {
        includedUnspentTxOuts.push(myUnspentTxOut);
        currentAmount = currentAmount + myUnspentTxOut.amount;
        if (currentAmount >= amount) {
            const leftOverAmount = currentAmount - amount;
            return { includedUnspentTxOuts, leftOverAmount };
        }
    }
    const eMsg = '사용 가능한 미사용 트랜잭션 출력에서 ​​트랜잭션을 생성할 수 없습니다..' +
        ' 필요금액:' + amount + '. 사용 가능한 미사용TxOut:' + JSON.stringify(myUnspentTxOuts);
    throw Error(eMsg);
};
//다음으로 두 개의 txOuts를 만들어야 해요. 하나는 보낼 것. 다른 하나는 다시 back할 것. 만약 txIns가 보낼 금액과 같다면 leftOverAmount값은 0이므로 back을 위한 트랜잭션은 만들지 않아도 되죠.
const createTxOuts = (receiverAddress, myAddress, amount, leftOverAmount) => {
    const txOut1 = new TxOut(receiverAddress, amount);
    if (leftOverAmount === 0) {
        return [txOut1];
    }
    else {
        const leftOverTx = new TxOut(myAddress, leftOverAmount);
        return [txOut1, leftOverTx];
    }
};
const filterTxPoolTxs = (unspentTxOuts, transactionPool) => {
    const txIns = _(transactionPool)
        .map((tx) => tx.txIns)
        .flatten()
        .value();
    const removable = [];
    for (const unspentTxOut of unspentTxOuts) {
        const txIn = _.find(txIns, (aTxIn) => {
            return aTxIn.txOutIndex === unspentTxOut.txOutIndex && aTxIn.txOutId === unspentTxOut.txOutId;
        });
        if (txIn === undefined) {
        }
        else {
            removable.push(unspentTxOut);
        }
    }
    return _.without(unspentTxOuts, ...removable);
};
const createTransaction = (receiverAddress, amount, privateKey, unspentTxOuts, txPool) => {
    console.log('txPool: %s', JSON.stringify(txPool));
    const myAddress = getPublicKey(privateKey);
    const myUnspentTxOutsA = unspentTxOuts.filter((uTxO) => uTxO.address === myAddress);
    const myUnspentTxOuts = filterTxPoolTxs(myUnspentTxOutsA, txPool);
    // filter from unspentOutputs such inputs that are referenced in pool
    const { includedUnspentTxOuts, leftOverAmount } = findTxOutsForAmount(amount, myUnspentTxOuts);
    //코드에서 보이듯이, leftOverAmount는 나중에 자신에게 다시 back할 금액이에요. 소진되지 않은 트랜잭션 아웃풋을 가진 만큼 트랜책션 txIns를 만들어낼 수 있어요.
    const toUnsignedTxIn = (unspentTxOut) => {
        const txIn = new TxIn();
        txIn.txOutId = unspentTxOut.txOutId;
        txIn.txOutIndex = unspentTxOut.txOutIndex;
        return txIn;
    };
    const unsignedTxIns = includedUnspentTxOuts.map(toUnsignedTxIn);
    //마지막으로 트랜잭션id값을 생성하고 txIns에 서명하면 끝.


    const tx = new Transaction();
    tx.txIns = unsignedTxIns;
    tx.txOuts = createTxOuts(receiverAddress, myAddress, amount, leftOverAmount);
    tx.id = getTransactionId(tx);
    tx.txIns = tx.txIns.map((txIn, index) => {
        txIn.signature = signTxIn(tx, index, privateKey, unspentTxOuts);
        return txIn;
    });
    return tx;
};
module.exports= { createTransaction, getPublicFromWallet, getPrivateFromWallet, getBalance, generatePrivateKey, initWallet, deleteWallet, findUnspentTxOuts };