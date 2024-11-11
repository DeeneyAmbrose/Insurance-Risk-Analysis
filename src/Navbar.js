// Navbar.js

import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <ul>
        <li>
          <Link to="/">Map View</Link>
        </li>
        <li>
          <Link to="/general-map">General Map</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
