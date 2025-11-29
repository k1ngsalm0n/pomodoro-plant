// preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
    register: (data) => ipcRenderer.invoke("register", data),
    login: (data) => ipcRenderer.invoke("login", data)
});
