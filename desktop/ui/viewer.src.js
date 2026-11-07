import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import {createReceiptViewer} from './viewer.js';
import I18N from '../i18n.cjs';
pdfjs.GlobalWorkerOptions.workerSrc=new URL('../vendor/pdf.worker.min.mjs',location.href).href;
const loadPDF=bytes=>pdfjs.getDocument({data:bytes,cMapUrl:new URL('../vendor/cmaps/',location.href).href,cMapPacked:true,standardFontDataUrl:new URL('../vendor/standard_fonts/',location.href).href,wasmUrl:new URL('../vendor/wasm/',location.href).href,isEvalSupported:false}).promise;
async function drawPDF(pdf,n,max){const page=await pdf.getPage(n),base=page.getViewport({scale:1}),viewport=page.getViewport({scale:Math.min(max/base.width,max/base.height,3)}),canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;return canvas;}
window.DesktopViewer.language().catch(()=>'zh').then(lang=>{I18N.localizeStatic(document,lang);const viewer=createReceiptViewer({read:()=>window.DesktopViewer.read(),loadPDF,drawPDF,closeWindow:()=>window.DesktopViewer.close(),t:(zh,params)=>I18N.t(lang,zh,params)});viewer.open();});
