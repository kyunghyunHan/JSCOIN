const _ =require('lodash') ;
const { validateTransaction } =require('./transaction');

/**이 챕터에서 우리는 트랜잭션 릴레이를 구현할 거에요. 트랜잭션 릴레이란 아직 블럭체인에 포함되지 않은 트랜잭션들을 포함시키는 작업을 의미하죠. 비트코인에서는 아직 블럭체인에 포함되지 않은 트랜젝션을 unconfirmed transaction이라고 불러요. 누군가 블럭체인에 트랜잭션을 포함시키고자 할 때(코인을 누군가에게 보낸다던가), 그는 트랜젝션을 네트워크에 발송broadcast하고, 다른 노드들이 블럭체인에 그 트랜잭션을 포함시키길 기대하죠. 이 기능은 암호화폐에서 매우 중요해요. 왜냐하면 당신이 어떤 트랜잭션을 블럭체인에 포함시키기 위해 반드시 어떤 블럭을 직접 채굴해야만 하는 건 아니거든요. 결국 노드들은 두가지 다른 타입의 데이터를 공유하게 되죠.

블럭체인의 현 상태(블럭체인에 이미 포함되어 있는 블럭과 트랜젝션들)
unconfirmed transactions(아직 블럭체인에 포함되지 않은 트랜젝션들) */
/**우리는 트랜젝션 풀(transaction pool)에 아직 블럭체인에 포함되지 않은 트랜젝션들을 저장할 거에요. 비트코인에는 mempool이라는게 있죠. 트랜젝션 풀은 아직 블럭체인에 포함되지 않은 모든 트랜젝션들을 저장할 하나의 저장소역할을 할 거에요. 이를 위해 배열을 쓰도록 하죠. */
let transactionPool = [];
const getTransactionPool = () => {
    return _.cloneDeep(transactionPool);
};
const addToTransactionPool = (tx, unspentTxOuts) => {
    if (!validateTransaction(tx, unspentTxOuts)) {
        throw Error('풀에 잘못된 tx를 추가하려고 합니다.');
    }
    if (!isValidTxForPool(tx, transactionPool)) {
        throw Error('풀에 잘못된 tx를 추가하려고 합니다.');
    }
    console.log('txPool에 추가: %s', JSON.stringify(tx));
    transactionPool.push(tx);
};
const hasTxIn = (txIn, unspentTxOuts) => {
    const foundTxIn = unspentTxOuts.find((uTxO) => {
        return uTxO.txOutId === txIn.txOutId && uTxO.txOutIndex === txIn.txOutIndex;
    });
    return foundTxIn !== undefined;
};
/**트랜잭션과 함께 새 블럭이 블록체인에 추가되었으므로, 기존이 트랜젝션 풀은 새로고침될 필요가 있죠. 어떤 새로운 블럭이 풀 안의 어떤 트랜잭션을 무효하게 만들 트랜젝션을 포함할 수도 있어요. 예를 들면,

풀에 이미 존재하던 트랜젝션이 다시 추가되었다(자신에 의해서건 다른 노드에 의해서건)
어떤 트랜젝션에서는 소진되지 않은 트랜젝션 아웃풋이 다른 트랜젝션에서는 소진되어 있는 경우 트랜젝션은 다음 코드에 의해 업데이트될 거에요. */
const updateTransactionPool = (unspentTxOuts) => {
    const invalidTxs = [];
    for (const tx of transactionPool) {
        for (const txIn of tx.txIns) {
            if (!hasTxIn(txIn, unspentTxOuts)) {
                invalidTxs.push(tx);
                break;
            }
        }
    }
    if (invalidTxs.length > 0) {
        console.log('txPool에서 다음 트랜잭션 제거: %s', JSON.stringify(invalidTxs));
        transactionPool = _.without(transactionPool, ...invalidTxs);
    }
};
const getTxPoolIns = (aTransactionPool) => {
    return _(aTransactionPool)
        .map((tx) => tx.txIns)
        .flatten()
        .value();
};
/**peer들이 어떤 트랜잭션을 보내건 간에, 우리는 그 트랜젝션을 풀에 더하기 전에 유효성 검사를 해야만 하겠죠. 이미 다룬 모든 트랜젝션 검사 룰이 적용되요. 트랜젝션의 포맷, 인풋과 아웃풋, 서명 등등. In addition to the existing rules, we add a new rule: a transaction cannot be added to the pool if any of the transaction inputs are already found in the existing transaction pool. This new rule is embodied in the following code: 그리고 새로운 룰 하나가 더 필요해요. ‘만약 추가될 트랜젝션의 어느 input이라도 기존 트랜젝션풀에 있는 것과 일치한다면 해당 트랜젝션은 추가될 수 없다’ 다음 코드가 이를 위한 거에요. */
const isValidTxForPool = (tx, aTtransactionPool) => {
    const txPoolIns = getTxPoolIns(aTtransactionPool);
    const containsTxIn = (txIns, txIn) => {
        return _.find(txPoolIns, ((txPoolIn) => {
            return txIn.txOutIndex === txPoolIn.txOutIndex && txIn.txOutId === txPoolIn.txOutId;
        }));
    };
    for (const txIn of tx.txIns) {
        if (containsTxIn(txPoolIns, txIn)) {
            console.log('txPool에서 이미 txIn을 찾았습니다.');
            return false;
        }
    }
    return true;
};
module.exports= { addToTransactionPool, getTransactionPool, updateTransactionPool };