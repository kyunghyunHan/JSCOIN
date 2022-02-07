import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Row, Col, Card, Input } from "antd";
import ButtonGroup from '@mui/material/ButtonGroup';
import Button from '@mui/material/Button';

function Port1() {
  const [blockData, setBlockData] = useState("");
  const [peer, setPeer] = useState("");
  const [peers, setPeers] = useState(" ");
  const [Wallet, setWallet] = useState([]);
  const [chainBlocks, setChainBlocks] = useState([]);
  const [coinBlocks, setCoinBlocks] = useState([]);
  const reverse = [...chainBlocks].reverse();

  const [count, setCount] = useState(0);
  const [delay, setDelay] = useState(1000);
  const [isRunning, setIsRunning] = useState(false);
  const [ok, setOk] = useState(false);
  const [shownBlock, setshownBlock] = useState({});

  const bcMaker = async () => {
    const data = blockData;
    if (data.length === 0) {
      return alert(`데이터 필수`);
    }
    await axios
      .post(`http://localhost:3001/mineBlock`, { data: [data] })
      .then((req) => alert(req.data));
  };

  const connect = async () => {
    await axios
      .get(`http://localhost:3001/Blocks`)
      .then((req) => setChainBlocks(req.data));
  };
  const coinadd = async () => {
    await axios
      .get(`http://localhost:3001/1`)
      .then((req) => setCoinBlocks(req.data.Coin));
    console.log(coinBlocks);
  };

  const address = async () => {
    await axios
      .get(`http://localhost:3001/address`)
      .then((req) => setWallet(req.data.address));
    // console.log(Wallet);
  };
  const stop = async () => {
    await axios
      .post(`http://localhost:3001/stop`)
      .then((req) => alert(req.data));
  };


  const toggleComment = (blockchain) => {
    console.log([blockchain.header.index]);
    setshownBlock((prevShownComments) => ({
      ...prevShownComments,
      [blockchain.header.index]: !prevShownComments[blockchain.header.index],
    }));
  };


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

  function handleDelayChange(e) {
    setDelay(Number(e.target.value));
  }

  return (
    <div style={{ background: 'white' }}>
      <Button color="error" style={{ marginTop: 5 }} variant="contained" type="dash" onClick={() => { address(); coinadd(); }}>
        지갑
      </Button>
      <br />

      <div className="wallet_bublic_key_div">
        <div className="wallet_bublic_key_div-title">
        </div>
        <div className="wallet_bublic_key_div-content">{Wallet}</div>
        <div>코인:{coinBlocks}MIMI</div>
      </div>
      <hr className="boundary_line"></hr>
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
          <ul key={a.header.index}>
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
                      <div>{a.header.index}  ({a.header.index + 1}번째 블록)</div>
                    </li>
                    <hr className="boundary_line"></hr>
                    <li>
                      <div>
                        <strong>해시값</strong>
                      </div>
                      <div>{JSON.stringify(a.header.hash)}</div>
                    </li>
                    <hr className="boundary_line"></hr>
                    <li>
                      <div>
                        <strong>이전 해시값</strong>
                      </div>
                      <div>{a.header.previousHash}</div>
                    </li>
                    <hr className="boundary_line"></hr>
                    <li>
                      <div>
                        <strong>블록 생성 시각</strong>
                      </div>
                      <div>{a.header.timestamp}</div>
                    </li>
                    <hr className="boundary_line"></hr>
                    <li>
                      <div>
                        <strong>머클루트</strong>
                      </div>
                      <div>{a.header.merkleRoot}</div>
                    </li>
                    <hr className="boundary_line"></hr>
                    <li>
                      <div>
                        <strong>난이도</strong>
                      </div>
                      <div>{a.header.difficulty}</div>
                    </li>
                    <hr className="boundary_line"></hr>
                    <li>
                      <div>
                        <strong>넌스</strong>
                      </div>
                      <div>{JSON.stringify(a.header.nonce)}</div>
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

export default Port1;