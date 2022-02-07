import React from "react";
import "./Menu.css"
import one from "../images/1.jpeg";
import two from "../images/2.jpeg";
import thr from "../images/3.jpeg";
import fou from "../images/4.jpeg";
import fiv from "../images/5.jpeg";
import six from "../images/6.jpeg";
import sev from "../images/7.jpeg";
import eig from "../images/8.jpeg";

import { useGetCryptosQuery } from "../services/cryptoApi";
import Loader from "./Loader";


const Menu = () => {
  const { data, isFetching } = useGetCryptosQuery(10);
  const globalStats = data?.data?.stats;

  if (isFetching) return <Loader />;

  return (
    <>
    <main>
  <div class="responsive-container">
    <div class="grid">
      <div class="grid-column">
                <a class="product" href="#">
          <div class="product-image">
            <img src={one} />
          </div>
          <div class="product-content">
            <div class="product-info">
              <h2 class="product-title">미미야채</h2>
              <p class="product-price">100MIMI</p>
            </div>
            <button class="product-action"><i class="material-icons-outlined">구매</i></button>
          </div>
        </a>

        <a class="product" href="#">
          <div class="product-image">
          <img src={two} />
          </div>
          <div class="product-content">
            <div class="product-info">
              <h2 class="product-title">미미알곱창</h2>
              <p class="product-price">100MIMI</p>
            </div>
            <button class="product-action"><i class="material-icons-outlined">구매</i></button>
          </div>
        </a>
        <a class="product" href="#">
          <div class="product-image">
          <img src={thr} />
          </div>
          <div class="product-content">
            <div class="product-info">
              <h2 class="product-title">미미대창</h2>
              <p class="product-price">100MIMI</p>
            </div>
            <button class="product-action"><i class="material-icons-outlined">구매</i></button>
          </div>
        </a>
      </div>
      <div class="grid-column">
        <a class="product" href="#">
          <div class="product-image">
          <img src={fou} />
          </div>
          <div class="product-content">
            <div class="product-info">
              <h2 class="product-title">미미막창</h2>
              <p class="product-price">100MIMI</p>
            </div>
            <button class="product-action"><i class="material-icons-outlined">구매</i></button>
          </div>
        </a>
        <a class="product" href="#">
          <div class="product-image"> 
          <img src={fiv} />
          </div>
          <div class="product-content">
            <div class="product-info">
              <h2 class="product-title">미미염통</h2>
              <p class="product-price">100MIMI</p>
            </div>
            <button class="product-action"><i class="material-icons-outlined">구매</i></button>
          </div>
        </a>
        <a class="product" href="#">
          <div class="product-image">
          <img src={six} />
          </div>
          <div class="product-content">
            <div class="product-info">
              <h2 class="product-title">미미오소리</h2>
              <p class="product-price">100MIMI</p>
            </div>
            <button class="product-action"><i class="material-icons-outlined">구매</i></button>
          </div>
        </a>
      </div>
      <div class="grid-column">
        <a class="product" href="#">
          <div class="product-image">
          <img src={sev} />
          </div>
          <div class="product-content">
            <div class="product-info">
              <h2 class="product-title">미미모둠</h2>
              <p class="product-price">100MIMI</p>
            </div>
            <button class="product-action"><i class="material-icons-outlined">구매</i></button>
          </div>
        </a>
        <a class="product" href="#">
          <div class="product-image">
          <img src={eig} />
          </div>
          <div class="product-content">
            <div class="product-info">
              <h2 class="product-title">미미껍대기</h2>
              <p class="product-price">100MIMI</p>
            </div>
            <button class="product-action"><i class="material-icons-outlined">구매</i></button>
          </div>
        </a>
      </div>
    </div>
  </div>
  <div class="credits">
    <div class="responsive-container">
    <h3>미미곱창</h3>
  <a href='#' target="_blank">미미곱창을 이용해 주셔서 감사합니다. www.MIMI.com</a>
    </div>
  </div>
</main>
    </>
  );
};

export default Menu;
