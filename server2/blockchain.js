const  CryptoJS =require('crypto-js') ;
const _ =require('lodash') ;
const { broadcastLatest, broadCastTransactionPool } =require( './p2p');
const { getCoinbaseTransaction, isValidAddress, processTransactions } =require('./transaction') ;
const { addToTransactionPool, getTransactionPool, updateTransactionPool } =require('./transactionPool') ;
const { hexToBinary } =require('./util') ;
const { createTransaction, findUnspentTxOuts, getBalance, getPrivateFromWallet, getPublicFromWallet } =require('./wallet') ;
/*Index: 블록체인에서 해당 블록의 순서
Data: 블록에 담긴 데이터
Timestamp: 타임스템프
Hash: sha256알고리즘으로 만들어진 해쉬값
previousHash: 이전 블록의 해쉬값. 앞의 블록에서 이미 정해지게 되죠.


*/
/**
 * 난이도difficulty를 만족하는 해시값을 찾기 위해서는 같은 블록에서 여러번 반복적으로 해시값을 계산해야해요. 
 * 이 때 nonce라는 값을 사용하죠. SHA256이라는 해시함수를 써서 매순간 다른 해시값을 찾아낼 수 있어요.
 *  ‘채굴(mining’이란 기본적으로 난이도를 만족하는 해시값을 찾기 위해 반복적으로 매번 다른 nonce값을 시도해 보는 과정을 의미해요. 
 * difficulty와 noce가 추가된 블록 클래스를 보시죠.


 */
class Block {
    constructor(index, hash, previousHash, timestamp, data, difficulty, nonce) {
        this.index = index;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.data = data;
        this.hash = hash;
        this.difficulty = difficulty;
        this.nonce = nonce;
    }
}
//유효한 private key는 32byte의 문자열
//유효한 public key는 ‘04’가 붙은 64byte 문자열
const genesisTransaction = {
    'txIns': [{ 'signature': '', 'txOutId': '', 'txOutIndex': 0 }],
    'txOuts': [{
            'address': '04bfcab8722991ae774db48f934ca79cfb7dd991229153b9f732ba5334aafcd8e7266e47076996b55a14bf9913ee3145ce0cfc1372ada8ada74bd287450313534a',
            'amount': 50
        }],
    'id': 'e655f6a5f26dc9b4cac6e46f52336428287759cf81ef5ff10854f69d68f43fa3'
};
//최초의 블록
const genesisBlock = new Block(0, '91a73664bc84c0baa1fc75ea6e4aa6d1d20c5df664c724e3159aefc2e1186627', '', 1465154705, [genesisTransaction], 0, 0);
let blockchain = [genesisBlock];
// Genesis 블록의 사용되지 않은 txOut은 시작 시 unspentTxOuts로 설정됩니다.
let unspentTxOuts = processTransactions(blockchain[0].data, [], 0);
const getBlockchain = () => blockchain;
const getUnspentTxOuts = () => _.cloneDeep(unspentTxOuts);
// txPool은 동시에 업데이트되어야 합니다.
const setUnspentTxOuts = (newUnspentTxOut) => {
    console.log('unspentTxouts 대체: %s', newUnspentTxOut);
    unspentTxOuts = newUnspentTxOut;
};
const getLatestBlock = () => blockchain[blockchain.length - 1];
//초

/**우리는 이제 주어진 difficulty값을 가지고 해시값을 찾고, 그 값이 유효한지 검증할 수 있게 되었어요. 
 * 하지만 difficulty값은 어떻게 정해야 할까요? 이를 위해서는 difficulty값을 계산하는 로직이 필요하겠네요.
 *  상수를 몇개 정의하는 걸로 시작해 보죠.
우리는 BLOCK_GENERATION_INTERVAL값은 10초, DIFFICULTY_ADJUSTMENT_INTERVAL값은 10블록 마다로 정할게요. 이 상수값들은 변하지 않으므로 하드코딩할게요. */
//BLOCK_GENERATION_INTERVAL: 블록은 얼마나 자주 채굴되는가(Bitcoin의 경우 10분 간격이죠.)
const BLOCK_GENERATION_INTERVAL = 10;
// DIFFICULTY_ADJUSTMENT_INTERVAL: 난이도difficulty는 얼마나 자주 조정되는가(Bitcoin은 2016블록마다 조정돼요.)
const DIFFICULTY_ADJUSTMENT_INTERVAL = 10;
/**만약 예상시간보다 실제 걸리는 시간이 두 배 이상 크거나 작다면 우리는 difficulty값을 조정함으로써 예상시간에 가까이 가고자 노력할 거에요.
 *  이렇게 난이노difficulty조정은 이루어지죠. 즉 채굴간격을 유지하기 위해 difficulty값을 조정하는 거죠. . */
