const { contextBridge, ipcRenderer } = require('electron');

const api = {
  database: {
    getProducts: () => ipcRenderer.invoke('db:getProducts'),
    addProduct: (product) => ipcRenderer.invoke('db:addProduct', product),
    updateProduct: (id, product) => ipcRenderer.invoke('db:updateProduct', id, product),
    deleteProduct: (id) => ipcRenderer.invoke('db:deleteProduct', id),
    getAvatars: () => ipcRenderer.invoke('db:getAvatars'),
    addAvatar: (avatar) => ipcRenderer.invoke('db:addAvatar', avatar),
  },
  shell: {
    openExternal: (url) => ipcRenderer.invoke('openExternal', url),
    openFile: (filePath) => ipcRenderer.invoke('openFile', filePath),
    openPath: (filePath) => ipcRenderer.invoke('openPath', filePath),
  },
  dialog: {
    selectFile: () => ipcRenderer.invoke('dialog:selectFile'),
    selectMultipleFiles: () => ipcRenderer.invoke('dialog:selectMultipleFiles'),
    selectDirectory: () => ipcRenderer.invoke('dialog:selectDirectory'),
    selectFilesOrFolders: () => ipcRenderer.invoke('dialog:selectFilesOrFolders'),
  },
  fs: {
    exists: (filePath) => ipcRenderer.invoke('fs:exists', filePath),
    moveToArchive: (filePath) => ipcRenderer.invoke('fs:moveToArchive', filePath),
    getArchiveDir: () => ipcRenderer.invoke('fs:getArchiveDir'),
  },
  fetch: {
    thumbnail: (boothUrl) => ipcRenderer.invoke('fetch:thumbnail', boothUrl),
  },
  data: {
    export: () => ipcRenderer.invoke('data:export'),
    import: () => ipcRenderer.invoke('data:import'),
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (settings) => ipcRenderer.invoke('settings:update', settings),
  }
};

contextBridge.exposeInMainWorld('electronAPI', api);