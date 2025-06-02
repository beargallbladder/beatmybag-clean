import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./index.css"

console.log("Main.tsx is loading...");

const rootElement = document.getElementById("root");
if (!rootElement) {
  document.body.innerHTML = "<h1>Error: Root element not found</h1>";
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}
