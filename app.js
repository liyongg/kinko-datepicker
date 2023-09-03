require("dotenv").config();
const SftpClient = require("ssh2-sftp-client");
const express = require("express");
const { readFileSync, writeFileSync, createReadStream } = require("fs");
const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

const sftp = new SftpClient({
  //   debug: true,
});

const sftpConfig = {
  protocol: "sftp",
  host: process.env.SFTP_HOSTNAME,
  port: 22, // Default SFTP port
  username: process.env.SFTP_USERNAME,
  privateKey: readFileSync("C:/Users/Li Yong/.ssh/id_ed25519"), // Use this for key-based authentication
  passphrase: process.env.SSH_PASSPHRASE,
  //   debug: console.log,
  tryKeyboard: true,
  retries: 0,
  readyTimeout: 1000,
};

async function connect() {
  try {
    console.log("Trying to connect to SFTP server...");
    const sftpConnection = await sftp.connect(sftpConfig);
    console.log("Connected to SFTP server");
    return { isConnected: true, client: sftpConnection };
  } catch (error) {
    console.error("Error:", error.message);
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

app.get("/connect", async (req, res) => {
  const { isConnected } = await connect();

  if (!isConnected) {
    res.render("error");
  }

  const result = await sftp.fastGet(
    process.env.REMOTE_FILE,
    "./downloads/testpicker.js"
  );

  const dateFile = readFileSync("./downloads/testpicker.js", "utf-8");
  const lines = dateFile.split("\n");

  const filteredDates = findAndParseLine(
    lines,
    /const filterDatums/
  ).evaluation;
  const addedMondays = findAndParseLine(lines, /const extraDatums/).evaluation;

  await sftp.end();
  console.log("SFTP connection intentionally broken.");
  res.render("success", { filteredDates, addedMondays });
});

app.get("/", (req, res) => {
  res.render("home");
});

app.post("/final", async (req, res) => {
  const { isConnected } = await connect();

  if (!isConnected) {
    res.render("error");
  }

  const { dates, datesMonday } = req.body;

  const parsedDates = dates.split(",").map((date) => date.trim());
  const parsedMondays = datesMonday.split(",").map((date) => date.trim());

  const dateFile = readFileSync("./downloads/testpicker.js", "utf-8");
  const lines = dateFile.split("\n");

  const parsedDatesInfo = findAndParseLine(
    lines,
    (pattern = /const filterDatums/),
    (replacement = parsedDates)
  );
  const parsedMondaysInfo = findAndParseLine(
    lines,
    (pattern = /const extraDatums/),
    (replacement = parsedMondays)
  );

  lines[parsedDatesInfo.index] = parsedDatesInfo.moddedLine;
  lines[parsedMondaysInfo.index] = parsedMondaysInfo.moddedLine;

  writeFileSync("./downloads/modpicker.js", lines.join("\n"));

  await sftp.fastPut("./downloads/modpicker.js", process.env.REMOTE_FILE);
  await sftp.fastPut(
    "./downloads/testpicker.js",
    process.env.REMOTE_FILE_BACKUP
  );

  await sftp.end();
  console.log("SFTP connection intentionally broken");
  res.render("final", { dates, datesMonday });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