const getDifficulty = (aBlockchain) => {
    const latestBlock = aBlockchain[blockchain.length - 1];
    if (latestBlock.index % DIFFICULTY_ADJUSTMENT_INTERVAL === 0 && latestBlock.index !== 0) {
        return getAdjustedDifficulty(latestBlock, aBlockchain);
    }
    else {
        return latestBlock.difficulty;
    }
};
const getAdjustedDifficulty = (latestBlock, aBlockchain) => {
    const prevAdjustmentBlock = aBlockchain[blockchain.length - DIFFICULTY_ADJUSTMENT_INTERVAL];
    const timeExpected = BLOCK_GENERATION_INTERVAL * DIFFICULTY_ADJUSTMENT_INTERVAL;
    const timeTaken = latestBlock.timestamp - prevAdjustmentBlock.timestamp;
    if (timeTaken < timeExpected / 2) {
        return prevAdjustmentBlock.difficulty + 1;
    }
    else if (timeTaken > timeExpected * 2) {
        return prevAdjustmentBlock.difficulty - 1;
    }
    else {
        return prevAdjustmentBlock.difficulty;
    }
};
const getCurrentTimestamp = () => Math.round(new Date().getTime() / 1000);
const generateRawNextBlock = (blockData) => {
    const previousBlock = getLatestBlock();
    const difficulty = getDifficulty(getBlockchain());
    const nextIndex = previousBlock.index + 1;
    const nextTimestamp = getCurrentTimestamp();
    const newBlock = findBlock(nextIndex, previousBlock.hash, nextTimestamp, blockData, difficulty);
    if (addBlockToChain(newBlock)) {
        broadcastLatest();
        return newBlock;
    }
    else {
        return null;
    }
};
// 지갑이 소유한 미사용 트랜잭션 출력을 가져옵니다.
const getMyUnspentTransactionOutputs = () => {
    return findUnspentTxOuts(getPublicFromWallet(), getUnspentTxOuts());
};
/**다음으로 우리는 트랜젝션 풀에 들어온 트랜젝션을 블럭체인 상의 블럭으로 만드는 작업을 할 거에요. 그리 어렵지 않아요. 노드가 블럭을 채굴하는 작업을 시작할 때 트랜젝션 풀로부터 트랜젝션을 받아 새로운 예비블럭에 추가해 담는 거죠. */
const generateNextBlock = () => {
    const coinbaseTx = getCoinbaseTransaction(getPublicFromWallet(), getLatestBlock().index + 1);
    const blockData = [coinbaseTx].concat(getTransactionPool());
    return generateRawNextBlock(blockData);
};
const generatenextBlockWithTransaction = (receiverAddress, amount) => {
    if (!isValidAddress(receiverAddress)) {
        throw Error('잘못된 주소');
    }
    if (typeof amount !== 'number') {
        throw Error('유효하지 않은 금액');
    }
    const coinbaseTx = getCoinbaseTransaction(getPublicFromWallet(), getLatestBlock().index + 1);
    const tx = createTransaction(receiverAddress, amount, getPrivateFromWallet(), getUnspentTxOuts(), getTransactionPool());
    const blockData = [coinbaseTx, tx];
    return generateRawNextBlock(blockData);
};

/**유효한 해시값을 찾기 위해서 우리는 nonce값을 증가시켜야 해요. 
 * 만족하는 값을 찾는 과정은 완벽하게 랜덤하게 이루어져요. 
 * 우리는 단지 ‘해시값을 찾을 때까지’ 반복문을 돌릴 수 있을 뿐이죠. */
