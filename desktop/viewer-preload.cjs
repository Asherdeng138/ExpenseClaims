const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('DesktopViewer',{
 read:()=>ipcRenderer.invoke('bz:viewerRead'),
 language:()=>ipcRenderer.invoke('bz:viewerLanguage'),
 close:()=>ipcRenderer.send('bz:viewerClose')
});
