const { contextBridge, ipcRenderer } = require('electron');

const api = {
  database: {
    getProducts: () => ipcRenderer.invoke('db:getProducts'),
    addProduct: (product) => ipcRenderer.invoke('db:addProduct', product),
    updateProduct: (id, product) => ipcRenderer.invoke('db:updateProduct', id, product),
    deleteProduct: (id) => ipcRenderer.invoke('db:deleteProduct', id),
    getAvatars: () => ipcRenderer.invoke('db:getAvatars'),
    addAvatar: (avatar) => ipcRenderer.invoke('db:addAvatar', avatar),
    deleteAvatar: (id) => ipcRenderer.invoke('db:deleteAvatar', id),
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
    moveFolderToArchive: (folderPath) => ipcRenderer.invoke('fs:moveFolderToArchive', folderPath),
    getArchiveDir: () => ipcRenderer.invoke('fs:getArchiveDir'),
    removeEmptyFolder: (folderPath) => ipcRenderer.invoke('fs:removeEmptyFolder', folderPath),
  },
  fetch: {
    thumbnail: (boothUrl) => ipcRenderer.invoke('fetch:thumbnail', boothUrl),
  },
  booth: {
    searchByFilename: (filename) => ipcRenderer.invoke('booth:searchByFilename', filename),
    learnMapping: (filename, boothUrl) => ipcRenderer.invoke('booth:learnMapping', filename, boothUrl),
    selectPurchaseHistoryFiles: () => ipcRenderer.invoke('booth:selectPurchaseHistoryFiles'),
    parseMultiplePurchaseHistories: (htmlFilePaths) => ipcRenderer.invoke('booth:parseMultiplePurchaseHistories', htmlFilePaths),
    resetLearningData: () => ipcRenderer.invoke('booth:resetLearningData'),
    debugLearningData: () => ipcRenderer.invoke('booth:debugLearningData'),
    addManualMapping: (filename, url) => ipcRenderer.invoke('booth:addManualMapping', filename, url),
  },
  zip: {
    listUnitypackages: (zipFilePath) => ipcRenderer.invoke('zip:listUnitypackages', zipFilePath),
    extractUnitypackage: (zipFilePath, unitypackageFileName, outputDir) => ipcRenderer.invoke('zip:extractUnitypackage', zipFilePath, unitypackageFileName, outputDir),
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