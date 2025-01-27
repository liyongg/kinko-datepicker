import { useEffect, useState, useRef } from "react";
import kinkoLogo from "./assets/logo.svg";
import githubLogo from "./assets/github.svg";
import "./App.css";
import RenderDates from "./RenderDates";
import "flatpickr/dist/flatpickr.css";
import PopupModal from "./PopupModal";
import ClipLoader from "react-spinners/ClipLoader";

function App() {
  const [token, setToken] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [connected, setConnected] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    await fetch("/api/connect/", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    })
      .then((res) => res.json())
      .then((dates) => {
        setDates({
          addedMondays: dates.addedMondays,
          filteredDates: dates.filteredDates,
        });
      });
    setConnected(() => true);
    setIsSubmitted(() => false);
    setLoading(false);
  }

  async function handleLogin(evt) {
    evt.preventDefault();
    setLoading(true);
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
    setLoading(false);
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
          <button name="register" disabled={loading}>
            Register
          </button>
          <button name="login" disabled={loading}>
            Login
          </button>
        </form>
      )}

      {isLoggedIn && !connected && (
        <button onClick={loadDates} disabled={loading}>
          Verbind met SFTP
        </button>
      )}

      {isLoggedIn && connected && (
        <h3 style={{ color: "green" }}>Verbonden!</h3>
      )}

      {isLoggedIn && connected && (
        <div className="grid">
          <RenderDates
            data={dates}
            token={token}
            updateConnected={setConnected}
            updateSubmitted={setIsSubmitted}
          />
        </div>
      )}

      <div style={{paddingTop: "10px"}}> {loading ? <ClipLoader size={30} color="white" /> : null}</div>

      <div>
        <a href="https://github.com/liyongg/kinko-datepicker" target="_blank">
          <img
            src={githubLogo}
            className="logo"
            style={{ width: "30px", height: "30px", paddingTop: "3em" }}
            alt="GitHub Logo"
          />
        </a>
      </div>
    </>
  );
}

export default App;
