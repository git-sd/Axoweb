// Axolotl desktop app. Electron runs the scanner's own Next.js server on a free local port,
// hands it the user's TinyFish key, and shows it in a window. The key is asked for on first
// launch and stored encrypted with the operating system's keychain (Electron safeStorage).

const { app, BrowserWindow, Menu, ipcMain, safeStorage, shell, dialog } = require("electron");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const net = require("node:net");
const path = require("node:path");

const KEY_FILE = () => path.join(app.getPath("userData"), "tinyfish-key.bin");
let win = null;
let server = null;
let port = 0;

// ---- the stored TinyFish key -----------------------------------------------------------
function readKey() {
  try {
    const raw = fs.readFileSync(KEY_FILE());
    return safeStorage.isEncryptionAvailable() ? safeStorage.decryptString(raw) : "";
  } catch {
    return "";
  }
}

function saveKey(key) {
  if (!safeStorage.isEncryptionAvailable()) throw new Error("This computer cannot encrypt the key, so it was not saved.");
  fs.mkdirSync(path.dirname(KEY_FILE()), { recursive: true });
  fs.writeFileSync(KEY_FILE(), safeStorage.encryptString(key));
}

// ---- the local scanner server ------------------------------------------------------------
function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.once("error", reject);
    s.listen(0, "127.0.0.1", () => {
      const { port: p } = s.address();
      s.close(() => resolve(p));
    });
  });
}

function serverEntry() {
  return app.isPackaged ? path.join(process.resourcesPath, "server", "server.js") : path.join(__dirname, "..", "server-bundle", "server.js");
}

function waitForServer(p, tries = 100) {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      const sock = net.connect(p, "127.0.0.1");
      sock.once("connect", () => {
        sock.destroy();
        resolve();
      });
      sock.once("error", () => {
        sock.destroy();
        if (n <= 0) reject(new Error("The scanner did not start."));
        else setTimeout(() => attempt(n - 1), 200);
      });
    };
    attempt(tries);
  });
}

async function startServer(key) {
  stopServer();
  port = await freePort();
  const entry = serverEntry();
  if (!fs.existsSync(entry)) throw new Error(`Scanner build not found at ${entry}. Run "npm run bundle" first.`);
  server = spawn(process.execPath, [entry], {
    cwd: path.dirname(entry),
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      NODE_ENV: "production",
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
      TINYFISH_API_KEY: key,
      // One person on their own machine and their own TinyFish account: no website-style
      // limits, and no hosting time limit, so all six tasks fit in a scan.
      SCAN_LIMIT_PER_HOUR: "1000",
      SCAN_DAILY_BUDGET: "1000",
      SCAN_MAX_CONCURRENT: "2",
      SCAN_AGENT_CONCURRENCY: "2",
      SCAN_AGENT_SECONDS: "420",
      SCAN_TOTAL_SECONDS: "900",
      SCAN_MIN_AGENT_SECONDS: "110",
    },
    stdio: "ignore",
    windowsHide: true,
  });
  server.once("exit", () => {
    server = null;
  });
  await waitForServer(port);
}

function stopServer() {
  if (server) {
    server.kill();
    server = null;
  }
}

// ---- window ----------------------------------------------------------------------------------
function createWindow() {
  win = new BrowserWindow({
    width: 1180,
    height: 860,
    minWidth: 760,
    minHeight: 600,
    backgroundColor: "#0c0d10",
    title: "Axolotl",
    icon: path.join(__dirname, "icon.png"),
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  // Links to other sites open in the real browser, never inside the app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => {
    if (!url.startsWith(`http://127.0.0.1:${port}`) && !url.startsWith("file://")) {
      e.preventDefault();
      if (/^https?:\/\//.test(url)) shell.openExternal(url);
    }
  });
  win.on("closed", () => (win = null));
}

async function showScanner(key) {
  try {
    await startServer(key);
    await win.loadURL(`http://127.0.0.1:${port}/`);
  } catch (err) {
    dialog.showErrorBox("Axolotl could not start", String(err.message || err));
  }
}

function showKeyPrompt() {
  win.loadFile(path.join(__dirname, "key.html"));
}

function buildMenu() {
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: "Axolotl",
        submenu: [
          { label: "Change TinyFish key…", click: () => win && showKeyPrompt() },
          { label: "Get a TinyFish key", click: () => shell.openExternal("https://agent.tinyfish.ai") },
          { type: "separator" },
          { role: "quit" },
        ],
      },
      { label: "View", submenu: [{ role: "reload" }, { role: "togglefullscreen" }, { role: "zoomIn" }, { role: "zoomOut" }, { role: "resetZoom" }] },
    ]),
  );
}

ipcMain.handle("save-key", async (_e, raw) => {
  const key = String(raw || "").trim();
  if (!/^sk-[A-Za-z0-9_-]{16,}$/.test(key)) return { ok: false, message: "That does not look like a TinyFish key. It starts with sk-." };
  try {
    saveKey(key);
  } catch (err) {
    return { ok: false, message: err.message };
  }
  showScanner(key);
  return { ok: true };
});

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
  app.whenReady().then(() => {
    buildMenu();
    createWindow();
    const key = readKey();
    if (key) showScanner(key);
    else showKeyPrompt();
  });
  app.on("window-all-closed", () => app.quit());
  app.on("before-quit", stopServer);
}
