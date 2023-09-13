require("dotenv").config({ path: "../.env" });
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const cors = require("cors");

// Authentication
const User = require("./User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const SftpClient = require("ssh2-sftp-client");
const { readFileSync, writeFileSync, existsSync, mkdirSync } = require("fs");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.ATLAS_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const connection = mongoose.connection;
connection.once("open", () => {
  console.log("MongoDB database connection established successfully");
});

app.use(express.urlencoded({ extended: true }));

const sftpConfig = {
  protocol: "sftp",
  host: process.env.SFTP_HOSTNAME,
  port: 22,
  username: process.env.SFTP_USERNAME,
  privateKey: readFileSync(process.env.SSH_KEY_PATH),
  passphrase: process.env.SSH_PASSPHRASE,
  tryKeyboard: true,
  retries: 0,
  readyTimeout: 1000,
};

async function connect(sftp) {
  try {
    console.log("SFTP: Trying to connect to SFTP server...");
    const sftpConnection = await sftp.connect(sftpConfig);
    console.log("SFTP: Connected to SFTP server");
    return { isConnected: true, client: sftpConnection };
  } catch (error) {
    console.error("SFTP: Error; ", error.message);
    return { isConnected: false, client: null };
  }
}

const findAndParseLine = function (
  lines,
  patternToFind,
  patternToReplace,
  replacement = "ph"
) {
  const matchingLine = lines.find((line) => line.match(patternToFind));
  const matchingDates = matchingLine.match(patternToReplace)[0];
  const index = lines.indexOf(matchingLine);
  const moddedLine = matchingLine.replace(
    patternToReplace,
    JSON.stringify(replacement)
  );

  let evaluation;
  try {
    evaluation = eval(matchingDates);
  } catch {
    evaluation = matchingDates;
  }

  return {
    evaluation,
    index,
    line: matchingLine,
    moddedLine,
  };
};

const isLoggedIn = function (req, res, next) {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

const formatTime = function () {
  const currentDate = new Date();

  // Get the year, month, day, hour, and minute components
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Month is 0-based
  const day = String(currentDate.getDate()).padStart(2, "0");
  const hour = String(currentDate.getHours()).padStart(2, "0");
  const minute = String(currentDate.getMinutes()).padStart(2, "0");
  const second = String(currentDate.getSeconds()).padStart(2, "0");

  // Format the components into the desired string format
  return `${year}${month}${day}.${hour}${minute}${second}`;
};

app.get("/api/connect", isLoggedIn, async (req, res) => {
  const sftp = new SftpClient({});

  const { isConnected } = await connect(sftp);

  if (!isConnected) {
    console.log("Connection not so good!");
    res.send("");
  }

  if (!existsSync("./downloads")) {
    mkdirSync("./downloads");
  }

  const files = await sftp.list(process.env.REMOTE_DIR, (obj) =>
    /\d{8}\.\d{6}/.test(obj.name)
  );

  const remoteFile = `${process.env.REMOTE_DIR}/${files.slice(-1)[0].name}`;
  await sftp.fastGet(remoteFile, "./downloads/testpicker.js");
  console.log("SFTP: file downloaded successfully");

  const dateFile = readFileSync("./downloads/testpicker.js", "utf-8");
  const lines = dateFile.split("\n");

  const filteredDates = findAndParseLine(
    lines,
    (patternToFind = /const filterDatums/),
    (patternToReplace = /\[.*?\]/)
  ).evaluation;
  const addedMondays = findAndParseLine(
    lines,
    (patternToFind = /const extraDatums/),
    (patternToReplace = /\[.*?\]/)
  ).evaluation;

  await sftp.end();
  console.log("SFTP: connection intentionally broken.");
  res.json({ filteredDates, addedMondays });
});

app.post("/api/submit", isLoggedIn, async (req, res) => {
  const sftp = new SftpClient({});

  await connect(sftp);

  const { addedMondays: datesMonday, filteredDates: dates } = req.body;

  const dateFile = readFileSync("./downloads/testpicker.js", "utf-8");
  const lines = dateFile.split("\n");

  const parsedDatesInfo = findAndParseLine(
    lines,
    (patternToFind = /const filterDatums/),
    (patternToReplace = /\[.*?\]/),
    (replacement = dates)
  );
  const parsedMondaysInfo = findAndParseLine(
    lines,
    (patternToFind = /const extraDatums/),
    (patternToReplace = /\[.*?\]/),
    (replacement = datesMonday)
  );

  lines[parsedDatesInfo.index] = parsedDatesInfo.moddedLine;
  lines[parsedMondaysInfo.index] = parsedMondaysInfo.moddedLine;

  writeFileSync("./downloads/modpicker.js", lines.join("\n"));

  // Upload new flatpickr.js file with timestamp in name
  console.log("SFTP: trying to upload file");
  const currentTime = formatTime();
  const fileFlatpickr = `flatpickr.${currentTime}.js`;
  const remoteFile = `${process.env.REMOTE_DIR}/${fileFlatpickr}`;
  await sftp.fastPut("./downloads/modpicker.js", remoteFile);
  console.log("SFTP: flatpickr file succesfully uploaded!");

  // Modify contents of functions.php
  const remoteFunctionsFile = `${process.env.REMOTE_DIR}/functions.php`;
  await sftp.fastGet(remoteFunctionsFile, "./downloads/functions.php");
  const functionsFile = readFileSync("./downloads/functions.php", "utf-8");
  const linesFunctionsFile = functionsFile.split("\n");

  const parsedFunctionsInfo = findAndParseLine(
    linesFunctionsFile,
    (patternToFind = /flatpickr.\d{8}.\d{6}.js/),
    (patternToReplace = /flatpickr.\d{8}.\d{6}.js/),
    (replacement = fileFlatpickr)
  );

  linesFunctionsFile[parsedFunctionsInfo.index] =
    parsedFunctionsInfo.moddedLine;
  writeFileSync("./downloads/modfunctions.php", linesFunctionsFile.join("\n"));

  await sftp.fastPut("./downloads/modfunctions.php", remoteFunctionsFile);

  // Delete old flatpickr.js file

  await sftp.end();
  console.log("SFTP: connection intentionally broken");
  res.status(200).json({ message: "Dates submitted!" });
});

app.post("/api/register", async (req, res) => {
  const allowRegisters = process.env.ALLOW_REGISTER.toLowerCase() === "true";
  if (!allowRegisters) {
    return res.status(400).json({ message: "Registers are disabled" });
  }

  const { username, password } = req.body;
  const existingUser = await User.findOne({ username });

  if (existingUser) {
    console.log("Username already exists");
    return res.status(400).json({ message: "Username already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({
    username,
    password: hashedPassword,
  });

  try {
    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error when trying to save user" });
  }
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const token = jwt.sign({ userId: user._id }, process.env.SECRET, {
    expiresIn: "1h",
  });

  console.log("Successful login!");
  res.status(200).json({ token });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
