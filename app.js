require("dotenv").config();
const SftpClient = require("ssh2-sftp-client");
const express = require("express");
const { readFileSync } = require("fs");
const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");

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

app.get("/connect", async (req, res) => {
  const { isConnected } = await connect();

  if (!isConnected) {
    res.render("error");
  }

  const result = await sftp.fastGet(
    "./webspace/httpdocs/kinko.nl/wp-content/themes/Avada-Child-Theme/testpicker.js",
    "./downloads/testpicker.js"
  );

  const dateFile = readFileSync("./downloads/testpicker.js", "utf-8");
  const lines = dateFile.split("\n");
  const matchingLine = lines.find((line) => line.match(/const filterDatums/));
  console.log(typeof(matchingLine));
  const matchingFilterDates = matchingLine.match(/\[(.*?)\]/)
//   const testings = eval(matchingLine);
  console.log(matchingFilterDates);

  res.render("success", { sftp });
});

app.get("/", (req, res) => {
  res.render("home");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
