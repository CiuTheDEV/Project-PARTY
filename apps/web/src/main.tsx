import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { App } from "./App";
import "./styles/global.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Missing #root element for Project Party web app.");
}

ReactDOM.createRoot(rootElement).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
