const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
// Load .env from working directory, then fallback to backend/.env and repo root .env
dotenv.config();
const rootEnv = path.resolve(__dirname, "..", "..", ".env");
const backendEnv = path.resolve(__dirname, "..", ".env");
let _envLoadedInfo = { source: "default" };
if (!process.env.SFTP_HOSTNAME && fs.existsSync(backendEnv)) {
  dotenv.config({ path: backendEnv });
  _envLoadedInfo = { path: backendEnv };
} else if (!process.env.SFTP_HOSTNAME && fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv });
  _envLoadedInfo = { path: rootEnv };
}
const SFTPClient = require("ssh2-sftp-client");
const mongoose = require("mongoose");

const LOG_DIR = path.join(__dirname, "..", "tmp");
const LOG_PATH = path.join(LOG_DIR, "service-check.log");

if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
// log env-loaded info (if any) now that LOG_PATH exists
if (_envLoadedInfo) appendLog(_envLoadedInfo);

function appendLog(obj) {
  const entry = { time: new Date().toISOString(), ...obj };
  fs.appendFileSync(LOG_PATH, JSON.stringify(entry) + "\n");
}

const VERBOSE = process.env.SERVICE_CHECK_VERBOSE === "1";
function logDebug(...args) {
  if (VERBOSE) console.log(...args);
  try {
    const short = args.map((a) =>
      typeof a === "string" ? a : JSON.stringify(a),
    );
    appendLog({ event: "debug", msg: short.join(" | ") });
  } catch (e) {
    if (VERBOSE) console.error("logDebug failed", e);
  }
}