const findBlock = (index, previousHash, timestamp, data, difficulty) => {
    let nonce = 0;
    while (true) {
        const hash = calculateHash(index, previousHash, timestamp, data, difficulty, nonce);
        if (hashMatchesDifficulty(hash, difficulty)) {
            return new Block(index, hash, previousHash, timestamp, data, difficulty, nonce);
        }
        nonce++;
    }
};
const getAccountBalance = () => {
    return getBalance(getPublicFromWallet(), getUnspentTxOuts());
};
const sendTransaction = (address, amount) => {
    const tx = createTransaction(address, amount, getPrivateFromWallet(), getUnspentTxOuts(), getTransactionPool());
    addToTransactionPool(tx, getUnspentTxOuts());
    broadCastTransactionPool();
    return tx;
};
const calculateHashForBlock = (block) => calculateHash(block.index, block.previousHash, block.timestamp, block.data, block.difficulty, block.nonce);
/**
 * 블록해쉬는 블록에서 가장 중요한 것 중 하나에요. 
 * 해쉬값은 블록이 가진 데이터를 기반으로 계산되죠. 
 * 즉 블록의 어떤 데이터라도 변하면 기존의 해쉬값은 무의미해지는 거죠.
 *  또 해쉬값은 해당 블록의 고유한 식별자로도 기능해요. 그래서 같은 인덱스를 가진 블록은 있을 수 있지만 해쉬값은 모두 달라요.

 */
const calculateHash = (index, previousHash, timestamp, data, difficulty, nonce) => CryptoJS.SHA256(index + previousHash + timestamp + data + difficulty + nonce).toString();
const isValidBlockStructure = (block) => {
    return typeof block.index === 'number'
        && typeof block.hash === 'string'
        && typeof block.previousHash === 'string'
        && typeof block.timestamp === 'number'
        && typeof block.data === 'object';
};

/**어떤 블록이 유효한 블록인지 검사하는 것은 매우 중요하겠죠. 특히 다른 노드로부터 받은 블록이라면 더더욱. 다음 항목들로 블록의 유효성을 검사할 거에요.

이전 블록보다 인덱스값이 1 클 것.
previousHash값이 이전블록의 hash값일 것.
hash값이 유효한 값일 것. 다음의 코드로 이를 검사할 수 있어요. */
const isValidNewBlock = (newBlock, previousBlock) => {
    if (!isValidBlockStructure(newBlock)) {
        console.log('유효하지 않은 블록 구조: %s', JSON.stringify(newBlock));
        return false;
    }
    if (previousBlock.index + 1 !== newBlock.index) {
        console.log('유효하지  않은index');
        return false;
    }
    else if (previousBlock.hash !== newBlock.previousHash) {
        console.log('유효하지  않은previoushash');
        return false;
    }
    else if (!isValidTimestamp(newBlock, previousBlock)) {
        console.log('유효하지 않은timestamp');
        return false;
    }
    else if (!hasValidHash(newBlock)) {
        return false;
    }
    return true;
};
/**챕터1에서 ‘옳은 체인’은 ‘가장 긴 체인’이라고 했던 거 기억하시나요? 이제 이 명제는 변해야만 해요. ‘difficulty가 가장 많이 누적된 체인’이 ‘옳은 체인’이죠. 다시 말하면 옳은 체인은 새로운 블록을 생성하기 위해 가장 많은 자원(resources)을 요구하는, 가장 오래 걸리는(hashRate*time) 체인이에요.

누적 난이도는 2를 difficulty값만큼 곱한 2^을 모두 더하여 계산돼요. 해시값을 2진수로 바꿨을 때 시작부분의 0의 갯수가 diffculty값이였던 거 기억하시죠? 예를 들면 난이도5와 난이도11은 각각 2의 5승, 2의 11승 만큼의 채굴시간이 걸린다고 보는 거죠. 따라서 아래 그림에서 Chain B가 ‘옳은 체인’이에요. */
const getAccumulatedDifficulty = (aBlockchain) => {
    return aBlockchain
        .map((block) => block.difficulty)
        .map((difficulty) => Math.pow(2, difficulty))
        .reduce((a, b) => a + b);
};
/**이 값은 난이도difficulty 조정과 관련하여 블록의 유효성을 검증하는데 사용될 거에요. 
 * timestamp값으로 블록이 정상적인 난이도 조정을 거친 블록인지 검증하죠. */
const isValidTimestamp = (newBlock, previousBlock) => {
    return (previousBlock.timestamp - 60 < newBlock.timestamp)
        && newBlock.timestamp - 60 < getCurrentTimestamp();
};


