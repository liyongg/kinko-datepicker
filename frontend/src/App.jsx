import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import kinkoLogo from "/logo.svg";
import "./App.css";
import RenderDates from "./RenderDates";

function App() {
  const [dates, setDates] = useState({
    addedMondays: null,
    filteredDates: null,
  });

  async function loadDates() {
    const yo = await fetch("/api/connect/")
      .then((res) => res.json())
      .then((dates) =>
        setDates({
          addedMondays: dates.addedMondays,
          filteredDates: dates.filteredDates,
        })
      );
  }

  const formatDate = function (stringDate) {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    };
    const inputDate = new Date(stringDate);
    return inputDate.toLocaleDateString("nl-NL", options);
  };

  const dateList = dates.addedMondays
    && dates.addedMondays.map((date, idx) => (
        <li key={idx}>{formatDate(date)}</li>
      ));

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
      </div>
      <h1>Kinko Datums</h1>
      <div className="card">
        <button onClick={loadDates}>Verbind met SFTP</button>
        <ul>{dateList}</ul>
      </div>
    </>
  );
}

export default App;
