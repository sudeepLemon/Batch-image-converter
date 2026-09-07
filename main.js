const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 980,
    height: 920,
    minWidth: 720,
    minHeight: 640,
    autoHideMenuBar: true,
    backgroundColor: '#5A6BD8',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif', '.tif', '.tiff'];

// ---- Shared: list supported images in a folder (top level only) ----
function scanFolderForImages(folder) {
  const entries = fs.readdirSync(folder, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && IMAGE_EXTENSIONS.includes(path.extname(e.name).toLowerCase()))
    .map((e) => path.join(folder, e.name));
}

// ---- Pick a folder to read images from ----
ipcMain.handle('select-input-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
  if (result.canceled || !result.filePaths.length) return null;
  const folder = result.filePaths[0];
  const files = scanFolderForImages(folder);
  return { folder, files };
});

// ---- Pick a folder to write converted images to ----
ipcMain.handle('select-output-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory', 'createDirectory'] });
  if (result.canceled || !result.filePaths.length) return null;
  return result.filePaths[0];
});

// ---- Resolve a folder dragged straight onto the input folder card ----
ipcMain.handle('resolve-dropped-input-folder', async (event, droppedPath) => {
  try {
    const stat = fs.statSync(droppedPath);
    if (!stat.isDirectory()) return null; // a single file was dropped, not a folder
    const files = scanFolderForImages(droppedPath);
    return { folder: droppedPath, files };
  } catch (err) {
    return null;
  }
});

// ---- Resolve a folder dragged straight onto the output folder card ----
ipcMain.handle('resolve-dropped-output-folder', async (event, droppedPath) => {
  try {
    const stat = fs.statSync(droppedPath);
    if (stat.isDirectory()) return droppedPath;
    return path.dirname(droppedPath); // a file was dropped — use its containing folder
  } catch (err) {
    return null;
  }
});

// ---- Read raw bytes of a file on disk (used for images imported via folder select) ----
ipcMain.handle('read-file', async (event, filePath) => {
  const data = fs.readFileSync(filePath);
  return new Uint8Array(data);
});

// ---- Avoid overwriting existing files in the output folder ----
function uniqueOutputPath(outputFolder, fileName) {
  const ext = path.extname(fileName);
  const base = path.basename(fileName, ext);
  let candidate = path.join(outputFolder, fileName);
  let counter = 1;
  while (fs.existsSync(candidate)) {
    candidate = path.join(outputFolder, `${base} (${counter})${ext}`);
    counter += 1;
  }
  return candidate;
}

// ---- Write a converted image straight to the chosen output folder ----
ipcMain.handle('save-file', async (event, outputFolder, fileName, data) => {
  fs.mkdirSync(outputFolder, { recursive: true });
  const outPath = uniqueOutputPath(outputFolder, fileName);
  fs.writeFileSync(outPath, Buffer.from(data));
  return outPath;
});

// ---- Reveal a saved file in Explorer ----
ipcMain.handle('reveal-file', async (event, filePath) => {
  shell.showItemInFolder(filePath);
});
