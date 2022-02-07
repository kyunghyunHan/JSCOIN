import React from "react";
import millify from "millify";
import { Typography, Row, Col, Statistic, Button } from "antd";
import { Link } from "react-router-dom";
import "./Home.css"



import { useGetCryptosQuery } from "../services/cryptoApi";
// import Cryptocurrencies from "./Cryptocurrencies";
// import News from "./News";
import Loader from "./Loader";

const { Title } = Typography;

const Homepage = () => {
  const { data, isFetching } = useGetCryptosQuery(10);
  const globalStats = data?.data?.stats;

  if (isFetching) return <Loader />;

  return (
    <>
   <div class="pages">
  <input id="one" name="trigger" type="radio"></input>
  <input id="two" name="trigger" type="radio"></input>
  <input id="three" name="trigger" type="radio"></input>
  <input id="four" name="trigger" type="radio"></input>
  <div class="pages_page">
    <div class="pages_page__inner">
      <div class="logo">Gobchang</div>
      <div class="pagenumber">1 2</div>
      <div class="content">
        <div class="content_center">
          <h4>곱창에 진심인 사람들 &amp; 곱창에 진심인 사람들</h4>
        </div>
      </div>
    </div>
  </div>
  <div class="pages_page">
    <div class="pages_page__inner">
      <div class="content">
        <div class="content_center right">
          <h4>곱창에 진심인 사람들  &amp; 곱창에 진심인 사람들 </h4>
        </div>
        <div class="overlay"></div>
      </div>
      <div class="control next">
        <label for="two"></label>
      </div>
    </div>
  </div>
  <div class="pages_page">
    <div class="pages_page__inner">
      <div class="logo">Gobchang</div>
      <div class="pagenumber">2 3</div>
      <div class="control">
        <label for="one"></label>
      </div>
      <div class="content">
        <div class="content_picture">
          <img src="https://i.pinimg.com/originals/1f/bc/f1/1fbcf1c55e839cd7b4aa28c4902669be.jpg"/>
        </div>
        <div class="content_offset">
          <h2>Subtitle</h2>
          <p>우리는 말한다. 곱창은 대단하다 </p>
        </div>
        <h1>
          <span>우</span>
          <span>리</span>
          <span>는</span>
          <span>말</span>
          <span>&nbsp;</span>
          <span>한</span>
          <span>다 </span>
          <span>&nbsp;</span>
          <span>곱</span>
          <span>창</span>
          <span>은</span>
          <span>위</span>
          <span>&nbsp;</span>
          <span>대</span>
          <span>하</span>
          <span>다</span>
          <span>고</span>
          <br/>
          <span>h</span>
          <span>e</span>
          <span>a</span>
          <span>d</span>
          <span>l</span>
          <span>i</span>
          <span>n</span>
          <span>e</span>
          <span>&nbsp;</span>
          <span>r</span>
          <span>i</span>
          <span>g</span>
          <span>h</span>
          <span>t</span>
          <span>&nbsp;</span>
          <span>h</span>
          <span>e</span>
          <span>r</span>
          <span>e</span>
        </h1>
      </div>
    </div>
  </div>
  <div class="pages_page">
    <div class="pages_page__inner">
      <div class="hamburger">
       
          <div class="hamburger_part"></div>
      
      </div>
      <div class="control next">
        <label for="three"></label>
      </div>
      <div class="bg"></div>
      <div class="footer">
        <i class="fab fa-google-plus-g"></i>
        <i class="fas fa-retweet"></i>
        <i class="far fa-heart"></i>
        <i class="far fa-share-square"></i>
      </div>
      <div class="content">
        <div class="content_quote">
          <h5>
            <span class="quo">
              <i>"</i>
            </span>
            <span>곱창 없는 </span>
            <span>삶은 지옥이에요</span>
            <span class="name">Jamie Coulter</span>
            <span class="auth">- Jcoulterdesign</span>
            <span class="quo">"</span>
          </h5>
        </div>
        <div class="content_picture">
          <img src="https://i.pinimg.com/originals/1f/bc/f1/1fbcf1c55e839cd7b4aa28c4902669be.jpg"/>
        </div>
        <h1>
          <span>L</span>
          <span>o</span>
          <span>o</span>
          <span>k</span>
          <span>&nbsp;</span>
          <span>a</span>
          <span>t </span>
          <span>&nbsp;</span>
          <span>t</span>
          <span>h</span>
          <span>i</span>
          <span>s</span>
          <span>&nbsp;</span>
          <span>a</span>
          <span>w</span>
          <span>e</span>
          <span>s</span>
          <span>o</span>
          <span>m</span>
          <span>e</span>
          <br/>
          <span>h</span>
          <span>e</span>
          <span>a</span>
          <span>d</span>
          <span>l</span>
          <span>i</span>
          <span>n</span>
          <span>e</span>
          <span>&nbsp;</span>
          <span>r</span>
          <span>i</span>
          <span>g</span>
          <span>h</span>
          <span>t</span>
          <span>&nbsp;</span>
          <span>h</span>
          <span>e</span>
          <span>r</span>
          <span>e</span>
        </h1>
      </div>
    </div>
  </div>
  <div class="pages_page">
    <div class="pages_page__inner">
      <div class="logo">Gobchang</div>
      <div class="pagenumber">4 5</div>
      <div class="content">
        <div class="content_center">
          <h4>곱창이 제 인생을 바꿧어요</h4>
          <h6>Lorem ipsum dolor sit amet</h6>
        </div>
      </div>
      <div class="control">
        <label for="two"></label>
      </div>
    </div>
  </div>
  <div class="pages_page">
    <div class="pages_page__inner">
      <div class="hamburger">
    
          <div class="hamburger_part"></div>
       
      </div>
      <div class="control next">
        <label for="four"></label>
      </div>
      <div class="bg"></div>
      <div class="content_centerimage">
        <img src="https://www.slrlounge.com/wp-content/uploads/2017/09/2brittany-smith-rachelbw6911-800x533.jpg"/>
      </div>
      <div class="content">
        <div class="content_center right">
          <h4>곱창이 제 인생을 바꿧어요</h4>
          <h6>Lorem ipsum dolor sit amet</h6>
        </div>
      </div>
      <div class="footer">
        <i class="fab fa-google-plus-g"></i>
        <i class="fas fa-retweet"></i>
        <i class="far fa-heart"></i>
        <i class="far fa-share-square"></i>
      </div>
    </div>
  </div>
  <div class="pages_page">
    <div class="pages_page__inner">
      <div class="logo">Gobchang</div>
      <div class="pagenumber">6 7</div>
      <div class="content">
        <div class="content_section">
          <h2>Super</h2>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a imperdiet sapien. Nunc vehicula lorem neque, eu rutrum sapien posuere ut. Nunc eget ullamcorper turpis. Sed in vehicula magna, vitae eleifend velit. </p>
        </div>
        <div class="content_section">
          <h2>Awesome</h2>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a imperdiet sapien. Nunc vehicula lorem neque, eu rutrum sapien posuere ut. Nunc eget ullamcorper turpis. Sed in vehicula magna, vitae eleifend velit.</p>
        </div>
        <div class="content_section">
          <h2>Great</h2>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a imperdiet sapien. Nunc vehicula lorem neque, eu rutrum sapien posuere ut. Nunc eget ullamcorper turpis. Sed in vehicula magna.</p>
        </div>
      </div>
      <div class="control">
        <label for="three"></label>
      </div>
    </div>
  </div>
  <div class="pages_page">
    <div class="pages_page__inner">
      <div class="hamburger">
       
          <div class="hamburger_part"></div>
      
      </div>
      <div class="bg"></div>
      <div class="content"></div>
      <div class="footer">
        <i class="fab fa-google-plus-g"></i>
        <i class="fas fa-retweet"></i>
        <i class="far fa-heart"></i>
        <i class="far fa-share-square"></i>
      </div>
    </div>
  </div>
</div>

    </>
  );
};

export default Homepage;
