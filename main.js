// Dependencies

const { app, BrowserWindow } = require("electron");
const ejse = require("ejs-electron");
const crypto = require("crypto");
const nodeWatch = require("node-watch");
const fs = require("fs");
const express = require("express");
const express_app = express();
const { networkInterfaces } = require("os");
const morgan = require("morgan");
const helmet = require("helmet");
const http = require("http").Server(express_app);

// remove in production
// try {
//   require("electron-reloader")(module);
// } catch (_) {}

express_app.use(morgan("dev"));
// express_app(cors());
express_app.use(helmet());

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    center: true,
    resizable: true,
    frame: true,
    transparent: false,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  win.loadFile("./views/index.ejs");
  // win.webContents.openDevTools();
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
const data = JSON.parse(fs.readFileSync("./data.json", "utf8"));
const engineOilTemp = data.data.engine_oil_temp;
const engineOilPressure = data.data.engine_oil_pressure;
const runningStatus = data.data.running_status;
ejse.data("engineOilTemp", engineOilTemp);
ejse.data("engineOilPressure", engineOilPressure);
ejse.data("runningStatus", runningStatus);
ejse.data("myip", myip);
ejse.data("data", `${data["data"]}`);
ejse.data("uid", "696969669");

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
express_app.get("/data", (req, res) => {
  if (req.header("X-Passphrase") === "B@%Z$&%%2LQK@it6") {
    const data = JSON.parse(
      fs.readFileSync("./machine_data/data.json", "utf8")
    );
    res.json(data);
  } else {
    res.status(401).json({ status: "Unauthorized" });
  }
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
