const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("axolotl", { saveKey: (key) => ipcRenderer.invoke("save-key", key) });
