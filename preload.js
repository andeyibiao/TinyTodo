const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('todoAPI', {
    loadTodos: () => ipcRenderer.invoke('load-todos'),
    saveTodos: (todos) => ipcRenderer.invoke('save-todos', todos),
    toggleAlwaysOnTop: () => ipcRenderer.invoke('toggle-always-on-top'),
    minimizeWindow: () => ipcRenderer.send('window-minimize'),
    closeWindow: () => ipcRenderer.send('window-close'),
    setTheme: (theme) => ipcRenderer.send('set-theme', theme)
});