async function checkSftp() {
  const sftp = new SFTPClient();
  const cfg = {
    host: process.env.SFTP_HOSTNAME || process.env.SFTP_HOST,
    port: process.env.SFTP_PORT ? Number(process.env.SFTP_PORT) : 22,
    username: process.env.SFTP_USERNAME || process.env.SFTP_USER,
    readyTimeout: 10000,
  };
  // support multiple ways of providing auth:
  // - private key content via SFTP_PRIVATE_KEY or SSH_PRIVATE_KEY
  // - path to private key via SSH_KEY_PATH (reads file)
  // - password via SFTP_PASSWORD
  if (process.env.SFTP_PRIVATE_KEY) {
    cfg.privateKey = process.env.SFTP_PRIVATE_KEY.replace(/\\n/g, "\n");
  } else if (process.env.SSH_PRIVATE_KEY) {
    cfg.privateKey = process.env.SSH_PRIVATE_KEY.replace(/\\n/g, "\n");
  } else if (process.env.SSH_KEY_PATH) {
    try {
      cfg.privateKey = fs.readFileSync(process.env.SSH_KEY_PATH, "utf8");
    } catch (e) {
      // ignore, will try password fallback
    }
  }
  if (process.env.SSH_PASSPHRASE) cfg.passphrase = process.env.SSH_PASSPHRASE;
  if (!cfg.privateKey && process.env.SFTP_PASSWORD) {
    cfg.password = process.env.SFTP_PASSWORD;
  }

  appendLog({ event: "sftp_connect_start", host: cfg.host, port: cfg.port });
  logDebug("sftp cfg", {
    host: cfg.host,
    port: cfg.port,
    username: cfg.username,
  });
  const sftpStart = Date.now();
  try {
    await sftp.connect(cfg);
    appendLog({
      event: "sftp_connect_success",
      duration_ms: Date.now() - sftpStart,
    });
  } catch (err) {
    appendLog({
      event: "sftp_connect_error",
      message: err.message,
      code: err.code,
    });
    logDebug("sftp connect error full", err);
    throw new Error(`SFTP connect failed: ${err.message}`);
  }

  const testDir = process.env.SFTP_TEST_DIR || process.env.REMOTE_DIR || ".";
  const listStart = Date.now();
  try {
    const list = await sftp.list(testDir);
    appendLog({
      event: "sftp_list_success",
      path: testDir,
      count: list.length,
      duration_ms: Date.now() - listStart,
    });
    // optional write/read/delete test
    if (
      process.env.SFTP_WRITE_TEST === "1" ||
      process.env.SFTP_WRITE_TEST === "true"
    ) {
      const localTmp = path.join(LOG_DIR, `sftp-write-${Date.now()}.txt`);
      const remoteName = `ci-test-${Date.now()}.txt`;
      const remotePath =
        testDir === "."
          ? remoteName
          : `${testDir.replace(/\/$/, "")}/${remoteName}`;
      const content = `ci-test ${new Date().toISOString()}\n`;
      fs.writeFileSync(localTmp, content, "utf8");
      appendLog({ event: "sftp_write_start", remote: remotePath });
      const writeStart = Date.now();
      try {
        await sftp.put(localTmp, remotePath);
        appendLog({
          event: "sftp_write_success",
          remote: remotePath,
          duration_ms: Date.now() - writeStart,
        });
      } catch (err) {
        appendLog({ event: "sftp_write_error", message: err.message });
        try {
          await sftp.end();
        } catch (_) {}
        throw new Error(`SFTP write failed: ${err.message}`);
      }

      // verify remote exists and download
      appendLog({ event: "sftp_verify_start", remote: remotePath });
      const downloadStart = Date.now();
      try {
        await sftp.get(remotePath, localTmp + ".down");
        const downloaded = fs.readFileSync(localTmp + ".down", "utf8");
        const ok = downloaded === content;
        appendLog({
          event: "sftp_verify_success",
          remote: remotePath,
          match: ok,
          duration_ms: Date.now() - downloadStart,
        });
      } catch (err) {
        appendLog({ event: "sftp_verify_error", message: err.message });
        try {
          await sftp.delete(remotePath);
        } catch (_) {}
        try {
          await sftp.end();
        } catch (_) {}
        throw new Error(`SFTP verify failed: ${err.message}`);
      }

      // cleanup remote and local
      try {
        await sftp.delete(remotePath);
        appendLog({ event: "sftp_cleanup_success", remote: remotePath });
      } catch (err) {
        appendLog({ event: "sftp_cleanup_error", message: err.message });
      }
      try {
        fs.unlinkSync(localTmp);
      } catch (_) {}
      try {
        fs.unlinkSync(localTmp + ".down");
      } catch (_) {}
    }

    await sftp.end();
    return { path: testDir, count: list.length };
  } catch (err) {
    appendLog({
      event: "sftp_list_error",
      message: err.message,
      code: err.code,
    });
    logDebug("sftp list error full", err);
    try {
      await sftp.end();
    } catch (_) {}
    throw new Error(`SFTP list failed: ${err.message}`);
  }
}

async function checkMongo() {
  const uri = process.env.ATLAS_URI || process.env.MONGO_URI;
  if (!uri) throw new Error("ATLAS_URI not provided");
  appendLog({ event: "mongo_connect_start" });
  logDebug("mongo uri", uri ? uri.substring(0, 60) + "..." : "empty");
  const mongoStart = Date.now();
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
    });
    const admin = mongoose.connection.db.admin();
    const res = await admin.ping();
    await mongoose.disconnect();
    appendLog({
      event: "mongo_ping",
      result: res,
      duration_ms: Date.now() - mongoStart,
    });
    return res;
  } catch (err) {
    appendLog({ event: "mongo_error", message: err.message });
    logDebug("mongo full error", err);
    try {
      await mongoose.disconnect();
    } catch (_) {}
    throw new Error(`Mongo check failed: ${err.message}`);
  }
}

async function main() {
  try {
    // clear previous log
    fs.writeFileSync(LOG_PATH, "");
    appendLog({ event: "start" });

    const sftpResult = await checkSftp();
    const mongoResult = await checkMongo();

    appendLog({ event: "success", sftp: sftpResult, mongo: mongoResult });
    console.log("Service check succeeded");
    process.exit(0);
  } catch (err) {
    appendLog({ event: "error", message: err.message, stack: err.stack });
    console.error("Service check failed:", err.message);
    process.exit(2);
  }
}

main();
