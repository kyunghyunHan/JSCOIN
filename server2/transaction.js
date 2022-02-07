const  CryptoJS =require('crypto-js') ;
const  ecdsa =require('elliptic') ;
const  _ =require('lodash') ;
const ec = new ecdsa.ec('secp256k1');
//코인베이스 트랜잭션(coinbase transaction)은 오직 아웃풋만 포함해요. 인풋은 없죠. 코인베이스 트랜잭션이 새로운 코인을 돌게 만드는 펌프?같은 역할을 할거에요. 코인베이스 아풋풋의 양을 50코인으로 정하죠.
const COINBASE_AMOUNT = 50;
class UnspentTxOut {
    constructor(txOutId, txOutIndex, address, amount) {
        this.txOutId = txOutId;
        this.txOutIndex = txOutIndex;
        this.address = address;
        this.amount = amount;
    }
}
//트랜잭션 인풋(txIn)은 코인이 어디로부터 왔는지에 대한 정보를 제공해요.
// 각각의 txIn은 이전의 output을 참조하고 서명을 통해 unlocked되요.
// 서명의 역할은 오직 public key과 한 쌍인 private key를 가진 사용자만이 트랜잭션을 만들수 있음을 보증하죠.
// 인풋은 보낸(보내진)코인을 실제로 소유했었던 발송자에대한 증거에요.

class TxIn {
}
//아웃풋은 코인을 어디로 보낼지에 대한 정보에요. 
//트랜잭션 아웃풋(txOut)은 주소와 코인의 양으로 구성되요. 주소는 ECDSA 퍼블릭키 값이에요. 
//이는 유저가 특정 코인에 접근하기 위해서는 해당 퍼블릭키에 대응하는 private key를 가지고 있어야 한다는 거죠.
class TxOut {
    constructor(address, amount) {
        this.address = address;
        this.amount = amount;
    }
}
/**
 * 트랜잭션 인풋txIn은 오직 private key로부터 생성된 signature값만을 가진다는 걸 주목해주세요. 절대 private key 그 자체를 가지지 않아요. 블록체인은 퍼블릭키public-key와 서명signature만을 가져요.

결과적으로 txIn은 코인을 풀고unlock txOut은 코인을 잠그는relock 역할을 해요.
 */
