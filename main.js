const { app, BrowserWindow } = require("electron");
const crypto = require("crypto");
const fs = require("fs");

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
  });
  win.loadFile("./views/index.html");
};

const public = fs.readFileSync("./public.pem", "utf8");

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

// app.whenReady().then(() => {
//   createWindow();
//   app.on("activate", () => {
//     if (BrowserWindow.getAllWindows().length === 0) createWindow();
//   });
// });

// app.on("window-all-closed", () => {
//   if (process.platform !== "darwin") app.quit();
// });
