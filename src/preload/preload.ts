import { contextBridge, ipcRenderer } from 'electron';

const api = {
  database: {
    getProducts: () => ipcRenderer.invoke('db:getProducts'),
    addProduct: (product: any) => ipcRenderer.invoke('db:addProduct', product),
    updateProduct: (id: number, product: any) => ipcRenderer.invoke('db:updateProduct', id, product),
    deleteProduct: (id: number) => ipcRenderer.invoke('db:deleteProduct', id),
    getAvatars: () => ipcRenderer.invoke('db:getAvatars'),
    addAvatar: (avatar: any) => ipcRenderer.invoke('db:addAvatar', avatar),
  },
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('openExternal', url),
    openFile: (filePath: string) => ipcRenderer.invoke('openFile', filePath),
  },
  dialog: {
    selectFile: () => ipcRenderer.invoke('dialog:selectFile'),
    selectMultipleFiles: () => ipcRenderer.invoke('dialog:selectMultipleFiles'),
    selectDirectory: () => ipcRenderer.invoke('dialog:selectDirectory'),
  },
  file: {
    archive: (filePath: string) => ipcRenderer.invoke('file:archive', filePath),
  },
  fetch: {
    thumbnail: (boothUrl: string) => ipcRenderer.invoke('fetch:thumbnail', boothUrl),
  },
  data: {
    export: () => ipcRenderer.invoke('data:export'),
    import: () => ipcRenderer.invoke('data:import'),
  }
};

contextBridge.exposeInMainWorld('electronAPI', api);

export type ElectronAPI = typeof api;