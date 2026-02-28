const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// 延迟初始化的数据路径
let dataPath;

function getDataPath() {
    if (!dataPath) {
        dataPath = path.join(app.getPath('userData'), 'todos.json');
    }
    return dataPath;
}

function loadData() {
    try {
        const p = getDataPath();
        if (fs.existsSync(p)) {
            return JSON.parse(fs.readFileSync(p, 'utf-8'));
        }
    } catch (e) {
        console.error('读取数据失败:', e);
    }
    return [];
}

function saveData(todos) {
    try {
        fs.writeFileSync(getDataPath(), JSON.stringify(todos, null, 2), 'utf-8');
    } catch (e) {
        console.error('保存数据失败:', e);
    }
}

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 360,
        height: 520,
        minWidth: 280,
        minHeight: 400,
        frame: false,
        transparent: true,
        vibrancy: 'under-window',
        visualEffectState: 'active',
        alwaysOnTop: true,
        resizable: true,
        hasShadow: true,
        roundedCorners: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    mainWindow.loadFile('index.html');

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// IPC 通信：加载 todos
ipcMain.handle('load-todos', () => {
    return loadData();
});

// IPC 通信：保存 todos
ipcMain.handle('save-todos', (event, todos) => {
    saveData(todos);
    return true;
});

// IPC 通信：切换置顶
ipcMain.handle('toggle-always-on-top', () => {
    if (mainWindow) {
        const current = mainWindow.isAlwaysOnTop();
        mainWindow.setAlwaysOnTop(!current);
        return !current;
    }
    return true;
});

// IPC 通信：窗口控制
ipcMain.on('window-minimize', () => {
    if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-close', () => {
    if (mainWindow) mainWindow.close();
});

// IPC 通信：主题同步
ipcMain.on('set-theme', (event, theme) => {
    if (mainWindow) {
        mainWindow.setVibrancy(theme === 'dark' ? 'dark' : 'light');
    }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
