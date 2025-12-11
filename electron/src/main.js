const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

function createWindow() {
    const win = new BrowserWindow({
        width: 420,
        height: 720,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: false
        }
    });

    // Load from local static file
    // win.loadURL("http://localhost:5001");
    win.loadFile(path.join(__dirname, "../public/login.html"));
}

app.whenReady().then(createWindow);
