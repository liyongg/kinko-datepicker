import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
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

  const renderDate = function(property) {
    const datesRender = dates[property];
  const dateList =
    datesRender &&
    datesRender.map((date, idx) => <li key={idx}>{formatDate(date)}</li>);

    return dateList
  }


  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
      </div>
      <h1>Kinko Datums</h1>
      <button onClick={loadDates}>Verbind met SFTP</button>
      <div className="grid">
        <div>
          <h2>Uitgezette dagen</h2>
          <ul>{renderDate("filteredDates")}</ul>
        </div>
        <div>
          <h2>Aangezette maandagen</h2>
          <ul>{renderDate("addedMondays")}</ul>
        </div>
      </div>
    </>
  );
}

export default App;
