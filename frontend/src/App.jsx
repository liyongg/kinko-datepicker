import { useEffect, useState, useRef } from "react";
import kinkoLogo from "./assets/logo.svg";
import "./App.css";
import RenderDates from "./RenderDates";
import "flatpickr/dist/flatpickr.css";
import PopupModal from "./PopupModal";

function App() {
  const [token, setToken] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [connected, setConnected] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [dates, setDates] = useState({
    filteredDates: null,
    addedMondays: null,
  });

  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

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
    setIsSubmitted(false);
  }

  async function handleLogin(evt) {
    evt.preventDefault();
    const apiForm = evt.nativeEvent.submitter.name;

    try {
      const response = await fetch(`/api/${apiForm}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });

      if (response.ok) {
        if (apiForm === "login") {
          const data = await response.json();
          setToken(data.token);

          console.log("Form token is set");
          setIsLoggedIn(!isLoggedIn);
        }

        console.log("Form login successful!");
      } else {
        const resJson = await response.json();
        console.error("Form submission failed despite:", resJson.message);
      }
    } catch (error) {
      console.error("Form error: ", error);
    }
  }

  function handleChange(evt) {
    const changedField = evt.target.name;
    const newValue = evt.target.value;
    setLoginData((currData) => {
      currData[changedField] = newValue;
      return { ...currData };
    });
  }

  return (
    <>
      <div>
        <a href="https://kinko.nl/reserveren" target="_blank">
          <img src={kinkoLogo} className="logo" alt="Kinko logo" />
        </a>
        {isLoggedIn && isSubmitted && <h3>☝️</h3>}
      </div>
      <h1>Kinko Datums</h1>
      {!isLoggedIn && (
        <form onSubmit={handleLogin}>
          <div>
            <label htmlFor="username"></label>
            <input
              type="text"
              name="username"
              id="username"
              value={loginData.username}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="password"></label>
            <input
              type="password"
              name="password"
              id="password"
              value={loginData.password}
              onChange={handleChange}
            />
          </div>
          <button name="register">Register</button>
          <button name="login">Login</button>
        </form>
      )}

      {isLoggedIn && !connected && (
        <button onClick={loadDates}>Verbind met SFTP</button>
      )}

      {isLoggedIn && connected && (
        <h3 style={{ color: "green" }}>Verbonden!</h3>
      )}

      {isLoggedIn && connected && (
        <div className="grid">
          <RenderDates
            data={dates}
            updateConnected={setConnected}
            updateSubmitted={setIsSubmitted}
          />
        </div>
      )}
    </>
  );
}

export default App;
