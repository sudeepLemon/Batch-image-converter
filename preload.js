const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('api', {
  selectInputFolder: () => ipcRenderer.invoke('select-input-folder'),
  selectOutputFolder: () => ipcRenderer.invoke('select-output-folder'),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  saveFile: (outputFolder, fileName, data) => ipcRenderer.invoke('save-file', outputFolder, fileName, data),
  revealFile: (filePath) => ipcRenderer.invoke('reveal-file', filePath),
  // Drag & drop support: resolve the real filesystem path of a dropped File,
  // then ask the main process what to do with it.
  getPathForFile: (file) => webUtils.getPathForFile(file),
  resolveDroppedInputFolder: (droppedPath) => ipcRenderer.invoke('resolve-dropped-input-folder', droppedPath),
  resolveDroppedOutputFolder: (droppedPath) => ipcRenderer.invoke('resolve-dropped-output-folder', droppedPath)
});
