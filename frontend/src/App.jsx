import { useEffect, useState, useRef } from "react";
import kinkoLogo from "./assets/logo.svg";
import "./App.css";
import RenderDates from "./RenderDates";
import "flatpickr/dist/flatpickr.css";

function App() {
  const [dates, setDates] = useState({
    filteredDates: null,
    addedMondays: null,
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
        <a href="https://kinko.nl/reserveren" target="_blank">
          <img src={kinkoLogo} className="logo" alt="Kinko logo" />
        </a>
      </div>
      <h1>Kinko Datums</h1>

      {connected ? (
        <h3 style={{ color: "green" }}>Verbonden!</h3>
      ) : (
        <button onClick={loadDates}>Verbind met SFTP</button>
      )}

      <div className="grid">{connected && <RenderDates data={dates} />}</div>
    </>
  );
}

export default App;