class Transaction {
}
//트랜잭션 아이디는 트랜잭션의 컨텐트로부터 계산된 해시값이에요. txIds의 signature는 해시에 포함되지 않지만, 그건 나중에 트랜잭션에 추가될 거에요.
const getTransactionId = (transaction) => {
    const txInContent = transaction.txIns
        .map((txIn) => txIn.txOutId + txIn.txOutIndex)
        .reduce((a, b) => a + b, '');
    const txOutContent = transaction.txOuts
        .map((txOut) => txOut.address + txOut.amount)
        .reduce((a, b) => a + b, '');
    return CryptoJS.SHA256(txInContent + txOutContent).toString();
};
const validateTransaction = (transaction, aUnspentTxOuts) => {
    if (!isValidTransactionStructure(transaction)) {
        return false;
    }
    if (getTransactionId(transaction) !== transaction.id) {
        console.log('잘못된 TX ID: ' + transaction.id);
        return false;
    }
    const hasValidTxIns = transaction.txIns
        .map((txIn) => validateTxIn(txIn, transaction, aUnspentTxOuts))
        .reduce((a, b) => a && b, true);
    if (!hasValidTxIns) {
        console.log('txIn 중 일부는 tx에서 유효하지 않습니다.: ' + transaction.id);
        return false;
    }

    //아웃풋의 코인 갯수와 인풋의 코인 갯수도 같아야만 해요. 아웃풋이 50개라면 인풋도 50개.
    const totalTxInValues = transaction.txIns
        .map((txIn) => getTxInAmount(txIn, aUnspentTxOuts))
        .reduce((a, b) => (a + b), 0);
    const totalTxOutValues = transaction.txOuts
        .map((txOut) => txOut.amount)
        .reduce((a, b) => (a + b), 0);
    if (totalTxOutValues !== totalTxInValues) {
        console.log('totalTxOutValues !== totalTxInValues in tx: ' + transaction.id);
        return false;
    }
    return true;
};
const validateBlockTransactions = (aTransactions, aUnspentTxOuts, blockIndex) => {
    const coinbaseTx = aTransactions[0];
    if (!validateCoinbaseTx(coinbaseTx, blockIndex)) {
        console.log('잘못된 코인베이스 거래: ' + JSON.stringify(coinbaseTx));
        return false;
    }
    // 중복 txIn을 확인하십시오. 각 txIn은 한 번만 포함될 수 있습니다.
    const txIns = _(aTransactions)
        .map((tx) => tx.txIns)
        .flatten()
        .value();
    if (hasDuplicates(txIns)) {
        return false;
    }
    // 코인베이스 거래를 제외한 모든 거래
    const normalTransactions = aTransactions.slice(1);
    return normalTransactions.map((tx) => validateTransaction(tx, aUnspentTxOuts))
        .reduce((a, b) => (a && b), true);
};
const hasDuplicates = (txIns) => {
    const groups = _.countBy(txIns, (txIn) => txIn.txOutId + txIn.txOutIndex);
    return _(groups)
        .map((value, key) => {
        if (value > 1) {
            console.log('중복 txIn: ' + key);
            return true;
        }
        else {
            return false;
        }
    })
        .includes(true);
};
/**코인베이스 트랜잭션은 당연히 노드의 첫 트랜잭션이고 블럭 채굴자 정보를 포함하죠. 블락을 발견한 댓가로 채굴자는 첫 코인베이스 트랜잭션의 아웃풋으로 코인 50개를 받을 거에요.

코인베이스 트랜잭션의 인풋에는 block의 height값을 넣을게요. 이 값이 코인베이스 트랜잭션의 고유한 ID값 역할을 할 거에요. 이 고유값이 없다면 코인 베이스 트랜잭션은 항상 같은 주소에 50코인을 발행하게 되죠.

코인베이스 트랜잭션의 유효성검증은 다른 트랜잭션이랑은 조금 다를 거에요. */
const validateCoinbaseTx = (transaction, blockIndex) => {
    if (transaction == null) {
        console.log('the first transaction in the block must be coinbase transaction');
        return false;
    }
    //ID도 확인해야 하고.
    if (getTransactionId(transaction) !== transaction.id) {
        console.log('invalid coinbase tx id: ' + transaction.id);
        return false;
    }
    if (transaction.txIns.length !== 1) {
        console.log('one txIn must be specified in the coinbase transaction');
        return;
    }
    if (transaction.txIns[0].txOutIndex !== blockIndex) {
        console.log('the txIn signature in coinbase tx must be the block height');
        return false;
    }
    if (transaction.txOuts.length !== 1) {
        console.log('invalid number of txOuts in coinbase transaction');
        return false;
    }
    if (transaction.txOuts[0].amount !== COINBASE_AMOUNT) {
        console.log('invalid coinbase amount in coinbase transaction');
        return false;
    }
    return true;
};
//txIns의 서명도 사용되지 않은 아웃풋을 잘 참조하고 있는지 확인해야 해요.
const validateTxIn = (txIn, transaction, aUnspentTxOuts) => {
    const referencedUTxOut = aUnspentTxOuts.find((uTxO) => uTxO.txOutId === txIn.txOutId && uTxO.txOutIndex === txIn.txOutIndex);
    if (referencedUTxOut == null) {
        console.log('referenced txOut not found: ' + JSON.stringify(txIn));
        return false;
    }
    const address = referencedUTxOut.address;
    const key = ec.keyFromPublic(address, 'hex');
    const validSignature = key.verify(transaction.id, txIn.signature);
    if (!validSignature) {
        console.log('invalid txIn signature: %s txId: %s address: %s', txIn.signature, transaction.id, referencedUTxOut.address);
        return false;
    }
    return true;
};
const getTxInAmount = (txIn, aUnspentTxOuts) => {
    return findUnspentTxOut(txIn.txOutId, txIn.txOutIndex, aUnspentTxOuts).amount;
};
const findUnspentTxOut = (transactionId, index, aUnspentTxOuts) => {
    return aUnspentTxOuts.find((uTxO) => uTxO.txOutId === transactionId && uTxO.txOutIndex === index);
};
const getCoinbaseTransaction = (address, blockIndex) => {
    const t = new Transaction();
    const txIn = new TxIn();
    txIn.signature = '';
    txIn.txOutId = '';
    txIn.txOutIndex = blockIndex;
    t.txIns = [txIn];
    t.txOuts = [new TxOut(address, COINBASE_AMOUNT)];
    t.id = getTransactionId(t);
    return t;
};
/**서명된 이후의 트랜잭션 내용이 수정될 수 없다는 사실은 매우 중요해요. 트랜잭션이 public해졌기 때문에 누구나 그 트랜잭션에 접근할 수 있죠. 
 * 아직 블록체인에 chaining되지 않은 사람까지도.

트랜잭션 인풋에 서명할 때 오직 txId만이 서명될 거에요.
 만약 트랜잭션의 어느 부분이라도 변경되면 txId값도 변경되고, 이는 해당 트랜잭션과 서명을 무효화하죠.

누군가가 트랜잭션에 변경을 시도하면 무슨 일이 일어나는지를 살펴보죠.

한 노드의 해커가 “10코인을 AAA주소에서 BBB주소로 보내”라는 내용을 가진 트랜잭션을 0x555라는 txId값과 함께 받았어요.
해커는 수신 주소를 BBB에서 CCC로 변경하고 이를 네트워크상에 포워딩해요. 이제 트랜잭션의 내용은 “10코인을 AAA주소에서 CCC주소로 보내”로 바뀌었어요.
하지만 수신 주소가 변경되면 기존 txId는 더 이상 유효하지 않아요. 유효한 txId는 0x567.. 같은 게 되겠죠.
서명signature 역시 기존 txId를 기반으로 만들어졌기 때문에 더 이상 유효하지 않게 되요.
따라서 변조된 트랜잭션은 다른 노드들에서 받아들여질 수 없죠.

*/
const signTxIn = (transaction, txInIndex, privateKey, aUnspentTxOuts) => {
    const txIn = transaction.txIns[txInIndex];
    const dataToSign = transaction.id;
    const referencedUnspentTxOut = findUnspentTxOut(txIn.txOutId, txIn.txOutIndex, aUnspentTxOuts);
    if (referencedUnspentTxOut == null) {
        console.log('could not find referenced txOut');
        throw Error();
    }
    const referencedAddress = referencedUnspentTxOut.address;
    if (getPublicKey(privateKey) !== referencedAddress) {
        console.log('trying to sign an input with private' +
            ' key that does not match the address that is referenced in txIn');
        throw Error();
    }
    const key = ec.keyFromPrivate(privateKey, 'hex');
    const signature = toHexString(key.sign(dataToSign).toDER());
    return signature;
};
/**트랜잭션 인풋은 항상 ‘보내지지지 않은 트랜잭션 아웃풋(Unspent transaction outputs, uTxO)’을 참조해야해요. 결국, 우리가 블록체인에서 코인을 갖는다는 것은, 보내지지지 않은 트랜잭션 아웃풋(Unspent transaction outputs, uTxO)의 목록을 가진다는 거죠. 이 아웃풋들의 퍼블릭키는 private key와 대응하구요.

트랜잭션 유효성 검증이란 측면에서 uTxO는 중요해요. uTxO는 현재 최신 상태의 블록체인에서 비롯되어야 하기 때문에 우리는 이 업데이트를 구현할 거에요.

uTxO의 데이터 구조는 아래와 같죠. */
/**새로운 블록이 더해질 때마다 uTxO(Unspent transaction outputs)을 업데이트해야해요. 새로운 트랜잭션은 기존의 트랜잭션 아웃풋 목록에 영향을 주고 새로운 아웃풋을 발생시키기 때문이죠. 이를 위해 새로 생성된 블록으로부터 new unspent transaction outputs을 순회하는 작업이 이루어질 거에요. 코드를 보죠. */
const updateUnspentTxOuts = (aTransactions, aUnspentTxOuts) => {
    const newUnspentTxOuts = aTransactions
        .map((t) => {
        return t.txOuts.map((txOut, index) => new UnspentTxOut(t.id, index, txOut.address, txOut.amount));
    })
        .reduce((a, b) => a.concat(b), []);
        //블록에서 이미 소비된 트랜잭션 아웃풋들에 대해서도 알아야 해요. 새 트랜잭션의 인풋을 검사하면 알 수 있어요.


    const consumedTxOuts = aTransactions
        .map((t) => t.txIns)
        .reduce((a, b) => a.concat(b), [])
        .map((txIn) => new UnspentTxOut(txIn.txOutId, txIn.txOutIndex, '', 0));
        //이미 소비된 아웃풋을 제거하고 이제 새로은 트랜잭션 아웃풋을 만들수 있게 되었어요.
    const resultingUnspentTxOuts = aUnspentTxOuts
        .filter(((uTxO) => !findUnspentTxOut(uTxO.txOutId, uTxO.txOutIndex, consumedTxOuts)))
        .concat(newUnspentTxOuts);
    return resultingUnspentTxOuts;
};
const processTransactions = (aTransactions, aUnspentTxOuts, blockIndex) => {
    if (!validateBlockTransactions(aTransactions, aUnspentTxOuts, blockIndex)) {
        console.log('invalid block transactions');
        return null;
    }
    return updateUnspentTxOuts(aTransactions, aUnspentTxOuts);
};
const toHexString = (byteArray) => {
    return Array.from(byteArray, (byte) => {
        return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('');
};
const getPublicKey = (aPrivateKey) => {
    return ec.keyFromPrivate(aPrivateKey, 'hex').getPublic().encode('hex');
};
const isValidTxInStructure = (txIn) => {
    if (txIn == null) {
        console.log('txIn is null');
        return false;
    }
    else if (typeof txIn.signature !== 'string') {
        console.log('invalid signature type in txIn');
        return false;
    }
    else if (typeof txIn.txOutId !== 'string') {
        console.log('invalid txOutId type in txIn');
        return false;
    }
    else if (typeof txIn.txOutIndex !== 'number') {
        console.log('invalid txOutIndex type in txIn');
        return false;
    }
    else {
        return true;
    }
};
const isValidTxOutStructure = (txOut) => {
    if (txOut == null) {
        console.log('txOut is null');
        return false;
    }
    else if (typeof txOut.address !== 'string') {
        console.log('invalid address type in txOut');
        return false;
    }
    else if (!isValidAddress(txOut.address)) {
        console.log('invalid TxOut address');
        return false;
    }
    else if (typeof txOut.amount !== 'number') {
        console.log('invalid amount type in txOut');
        return false;
    }
    else {
        return true;
    }
};
//트랜잭션은 정의된 방식을 따라야만 해요.
const isValidTransactionStructure = (transaction) => {
    if (typeof transaction.id !== 'string') {
        console.log('transactionId missing');
        return false;
    }
    if (!(transaction.txIns instanceof Array)) {
        console.log('invalid txIns type in transaction');
        return false;
    }
    if (!transaction.txIns
        .map(isValidTxInStructure)
        .reduce((a, b) => (a && b), true)) {
        return false;
    }
    if (!(transaction.txOuts instanceof Array)) {
        console.log('invalid txIns type in transaction');
        return false;
    }
    if (!transaction.txOuts
        .map(isValidTxOutStructure)
        .reduce((a, b) => (a && b), true)) {
        return false;
    }
    return true;
};
// valid address is a valid ecdsa public key in the 04 + X-coordinate + Y-coordinate format
const isValidAddress = (address) => {
    if (address.length !== 130) {
        console.log(address);
        console.log('invalid public key length');
        return false;
    }
    else if (address.match('^[a-fA-F0-9]+$') === null) {
        console.log('public key must contain only hex characters');
        return false;
    }
    else if (!address.startsWith('04')) {
        console.log('public key must start with 04');
        return false;
    }
    return true;
};
module.exports= { processTransactions, signTxIn, getTransactionId, isValidAddress, validateTransaction, UnspentTxOut, TxIn, TxOut, getCoinbaseTransaction, getPublicKey, hasDuplicates, Transaction };

/**코인을 보낼 때 사용자는 트랜잭션 인풋이니 아웃풋이니 알 필요가 없다고 했죠. 그럼 이 사용자 A가 단 한번의 트랜잭션으로 그가 가진 50코인 중 단지 10코인만 B에게 보내고 싶다면 어떻게 해야 할까요? 방법은 10코인은 B에게 보내고 나머지 40코인은 그 자신에게 돌려보내(back)는 거죠. 전체 트랜잭션 아웃풋은 항상 소진(spent)되어야 하고, 만약 부분으로 나누고 싶다면 새로운 아웃풋을 생성함으로 가능해요. 그림을 보시죠.
 * 
 * 좀 더 복잡한 트랜잭션을 시도해 보죠.

User C에겐 코인이 없었어요
User C가 3트랜잭션으로 10, 20, 30코인을 차례로 받았어요
User C는 55코인을 user D에게 보내길 원해요. 트랜잭션은 어떻게 이루어져야 할까요?
이 경우 3번에 걸친 아웃풋이 모두 사용되어야 해요. 55코인은 D에게 보내고 5는 자신에게 back.
 */