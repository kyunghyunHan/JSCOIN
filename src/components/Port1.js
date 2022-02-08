import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Row, Col, Card, Input } from "antd";
import ButtonGroup from '@mui/material/ButtonGroup';
import Button from '@mui/material/Button';
import nine from "../images/9.png";

function Port1() {
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
      alert("송급 error");
    } else if (MoneyToAddress.length !== 130) {
      alert("주소가 잘못되었어요");
    } else {
      await axios
        .post(`http://localhost:3001/mineTransaction`, {
          address: MoneyToAddress,
          amount: Money,
        })
        .then((res) => {
          console.log(res.data);
          alert("자기채굴");
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
      return alert(`peer주소입력`);
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
  const toggleBlockInfo = (block) => {
    setshownBlock((shownBlockInfo) => ({
      ...shownBlockInfo,
      [block.index]: !shownBlockInfo[block.index],
    }));
  };


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
        
          placeholder="6002 "
          onChange={(e) => {
            setPeer(e.target.value);
          }}
          value={peer}
        />
            <p>
        {" "}
        <b style={{ marginLeft: 10 }}></b> {peers}
      </p>
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
     
      </ButtonGroup>

    
      <hr className="boundary_line"></hr>
    {transactionPool.length} 트랜잭션
      <div className="pool_box">
        {transactionPool
          ? transactionPool.map((txPool) => {
              return <div className="pool_box-effect">  <img src={nine}/></div>;
            })
          : null}
       
      </div>
  
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
           <Button style={{ marginTop: 5 }} type="dashed" onClick={mineTransaction}>
       자기트랜잭션
      </Button>
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
        style={{ marginTop: 5, marginBottom: 10 }}
        type="dashed"
        onClick={bcMaker}
      >
        블록채굴
      </Button>
      <Button style={{ marginLeft: 30 }} type="dashed" onClick={connect}>
        블록체인 목록 불러오기
      </Button>
      <Button
        style={{ marginLeft: 30 }}
        type="dashed"
        onClick={() => {
          alert("채굴 start");
          setIsRunning(true); setOk(true);
        }}
      >
        채굴
      </Button>
      <Button
        style={{ marginLeft: 30 }}
        type="dashed"
        onClick={() => {
          alert("채굴 stop.");
          setOk(false);
        }}
      >
        중지
      </Button>
      </ButtonGroup>
      {reverse.map((blockData) => {
        return (
          <ul key={blockData.index}>
            <div
              onClick={() => {
                toggleBlockInfo(blockData);
              }}
            >
              <div text="Block Chain">
                <Card size="small" className="block_box">
                  <div>{blockData.index}번 블록</div>
                </Card>
              </div>
            </div>

            {shownBlock[blockData.index] ? (
              <Col span={23}>
                <Row justify="end">
                  <Col span={23}>
                    <Card
                      size="small"
                      title="정보"
                      className="block_box-block_info"
                    >
                      <li>
                        <div>
                          <div>고유 번호</div>
                        </div>
                        <div>{blockData.index}</div>
                      </li>
                      <hr className="boundary_line"></hr>
                      <li>
                        <div>
                          <div>이전해시값</div>
                        </div>
                        <div>{blockData.previousHash}</div>
                      </li>
                      <hr className="boundary_line"></hr>
                      <li>
                        <div>
                          <div>시간</div>
                        </div>
                        <div>{blockData.timestamp}</div>
                      </li>
                      <hr className="boundary_line"></hr>
                      <li>
                        <div>
                          <div>해시</div>
                        </div>
                        <div>{blockData.hash}</div>
                      </li>
                      <hr className="boundary_line"></hr>
                      <li>
                        <div>
                          <div>난이도</div>
                        </div>
                        <div>{blockData.difficulty}</div>
                      </li>
                      <hr className="boundary_line"></hr>
                      <li>
                        <div>
                          <div>넌스</div>
                        </div>
                        <div>{blockData.nonce}</div>
                      </li>
                      <hr className="boundary_line"></hr>
                      <div className="Transaction-title">Transactions</div>
                      {blockData.data.map((transaction) => {
                        return (
                          <div
                            className="Transaction-content"
                            key={transaction.id}
                          >
                            <div className="Transaction-content_box">
                              <div className="Transaction-content_info_id">
                                <div>Id</div>
                                <div>{transaction.id}</div>
                              </div>
                              {transaction.txIns.map((txIn) => {
                                return (
                                  <div
                                    className="Transaction-content_info"
                                    key={txIn.signature}
                                  >
                                    <div className="Transaction-content_info_txIn">
                                      <div>signature</div>
                                      <div>{txIn.signature}</div>
                                    </div>
                                    <div className="Transaction-content_info_txIn">
                                      <div>txOutId</div>
                                      <div>{txIn.txOutId}</div>
                                    </div>
                                    <div className="Transaction-content_info_txIn">
                                      <div>txOutIndex</div>
                                      <div>{txIn.txOutIndex}</div>
                                    </div>
                                  </div>
                                );
                              })}
                              {transaction.txOuts.map((txOut, index) => {
                                return (
                                  <div
                                    className="Transaction-content_info"
                                    key={index}
                                  >
                                    <div className="Transaction-content_info_txOut">
                                      <div>주소</div>
                                      <div>{txOut.address}</div>
                                    </div>
                                    <div className="Transaction-content_info_txOut">
                                      <div>amount</div>
                                      <div>{txOut.amount}</div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </Card>
                  </Col>
                </Row>
              </Col>
            ) : null}
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

export default Port1;