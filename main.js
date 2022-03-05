const { app, BrowserWindow } = require("electron");
const crypto = require("crypto");
const nodeWatch = require("node-watch");
const fs = require("fs");
const express = require("express");
const express_app = express();
const { networkInterfaces } = require("os");
const res = require("express/lib/response");
const http = require("http").Server(express_app);

// remove in production
// try {
//   require("electron-reloader")(module);
// } catch (_) {}

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

const nets = networkInterfaces();
const results = Object.create(null); // Or just '{}', an empty object

for (const name of Object.keys(nets)) {
  for (const net of nets[name]) {
    // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
    if (net.family === "IPv4" && !net.internal) {
      if (!results[name]) {
        results[name] = [];
      }
      results[name].push(net.address);
    }
  }
}
const myip = results["Wi-Fi"][0];

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

http.listen(3000, myip, () => console.log("listening"));
express_app.get("/", (req, res) => {
  res.send("helloo");
});

// Desktop GUI

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
