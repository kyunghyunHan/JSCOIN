import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Row, Col, Card, Input } from "antd";
import ButtonGroup from '@mui/material/ButtonGroup';
import Button from '@mui/material/Button';


function Port3() {
  const [blockData, setBlockData] = useState("");
  const [peer, setPeer] = useState("");
  const [peers, setPeers] = useState(" ");
  const [Wallet, setWallet] = useState([]);
  const [Money, setMoney] = useState(0);
  const [MoneyToAddress, setMoneyToAddress] = useState("");
  const [Balance, setBalance] = useState([]); // 지갑 잔액
  const [chainBlocks, setChainBlocks] = useState([]);
  const reverse = [...chainBlocks].reverse();
  const [shownBlock, setshownBlock] = useState({});
  const [shownTx, setShownTx] = useState({});
  const [count, setCount] = useState(0);
  const [delay, setDelay] = useState(1000);
  const [isRunning, setIsRunning] = useState(false);
  const [ok, setOk] = useState(false);
  const [writeAddress, setWriteAddress] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [coinBlocks, setCoinBlocks] = useState([]);
  const [transactionPool, setTransactionPool] = useState("");

  useEffect(() => {
    getTransactionPool();
  }, [transactionPool]);

  useInterval(
    () => {
      const data = blockData || "화이팅";
      setIsRunning(false);
      axios
        .post(`http://localhost:3003/mineBlock`, { data: [data] })
        .then((req) => {
          console.log(req.data);
          setIsRunning(true);
        });

      setCount(count + 1);
    },
    isRunning && ok ? delay : null
  );

  const bcMaker = async () => {
    const data = blockData;
    if (data.length === 0) {
      return alert(`데이터를 넣어주세용`);
    }
    await axios
      .post(`http://localhost:3003/mineBlock`, { data: [data] })
      .then((req) => alert(req.data));
  };

  // 지갑 공개키 받아오기
  const getAddress = async () => {
    await axios
      .get(`http://localhost:3003/address`)
      .then((res) => setWallet(res.data.address));
  };

  // 지갑 잔액 조회
  const getBalance = async () => {
    await axios
      .get(`http://localhost:3003/balance`)
      .then((res) => setBalance(res.data.balance));
  };

  // 트랜잭션 만들기
  const sendTransaction = async () => {
    if (Money <= 0) {
      alert("금액 다시 적으세요.");
    } else if (MoneyToAddress.length !== 130) {
      alert("해당 주소가 없습니다. 다시 시도해 주세요.");
    } else {
      await axios
        .post(`http://localhost:3003/sendTransaction`, {
          address: MoneyToAddress,
          amount: Money,
        })
        .then((res) => {
          console.log(res.data);
          alert("트랜잭션 완료.");
        });
    }
  };

  // 트랜잭션풀 불러오기
  const getTransactionPool = async () => {
    await axios
      .get(`http://localhost:3003/transactionPool`)
      .then((res) => setTransactionPool(res.data));
  };

  const connect = async () => {
    await axios
      .get(`http://localhost:3003/Blocks`)
      .then((req) => setChainBlocks(req.data));
  };

  const address = async () => {
    await axios
      .get(`http://localhost:3003/address`)
      .then((req) => setWallet(req.data.address));
    console.log(Wallet);
  };
  const stop = async () => {
    await axios
      .post(`http://localhost:3003/stop`)
      .then((req) => alert(req.data));
  };

  const getpeers = async () => {
    axios.get(`http://localhost:3003/peers`).then((req) => setPeers(req.data));
  };
  if (peers.length === 0) {
    return setPeers(`연결된 피어가없어요`);
  }

  const addPeers = async () => {
    const P = peer;
    if (P.length === 0) {
      return alert(`peer내용을 넣어주세용`);
    }
    await axios
      .post(`http://localhost:3003/addPeers`, {
        peers: [`ws://localhost:${P}`],
      })
      .then((req) => alert(req.data));
  };

  const toggleComment = (blockchain) => {
    console.log([blockchain.index]);
    setshownBlock((prevShownComments) => ({
      ...prevShownComments,
      [blockchain.index]: !prevShownComments[blockchain.index],
    }));
  };



  function handleWriteAddress(e) {
    setWriteAddress(e.target.value);
  }
  function handleSendAmount(e) {
    setSendAmount(e.target.value);
  }



  function handleDelayChange(e) {
    setDelay(Number(e.target.value));
  }

  return (
    <div style={{ background: 'white' }}>
      <br />
      <Button color="error" style={{ marginTop: 5 }} variant="contained" type="dash" onClick={address}>
        지갑(publicKey)
      </Button>
      <br />

      <div className="wallet_bublic_key_div">
        <div className="wallet_bublic_key_div-title">
        </div>
        <div className="wallet_bublic_key_div-content">{Wallet}</div>
        <div>코인:{coinBlocks}MIMI</div>

      </div>
      <br />
      <br />
      <Input
        placeholder="연결할 노드 번호를 적으세요"
        onChange={(e) => {
          setPeer(e.target.value);
        }}
        value={peer}
      />
      <ButtonGroup disableElevation color="error" variant="contained" size="medium">
        <Button style={{ marginTop: 5 }} type="dash" onClick={addPeers}>
          피어 연결
        </Button>
        <Button style={{ marginTop: 5 }} color="warning" variant="outlined" type="dash" onClick={getpeers}>
          피어 연결목록 확인
        </Button>
      </ButtonGroup>
      <p>
        {" "}
        <b style={{ marginLeft: 10 }}></b> {peers}
      </p>
      <br />

      <Input
        type="number"
        placeholder="보낼 지갑 주소를 적으세요"
        onChange={(e) => {
          setMoneyToAddress(e.target.value);
        }}
        value={Money}
      />
      <Input
        type="text"
        placeholder="보낼 코인의 양을 적으세요"
        onChange={(e) => {
          setMoneyToAddress(e.target.value);
        }}
        value={MoneyToAddress}
      />
      <ButtonGroup disableElevation color="error" variant="contained" size="medium">
        <Button color="error" style={{ marginTop: 5 }} variant="contained" type="dash" onClick={sendTransaction}>
          코인 보내기
        </Button>
        <Button style={{ marginTop: 5 }} color="warning" variant="outlined" type="dash" onClick={console.log(transactionPool.length)}>
          트랜젝션 내역
        </Button>
        {/* {transactionPool
          ? transactionPool.map((txPool) => {
              return <div className="pool_box-effect">⁽⁽◝(˙꒳˙)◜⁾⁾</div>;
            })
          : null} */}
      </ButtonGroup>

      <br />
      <br />
      <br />
      <Input
        placeholder="body에 들어갈 data를 입력하시오"
        type="text"
        onChange={(e) => {
          setBlockData(e.target.value);
        }}
        value={blockData}
      />
      <ButtonGroup disableElevation color="error" variant="contained" size="medium">
        <Button
          variant="contained"
          size="large"
          style={{ marginTop: 5, marginBottom: 10 }}
          type=""
          onClick={bcMaker}
        >
          블록 채굴
        </Button>
        <Button variant="outlined" color="warning" size="large" style={{ marginTop: 5, marginBottom: 10 }} type="dash" onClick={connect}>
          블록체인 보기
        </Button>
      </ButtonGroup>
      {reverse.map((a) => {
        return (
          <ul key={a.index}>
            <div
              onClick={() => {
                toggleComment(a);
              }}
            >
            </div>
            <Col span={23}>
              <Row justify="end">
                <Col span={23}>
                  <Card
                    size="small"
                    className="block_box-block_info"
                  >
                    <li>
                      <div>
                        <strong>고유 번호</strong>
                      </div>
                      <div>{a.index}  ({a.index + 1}번째 블록)</div>
                    </li>
                    <hr className="boundary_line"></hr>
                    <li>
                      <div>
                        <strong>해시값</strong>
                      </div>
                      <div>{JSON.stringify(a.hash)}</div>
                    </li>
                    <hr className="boundary_line"></hr>
                    <li>
                      <div>
                        <strong>이전 해시값</strong>
                      </div>
                      <div>{a.previousHash}</div>
                    </li>
                    <hr className="boundary_line"></hr>
                    <li>
                      <div>
                        <strong>블록 생성 시각</strong>
                      </div>
                      <div>{a.timestamp}</div>
                    </li>
                    <hr className="boundary_line"></hr>
                    <li>
                      <div>
                        <strong>머클루트</strong>
                      </div>
                      <div>{a.merkleRoot}</div>
                    </li>
                    <hr className="boundary_line"></hr>
                    <li>
                      <div>
                        <strong>난이도</strong>
                      </div>
                      <div>{a.difficulty}</div>
                    </li>
                    <hr className="boundary_line"></hr>
                    <li>
                      <div>
                        <strong>넌스</strong>
                      </div>
                      <div>{JSON.stringify(a.nonce)}</div>
                    </li>
                    <hr className="boundary_line"></hr>
                    <li>
                      <div>
                        <strong>담긴 데이터</strong>
                      </div>
                      <div>{a.body}</div>
                    </li>
                  </Card>
                </Col>
              </Row>
            </Col>
          </ul>
        );
      })}
    </div>
  );
}
function useInterval(callback, delay) {
  const savedCallback = useRef();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

export default Port3;