const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),
  isWindowMaximized: () => ipcRenderer.invoke('window-is-maximized'),

  // Navigation listeners
  onNewTab: (callback) => ipcRenderer.on('new-tab', callback),
  onCloseTab: (callback) => ipcRenderer.on('close-tab', callback),
  onReloadPage: (callback) => ipcRenderer.on('reload-page', callback),
  onForceReloadPage: (callback) => ipcRenderer.on('force-reload-page', callback),
  onGoBack: (callback) => ipcRenderer.on('go-back', callback),
  onGoForward: (callback) => ipcRenderer.on('go-forward', callback),
  onGoHome: (callback) => ipcRenderer.on('go-home', callback),

  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});