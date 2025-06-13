import React from "react";
import "./App.css";
import GraphVisualizer from "./GraphVisualizer";

function App() {
  return (
    <div className="App">
      <h1>Fruchterman-Reingold Graph Layout Demo</h1>
      <GraphVisualizer />
    </div>
  );
}

export default App;
