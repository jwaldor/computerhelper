/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  Tray,
  nativeImage,
  Menu,
} from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;
let popupWindow: BrowserWindow | null = null; // Declare popup window variable

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.close();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();

  app.whenReady().then(() => {
    const RESOURCES_PATH = app.isPackaged
      ? path.join(process.resourcesPath, 'assets')
      : path.join(__dirname, '../../assets');

    const getAssetPath = (...paths: string[]): string => {
      return path.join(RESOURCES_PATH, ...paths);
    };
    const icon = nativeImage.createFromPath(getAssetPath('icons/48x48.png')); // Updated path to the icon
    tray = new Tray(icon);
    const contextMenu = Menu.buildFromTemplate([
      // { label: 'Item1', type: 'radio' },
      // { label: 'Item2', type: 'radio' },
      // { label: 'Item3', type: 'radio', checked: true },
      // { label: 'Item4', type: 'radio' }
    ]);

    tray.setContextMenu(contextMenu);
    tray.setToolTip('This is my application');
    tray.setTitle('Computer helper artificial intelligence');
    // Call createPopupWindow when the tray icon is clicked
    tray.on('click', () => {
      if (popupWindow) {
        popupWindow.focus(); // Bring to front if already open
      } else {
        const createPopupWindow = () => {
          popupWindow = new BrowserWindow({
            width: 300,
            height: 200,
            frame: false, // Frameless window
            alwaysOnTop: true, // Keep it above other windows
            x: tray.getBounds().x, // Position it relative to the tray
            y: tray.getBounds().y,
            webPreferences: {
              nodeIntegration: true,
              contextIsolation: false,
            },
          });

          popupWindow.loadURL(resolveHtmlPath('index.html')); // Assuming your React app runs on this URL

          popupWindow.on('closed', () => {
            popupWindow = null;
          });
        };
        createPopupWindow(); // Create new popup window
      }
    });
    // note: your contextMenu, Tooltip and Title code will go here!
  });
};

ipcMain.on('hide-window', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.hide();
});

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);

let tray;
