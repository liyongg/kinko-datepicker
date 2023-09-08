import { useEffect, useState, useRef } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import RenderDates from "./RenderDates";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";

function App() {
  const [dates, setDates] = useState({
    addedMondays: null,
    filteredDates: null,
  });

  const [connected, setConnected] = useState(false);

  async function loadDates() {
    await fetch("/api/connect/")
      .then((res) => res.json())
      .then((dates) =>
        setDates({
          addedMondays: dates.addedMondays,
          filteredDates: dates.filteredDates,
        })
      );
    setConnected((value) => true);
  }

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
      </div>
      <h1>Kinko Datums</h1>
      
      {connected ? (
        <h3 style={{ color: "green" }}>Verbonden!</h3>
      ) : (
        <button onClick={loadDates}>Verbind met SFTP</button>
      )}

      <div className="grid">
        {connected && (
          <>
            <RenderDates data={dates} prop="addedMondays" title="Uitgezet" />
            <RenderDates data={dates} prop="filteredDates" title="Aangezet" />
          </>
        )}
      </div>
    </>
  );
}

export default App;
