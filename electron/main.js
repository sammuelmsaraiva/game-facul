// ============================
// Neon Escape - Electron Main Process
// ============================
// Carrega o build estático do Next.js (gerado em ./out/) numa BrowserWindow.
// Para dev rápido com hot-reload, usa http://localhost:3099 quando ELECTRON_DEV=1.

const { app, BrowserWindow, Menu, shell } = require("electron");
const path = require("path");

const isDev = process.env.ELECTRON_DEV === "1";

let mainWindow = null;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 760, // pequena margem para barra de título
    minWidth: 960,
    minHeight: 600,
    backgroundColor: "#0a0a12",
    title: "Neon Escape: Revolta da IA",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      // Sem preload — o jogo é 100% client-side via canvas
    },
  });

  // Ocultar a barra de menu do Electron (mantém apenas atalhos do sistema)
  Menu.setApplicationMenu(null);

  if (isDev) {
    mainWindow.loadURL("http://localhost:3099");
    // mainWindow.webContents.openDevTools();
  } else {
    // No build estático, o Next gera ./out/index.html
    const indexPath = path.join(__dirname, "..", "out", "index.html");
    mainWindow.loadFile(indexPath);
  }

  // Links externos (ex: Github do projeto) abrem no navegador padrão
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createMainWindow();

  app.on("activate", () => {
    // macOS: recria janela quando o ícone do dock é clicado e nenhuma janela aberta
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on("window-all-closed", () => {
  // No Windows/Linux fecha o app quando todas as janelas fecham (padrão)
  if (process.platform !== "darwin") app.quit();
});
