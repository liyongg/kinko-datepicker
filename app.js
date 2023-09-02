require("dotenv").config();
const SftpClient = require("ssh2-sftp-client");
const express = require("express");
const { readFileSync } = require("fs");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const sftp = new SftpClient({
  debug: true,
});

const sftpConfig = {
  protocol: "sftp",
  //   host: process.env.SFTP_HOSTNAME,
  host: process.env.SFTP_HOSTNAME,
  port: 22, // Default SFTP port
  username: process.env.SFTP_USERNAME,
  privateKey: readFileSync("C:/Users/Li Yong/.ssh/id_ed25519"), // Use this for key-based authentication
  passphrase: process.env.SSH_PASSPHRASE,
//   debug: console.log,
  tryKeyboard: true,
  retries: 1,
};

async function connect() {
  try {
    console.log(sftpConfig);
    console.log("Trying to connect to SFTP server...");
    await sftp.connect(sftpConfig);
    console.log("Connected to SFTP server");
  } catch (error) {
    console.error("Error:", error.message);
  }
}

connect();
