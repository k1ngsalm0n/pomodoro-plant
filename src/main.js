const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const db = require("./database");

function createWindow() {
    const win = new BrowserWindow({
        width: 420,
        height: 720,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,  // MUST be true for contextBridge
            nodeIntegration: false   // MUST be false for security
        }
    });

    // Start with login page
    win.loadFile("src/renderer/login.html");
}

app.whenReady().then(createWindow);

// ---- IPC: LOGIN ----
ipcMain.handle("login", (event, { username, password }) => {
    return new Promise((resolve) => {
        db.get(
            "SELECT * FROM users WHERE username = ? AND password = ?",
            [username, password],
            (err, row) => resolve(Boolean(row))
        );
    });
});

// ---- IPC: REGISTER ----
ipcMain.handle("register", (event, { username, password }) => {
    return new Promise((resolve) => {
        db.run(
            "INSERT INTO users (username, password) VALUES (?, ?)",
            [username, password],
            (err) => resolve(!err)
        );
    });
});
