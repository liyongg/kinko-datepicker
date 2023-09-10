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

const sftp = new SftpClient({});

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

async function connect() {
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

const findAndParseLine = function (lines, pattern, replacement = "ph") {
  const matchingLine = lines.find((line) => line.match(pattern));
  const matchingDates = matchingLine.match(/\[.*?\]/)[0];
  const index = lines.indexOf(matchingLine);
  const moddedLine = matchingLine.replace(
    /\[.*?\]/,
    JSON.stringify(replacement)
  );
  return {
    evaluation: eval(matchingDates),
    index,
    line: matchingLine,
    moddedLine,
  };
};

app.get("/api/connect", async (req, res) => {
  const { isConnected } = await connect();

  if (!isConnected) {
    console.log("Connection not so good!");
    res.send("");
  }

  if (!existsSync("./downloads")) {
    mkdirSync("./downloads");
  }

  await sftp.fastGet(process.env.REMOTE_FILE, "./downloads/testpicker.js");
  console.log("SFTP: file downloaded successfully");

  const dateFile = readFileSync("./downloads/testpicker.js", "utf-8");
  const lines = dateFile.split("\n");

  const filteredDates = findAndParseLine(
    lines,
    /const filterDatums/
  ).evaluation;
  const addedMondays = findAndParseLine(lines, /const extraDatums/).evaluation;

  await sftp.end();
  console.log("SFTP: connection intentionally broken.");
  res.json({ filteredDates, addedMondays });
});

app.post("/api/submit", async (req, res) => {
  const { isConnected } = await connect();

  const { addedMondays: datesMonday, filteredDates: dates } = req.body;

  const dateFile = readFileSync("./downloads/testpicker.js", "utf-8");
  const lines = dateFile.split("\n");

  const parsedDatesInfo = findAndParseLine(
    lines,
    (pattern = /const filterDatums/),
    (replacement = dates)
  );
  const parsedMondaysInfo = findAndParseLine(
    lines,
    (pattern = /const extraDatums/),
    (replacement = datesMonday)
  );

  lines[parsedDatesInfo.index] = parsedDatesInfo.moddedLine;
  lines[parsedMondaysInfo.index] = parsedMondaysInfo.moddedLine;

  writeFileSync("./downloads/modpicker.js", lines.join("\n"));

  console.log("SFTP: trying to upload file");
  await sftp.fastPut("./downloads/modpicker.js", process.env.REMOTE_FILE);
  console.log("SFTP: file succesfully uploaded!");
  await sftp.end();
  console.log("SFTP: connection intentionally broken");
  res.status(200).json({ message: "Dates submitted!" });
});

app.post("/api/register", async (req, res) => {
  const allowRegisters = process.env.ALLOW_REGISTER.toLowerCase() === "true";
  console.log(allowRegisters);
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