const hasValidHash = (block) => {
    if (!hashMatchesBlockContent(block)) {
        console.log('유효하지 않은 hash, got:' + block.hash);
        return false;
    }
    if (!hashMatchesDifficulty(block.hash, block.difficulty)) {
        console.log('블록 난이도가 만족되지 않습니다. 예상되는: ' + block.difficulty + 'got: ' + block.hash);
    }
    return true;
};
const hashMatchesBlockContent = (block) => {
    const blockHash = calculateHashForBlock(block);
    return blockHash === block.hash;
};
//블록의 해시값이 난이도difficulty를 만족하는지 확인하는 코드
const hashMatchesDifficulty = (hash, difficulty) => {
    const hashInBinary = hexToBinary(hash);
    const requiredPrefix = '0'.repeat(difficulty);
    return hash.startsWith(requiredPrefix);
};
/*
   
주어진 블록체인이 유효한지 확인합니다. 체인이 유효한 경우 사용되지 않은 txOuts를 반환합니다.
 특정 시점에 ’옳은’ 체인은 하나만 존재해야만 해요.
  (모든 블록이 정상적이라는 전제 아래) 일단 가장 긴 체인을 ‘옳은’ 체인으로 간주할게요.
 왜냐하면 모든 체인은 (이상적으로는) 동일해야 하고, 체인이 길다는 것은 다른 노드가 ‘아직’ 받지 못한 블록을 가지고 있다고 볼 수 있기 때문이죠.
언젠가는 모든 노드가 그 블록을 받아야 할 거에요. 그림.
 */

const isValidChain = (blockchainToValidate) => {
    console.log('isValidChain:');
    console.log(JSON.stringify(blockchainToValidate));
    const isValidGenesis = (block) => {
        return JSON.stringify(block) === JSON.stringify(genesisBlock);
    };
    if (!isValidGenesis(blockchainToValidate[0])) {
        
        return null;
    }
    /*
   체인의 각 블록을 검증합니다. 블록 구조가 유효하면 블록이 유효합니다.
      그리고 거래가 유효합니다
     */
    let aUnspentTxOuts = [];
    for (let i = 0; i < blockchainToValidate.length; i++) {
        const currentBlock = blockchainToValidate[i];
        if (i !== 0 && !isValidNewBlock(blockchainToValidate[i], blockchainToValidate[i - 1])) {
            return null;
        }
        aUnspentTxOuts = processTransactions(currentBlock.data, aUnspentTxOuts, currentBlock.index);
        if (aUnspentTxOuts === null) {
            console.log('(invalid transactions in blockchain)(블록체인의 잘못된 거래)');
            return null;
        }
    }
    return aUnspentTxOuts;
};
const addBlockToChain = (newBlock) => {
    if (isValidNewBlock(newBlock, getLatestBlock())) {
        const retVal = processTransactions(newBlock.data, getUnspentTxOuts(), newBlock.index);
        if (retVal === null) {
            console.log('블록은 트랜잭션 측면에서 유효하지 않습니다.');
            return false;
        }
        else {
            blockchain.push(newBlock);
            setUnspentTxOuts(retVal);
            updateTransactionPool(unspentTxOuts);
            return true;
        }
    }
    return false;
};
/**노드 사이에 통신이 있어야하는 것은 블록체인의 필수요소에요. 데이터의 ‘싱크’를 맞춰야 하기 때문이죠. 다음 룰이 노드 사이의 네트워크에 적용됨으로써 데이터 싱크를 맞추죠.

노드가 새 블록을 만들면 그것을 네트워크로 방출(발송,broadcast)해야한다.
노드 간에 연결될 때, 각자 지니고 있는 가장 마지막 블록이 무엇인지를 파악한다.
자기보다 긴 체인과 연결되면 상대가 가진 블록 중 내가 가진 블록 이후의 모든 블록을 추가하여 싱크를 맞춘다.
 */
const replaceChain = (newBlocks) => {
    const aUnspentTxOuts = isValidChain(newBlocks);
    const validChain = aUnspentTxOuts !== null;
    if (validChain &&
        getAccumulatedDifficulty(newBlocks) > getAccumulatedDifficulty(getBlockchain())) {
        console.log('Received blockchain is valid. Replacing current blockchain with received blockchain(수신된 블록체인이 유효합니다. 현재 블록체인을 받은 블록체인으로 교체)');
        blockchain = newBlocks;
        setUnspentTxOuts(aUnspentTxOuts);
        updateTransactionPool(unspentTxOuts);
        broadcast();
    }
    else {
        console.log('Received blockchain invalid(수신된 블록체인이 유효하지 않음)');
    }
};
const handleReceivedTransaction = (transaction) => {
    addToTransactionPool(transaction, getUnspentTxOuts());
};
module.exports= { Block, getBlockchain, getUnspentTxOuts, getLatestBlock, sendTransaction, generateRawNextBlock, generateNextBlock, generatenextBlockWithTransaction, handleReceivedTransaction, getMyUnspentTransactionOutputs, getAccountBalance, isValidBlockStructure, replaceChain, addBlockToChain,calculateHash};
