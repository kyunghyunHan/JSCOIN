import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Row, Col, Card, Input } from "antd";
import ButtonGroup from '@mui/material/ButtonGroup';
import Button from '@mui/material/Button';
import nine from "../images/9.png";

function Port2() {
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
        .post(`http://localhost:3001/mineBlock`, { data: [data] })
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
      .post(`http://localhost:3001/mineBlock`, { data: [data] })
      .then((req) => alert(req.data));
  };

  // 지갑 공개키 받아오기
  const getAddress = async () => {
    await axios
      .get(`http://localhost:3001/address`)
      .then((res) => setWallet(res.data.address));
  };

  // 지갑 잔액 조회
  const getBalance = async () => {
    await axios
      .get(`http://localhost:3001/balance`)
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
        .post(`http://localhost:3001/sendTransaction`, {
          address: MoneyToAddress,
          amount: Money,
        })
        .then((res) => {
          console.log(res.data);
          alert("트랜잭션 완료.");
        });
    }
  };
  const mineTransaction = async () => {
    if (Money <= 0) {
      alert("송금액이 잘못되었어요");
    } else if (MoneyToAddress.length !== 130) {
      alert("주소가 잘못되었어요 똑바로 좀 하세요");
    } else {
      await axios
        .post(`http://localhost:3001/mineTransaction`, {
          address: MoneyToAddress,
          amount: Money,
        })
        .then((res) => {
          console.log(res.data);
          alert("치사하게 채굴하였어요");
        });
    }
  };
  // 트랜잭션풀 불러오기
  const getTransactionPool = async () => {
    await axios
      .get(`http://localhost:3001/transactionPool`)
      .then((res) => setTransactionPool(res.data));
  };

  const connect = async () => {
    await axios
      .get(`http://localhost:3001/blocks`)
      .then((req) => setChainBlocks(req.data));
  };

  const address = async () => {
    await axios
      .get(`http://localhost:3001/address`)
      .then((req) => setWallet(req.data.address));
    console.log(Wallet);
  };
  const stop = async () => {
    await axios
      .post(`http://localhost:3001/stop`)
      .then((req) => alert(req.data));
  };

  const getpeers = async () => {
    axios.get(`http://localhost:3001/peers`).then((res) => setPeers(res.data));
  };
  if (peers.length === 0) {
    return setPeers(`연결된 피어가없어요`);
  }

  // 연결할 소켓 추가하기
  const addPeer = async () => {
    const P = peer;
    if (P.length === 0) {
      return alert(`peer내용을 넣어주세용`);
    }
    await axios
      .post(`http://localhost:3001/addPeer`, {
        peer: [`ws://localhost:${P}`],
      })
      .then((res) => alert(res.data));
  };

  const toggleComment = (blockchain) => {
    console.log([blockchain.index]);
    setshownBlock((prevShownComments) => ({
      ...prevShownComments,
      [blockchain.header.index]: !prevShownComments[blockchain.header.index],
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
      <div className="wallet_bublic_key_div-content">{Wallet}</div>
      <br />
      <br />
      <Button color="error" style={{ marginTop: 5 }} variant="contained" type="dash" onClick={getBalance}>
      Coin
      </Button>
      <br />


      <div className="wallet_bublic_key_div">
        <div className="wallet_bublic_key_div-title">
        </div>
        <div>코인:{Balance}MIMI</div>
      </div>
      <br />
      <br />
      <div>포트번호</div>
      <Input
        
          placeholder=" ex)6002 "
          onChange={(e) => {
            setPeer(e.target.value);
          }}
          value={peer}
        />
      <ButtonGroup disableElevation color="error" variant="contained" size="medium">
      <Button style={{ marginTop: 5 }} type="dashed" onClick={addPeer}>
        피어연결
      </Button>
      <Button style={{ marginLeft: 40 }} type="dashed" onClick={getpeers}>
        피어 연결목록확인
      </Button>
      {/* <Button style={{ marginTop: 5 }} type="dashed" onClick={getTransactionPool}>
      트랜잭션풀이
      </Button> */}
      {/* <div>{transactionPool}</div> */}
      <Button style={{ marginTop: 5 }} type="dashed" onClick={mineTransaction}>
       자기트랜잭션
      </Button>
      </ButtonGroup>

    
      <hr className="boundary_line"></hr>
     트랜잭션{transactionPool.length}개
      <div className="pool_box">
        {transactionPool
          ? transactionPool.map((txPool) => {
              return <div className="pool_box-effect">  <img src={nine}/></div>;
            })
          : null}
       
      </div>
      <p>
        {" "}
        <b style={{ marginLeft: 10 }}></b> {peers}
      </p>
      <br />
      <div className="tx_entry">
        <Col span={3}>
         보낼코인
          <Input
            type="number"
            onChange={(e) => {
              setMoney(e.target.value);
            }}
            value={Money}
          />
        </Col>
        <Col span={20}>
         주소
          <Input
            type="text"
            onChange={(e) => {
              setMoneyToAddress(e.target.value);
            }}
            value={MoneyToAddress}
          />
        </Col>
      </div>
      <ButtonGroup disableElevation color="error" variant="contained" size="medium">
      <Button style={{ marginTop: 5 }} color="warning" variant="outlined" type="dash" onClick={sendTransaction}>
     코인송금
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
          <ul key={JSON.stringify(a.index)}>
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

export default Port2;