import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

const rootEl = document.getElementById("app");
if (!rootEl) {
  throw new Error('Root element "#app" not found — required by Zalo Mini App host');
}

createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
