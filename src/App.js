import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MapView from "./MapView";
import GeneralMap from "./GeneralMap";
import Navbar from "./Navbar";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<MapView />} />
        <Route path="/general-map" element={<GeneralMap />} />
      </Routes>
    </Router>
  );
}

export default App;
