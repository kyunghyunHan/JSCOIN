import React, { useState, useEffect } from "react";
// import { Button, Menu, Typography, Avatar } from "antd";
// import { Link } from "react-router-dom";
// import {
//   HomeOutlined,
//   MenuOutlined,
//   NodeIndexOutlined,
// } from "@ant-design/icons";

// import icon from "../images/dp.png";
import "./Navbar.css";

const Navbar = () => {
  const [activeMenu, setActiveMenu] = useState(true);
  const [screenSize, setScreenSize] = useState(undefined);

  useEffect(() => {
    const handleResize = () => setScreenSize(window.innerWidth);

    window.addEventListener("resize", handleResize);

    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (screenSize <= 800) {
      setActiveMenu(false);
    } else {
      setActiveMenu(true);
    }
  }, [screenSize]);

  return (
    <div class="menu">
      <a href="/" class="link">
        <span class="link-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="192"
            height="192"
            fill="currentColor"
            viewBox="0 0 256 256"
          >
            <rect width="256" height="256" fill="none"></rect>
            <path
              d="M213.3815,109.61945,133.376,36.88436a8,8,0,0,0-10.76339.00036l-79.9945,72.73477A8,8,0,0,0,40,115.53855V208a8,8,0,0,0,8,8H208a8,8,0,0,0,8-8V115.53887A8,8,0,0,0,213.3815,109.61945Z"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="16"
            ></path>
          </svg>
        </span>
        <span class="link-title">Home</span>
      </a>

      {/* lll */}
      <a href="/menu" class="link">
        <span class="link-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="192"
            height="192"
            fill="currentColor"
            viewBox="0 0 256 256"
          >
            <rect width="256" height="256" fill="none"></rect>
            <polyline
              points="76.201 132.201 152.201 40.201 216 40 215.799 103.799 123.799 179.799"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="16"
            ></polyline>
            <line
              x1="100"
              y1="156"
              x2="160"
              y2="96"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="16"
            ></line>
            <path
              d="M82.14214,197.45584,52.201,227.397a8,8,0,0,1-11.31371,0L28.603,215.11268a8,8,0,0,1,0-11.31371l29.94113-29.94112a8,8,0,0,0,0-11.31371L37.65685,141.65685a8,8,0,0,1,0-11.3137l12.6863-12.6863a8,8,0,0,1,11.3137,0l76.6863,76.6863a8,8,0,0,1,0,11.3137l-12.6863,12.6863a8,8,0,0,1-11.3137,0L93.45584,197.45584A8,8,0,0,0,82.14214,197.45584Z"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="16"
            ></path>
          </svg>
        </span>
        <span class="link-title">Menu</span>
      </a>


      <a href="/mining" class="link">
    <span class="link-icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" fill="currentColor" viewBox="0 0 256 256">
        <rect width="256" height="256" fill="none"></rect>
        <circle cx="116" cy="116" r="84" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"></circle>
        <line x1="175.39356" y1="175.40039" x2="223.99414" y2="224.00098" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"></line>
      </svg>
    </span>
    <span class="link-title">Mining</span>
  </a>


      {/* 2222 */}
      <a href="/Port1" class="link">
        <span class="link-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="192"
            height="192"
            fill="currentColor"
            viewBox="0 0 256 256"
          >
            <rect width="256" height="256" fill="none"></rect>
            <circle
              cx="128"
              cy="96"
              r="64"
              fill="none"
              stroke="currentColor"
              stroke-miterlimit="10"
              stroke-width="16"
            ></circle>
            <path
              d="M30.989,215.99064a112.03731,112.03731,0,0,1,194.02311.002"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="16"
            ></path>
          </svg>
        </span>
        <span class="link-title">PORT</span>
      </a>



      {/* 333333 */}
      <a href="/Port2" class="link">
        <span class="link-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="192"
            height="192"
            fill="currentColor"
            viewBox="0 0 256 256"
          >
            <rect width="256" height="256" fill="none"></rect>
            <circle
              cx="128"
              cy="96"
              r="64"
              fill="none"
              stroke="currentColor"
              stroke-miterlimit="10"
              stroke-width="16"
            ></circle>
            <path
              d="M30.989,215.99064a112.03731,112.03731,0,0,1,194.02311.002"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="16"
            ></path>
          </svg>
        </span>
        <span class="link-title">PORT</span>
      </a>


      {/* 44444 */}
      <a href="/Port3" class="link">
        <span class="link-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="192"
            height="192"
            fill="currentColor"
            viewBox="0 0 256 256"
          >
            <rect width="256" height="256" fill="none"></rect>
            <circle
              cx="128"
              cy="96"
              r="64"
              fill="none"
              stroke="currentColor"
              stroke-miterlimit="10"
              stroke-width="16"
            ></circle>
            <path
              d="M30.989,215.99064a112.03731,112.03731,0,0,1,194.02311.002"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="16"
            ></path>
          </svg>
        </span>
        <span class="link-title">PORT</span>
      </a>
    </div>
          
  );
};

export default Navbar;

// import React, { useState, useEffect } from "react";
// import { Button, Menu, Typography, Avatar } from "antd";
// import { Link } from "react-router-dom";
// import {
//   HomeOutlined,

//   MenuOutlined,
//   NodeIndexOutlined,
// } from "@ant-design/icons";

// import icon from "../images/dp.png";

// const Navbar = () => {
//   const [activeMenu, setActiveMenu] = useState(true);
//   const [screenSize, setScreenSize] = useState(undefined);

//   useEffect(() => {
//     const handleResize = () => setScreenSize(window.innerWidth);

//     window.addEventListener("resize", handleResize);

//     handleResize();

//     return () => window.removeEventListener("resize", handleResize);
//   }, []);

//   useEffect(() => {
//     if (screenSize <= 800) {
//       setActiveMenu(false);
//     } else {
//       setActiveMenu(true);
//     }
//   }, [screenSize]);

//   return (
//     <div className="nav-container">
//       <div className="logo-container">
//         <Avatar src={icon} size="large" />
//         <Typography.Title level={2} className="logo">
//           <Link to="/">MIMICOIN</Link>
//         </Typography.Title>
//         <Button
//           className="menu-control-container"
//           onClick={() => setActiveMenu(!activeMenu)}
//         >
//           <MenuOutlined />
//         </Button>
//       </div>
//       {activeMenu && (
//         <Menu theme="dark">
//           <Menu.Item icon={<HomeOutlined />}>
//             <Link to="/">홈</Link>
//           </Menu.Item>

//           <Menu.Item icon={<NodeIndexOutlined />}>
//             <Link to="/port1">포트1</Link>
//           </Menu.Item>
//           <Menu.Item icon={<NodeIndexOutlined />}>
//             <Link to="/port2">포트2</Link>
//           </Menu.Item>
//           <Menu.Item icon={<NodeIndexOutlined />}>
//             <Link to="/port3">포트3</Link>
//           </Menu.Item>
//         </Menu>
//       )}
//     </div>
//   );
// };

// export default Navbar;
