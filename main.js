const { app, BrowserWindow } = require("electron");
const crypto = require("crypto");
const nodeWatch = require("node-watch");
const fs = require("fs");
try {
  require("electron-reloader")(module);
} catch (_) {}

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  win.loadFile("./views/index.html");
};

const public = fs.readFileSync("./public.pem", "utf8");

const encryptAndStore = () => {
  const data = fs.readFileSync("./data.json", "utf8");

  const encryptData = crypto.publicEncrypt(
    {
      key: public,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    Buffer.from(JSON.stringify(data))
  );

  const cypherStore = JSON.parse(
    fs.readFileSync("./machine_data/data.json", "utf8")
  );

  cypherStore.cypher.push({
    cypherData: encryptData,
    time: new Date().toISOString(),
  });

  fs.writeFileSync("machine_data/data.json", JSON.stringify(cypherStore));
  console.log("changed");
};

nodeWatch("./data.json", { recursive: true }, encryptAndStore);

// For testing purpose only
const emptyCipherArray = () => {
  const cypherStore = JSON.parse(
    fs.readFileSync("./machine_data/data.json", "utf8")
  );
  cypherStore.cypher = [];
  fs.writeFileSync("machine_data/data.json", JSON.stringify(cypherStore));
};
// emptyCipherArray();

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
