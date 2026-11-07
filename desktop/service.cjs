const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const {PDFDocument}=require('pdf-lib'),ExcelJS=require('exceljs'),{zipSync,unzipSync}=require('fflate');
const P=require('./parser.cjs'),I18N=require('./i18n.cjs');
const MAX_FILE=50*1024*1024,MAX_BACKUP=250*1024*1024;
const safeText=(v,max=500)=>String(v??'').trim().slice(0,max);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function checkCategory(v){if(!P.CATEGORIES.includes(v))throw Error('请先选择费用种类');return v;}
function checkCurrency(v){if(!P.CURRENCIES.includes(v))throw Error('货币无效');return v;}
function checkSettings(v){if(!v||!['zh','en'].includes(v.language)||!P.CURRENCIES.includes(v.currency))throw Error('设置无效');return {language:v.language,currency:v.currency};}
function checkIds(ids){if(!Array.isArray(ids)||ids.length>1000||ids.some(v=>typeof v!=='string'))throw Error('选择无效');return new Set(ids);}
class Store{
 constructor(root){this.root=root;this.docs=path.join(root,'documents');this.file=path.join(root,'receipts.json');this.state={version:1,receipts:[],days:{},tripCountries:{},settings:{language:'zh',currency:'GBP'}};}
 async init(){await fs.mkdir(this.docs,{recursive:true});try{this.state=JSON.parse(await fs.readFile(this.file,'utf8'));if(this.state.version!==1||!Array.isArray(this.state.receipts)||!this.state.days)throw Error('Unsupported data');}catch(e){if(e.code!=='ENOENT')throw Error('本地数据无法读取。原文件已保留，请从备份恢复或联系维护人员。');}
 // Older data has no settings or receipt currency: those receipts were all pounds. The format version stays 1 because these fields only add to it.
 const saved=this.state.settings||{};this.state.settings={language:saved.language==='en'?'en':'zh',currency:P.normalizeCurrency(saved.currency)};for(const r of this.state.receipts)r.currency=P.currencyOf(r);
 // tripCountries maps a business day to its country code; a business day without one is a UK day.
 const countries=this.state.tripCountries&&typeof this.state.tripCountries==='object'?this.state.tripCountries:{};this.state.tripCountries=Object.fromEntries(Object.entries(countries).filter(([d,c])=>this.state.days[d]==='business'&&P.TRIP_COUNTRIES.some(x=>x.code===c)));
 try{await this.purgeExpired();}catch(e){console.error("回收站清理失败，将重试：",e.message);}return this;}
 list(){return structuredClone(this.state);}
 settings(){return {...this.state.settings};}
 // Receipts still waiting to be confirmed follow the new currency; confirmed ones keep their own.
 async setSettings(fields){const settings=checkSettings(fields),next=this.list();next.settings=settings;for(const r of next.receipts)if(!r.confirmed&&!r.deletedAt)r.currency=settings.currency;return this.commit(next);}
 get(id){const r=this.state.receipts.find(r=>r.id===id);if(!r)throw Error('发票不存在');return r;}
 attachment(r){if(!/^[a-f0-9-]{36}\.(pdf|png|jpg|jpeg|webp)$/i.test(r.blob))throw Error('附件路径无效');return path.join(this.docs,r.blob);}
 async commit(next){const temp=this.file+'.tmp';await fs.writeFile(temp,JSON.stringify(next));const handle=await fs.open(temp,'r+');try{await handle.sync();}finally{await handle.close();}
 try{await fs.copyFile(this.file,this.file+'.bak');}catch(e){if(e.code!=='ENOENT')throw e;}await fs.rename(temp,this.file);this.state=next;return this.list();}
 async importFiles(paths,category){return this.importSources(paths,category);}
 async importSources(paths,category){checkCategory(category);if(!Array.isArray(paths)||!paths.length||paths.length>100)throw Error('每批可导入 1–100 个文件');
 const next=this.list(),added=[],errors=[],duplicates=[],created=[];
 for(const source of paths){let name='拖入的文件';try{const memory=typeof source!=='string';name=memory?safeText(source?.name,240):path.basename(source);const ext=path.extname(name).toLowerCase();if(!['.png','.jpg','.jpeg','.webp','.pdf'].includes(ext))throw Error('仅支持 JPG、PNG、WebP、PDF');let bytes;
 if(memory){if(!(source.bytes instanceof Uint8Array)||!source.bytes.byteLength||source.bytes.byteLength>MAX_FILE)throw Error('文件为空或超过 50 MB');bytes=Buffer.from(source.bytes);const valid=ext==='.pdf'?bytes.subarray(0,5).toString()==='%PDF-':ext==='.png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):ext==='.webp'?bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP':bytes[0]===255&&bytes[1]===216&&bytes[2]===255;if(!valid)throw Error('图片或 PDF 内容与文件格式不符');}
 else{const st=await fs.stat(source);if(!st.isFile()||st.size<=0||st.size>MAX_FILE)throw Error('文件为空或超过 50 MB');bytes=await fs.readFile(source);if(bytes.length>MAX_FILE)throw Error('文件超过 50 MB');}
 const sha=hash(bytes);if(next.receipts.some(r=>r.sha256===sha)){duplicates.push(name);continue;}
 const id=crypto.randomUUID(),blob=id+ext;await fs.writeFile(path.join(this.docs,blob),bytes);created.push(blob);
 const r={id,blob,sha256:sha,filename:name,mime:ext==='.pdf'?'application/pdf':ext==='.png'?'image/png':ext==='.webp'?'image/webp':'image/jpeg',size:bytes.length,category,currency:next.settings.currency,date:'',amountMinor:null,merchant:'',location:'',note:'',ocrText:'',warnings:[],status:'pending',confirmed:false,createdAt:new Date().toISOString()};
 next.receipts.unshift(r);added.push(id);
 }catch(e){errors.push({name,message:e.message});}}
 try{if(added.length)await this.commit(next);}catch(e){for(const name of created)await fs.rm(path.join(this.docs,name),{force:true});throw e;}
 return {data:this.list(),added,errors,duplicates};}
 async read(id){const r=this.get(id);return {bytes:new Uint8Array(await fs.readFile(this.attachment(r))),mime:r.mime,filename:r.filename};}
 async save(id,fields){const r=this.get(id);if(r.deletedAt)throw Error("请先从回收站恢复发票");checkCategory(fields.category);
 const date=safeText(fields.date,10),amount=safeText(fields.amount,20);if(date&&!P.validDate(date))throw Error('请输入有效日期');
 const amountMinor=amount?P.minor(amount):null,merchant=safeText(fields.merchant,150);
 if(fields.confirmed===true&&(!date||amountMinor===null||!merchant))throw Error('确认保存前请填写日期、金额和商家');
 const next=this.list(),at=next.receipts.findIndex(x=>x.id===id);
 next.receipts[at]={...r,category:fields.category,currency:fields.currency===undefined?P.currencyOf(r):checkCurrency(fields.currency),date,amountMinor,merchant,location:safeText(fields.location,200),note:safeText(fields.note,2000),confirmed:fields.confirmed===true,status:fields.confirmed===true?'confirmed':r.ocrText?'review':'pending',updatedAt:new Date().toISOString()};
 return this.commit(next);}
 async recognized(id,result){const r=this.get(id);if(r.confirmed||r.deletedAt)return this.list();const next=this.list(),n=next.receipts.find(x=>x.id===id);
 if(result.error){n.status='failed';n.warnings=[safeText(result.error,500)];}
 else{const text=safeText(result.text,100000);let parsed=P.parse(text,{currency:P.currencyOf(n)});
 // A receipt dated on a marked trip day uses that country's currency (pounds in the UK, euros elsewhere).
 const tripCurrency=P.tripCurrencyOn(n.date||parsed.date,next.days,next.tripCountries);if(tripCurrency&&tripCurrency!==n.currency){n.currency=tripCurrency;parsed=P.parse(text,{currency:tripCurrency});}
 n.ocrText=text;n.date=n.date||parsed.date;n.merchant=n.merchant||P.merchantLabel(parsed.merchant,this.state.settings.language);
 if(n.amountMinor===null&&parsed.amount)n.amountMinor=P.minor(parsed.amount);
 n.warnings=[...parsed.warnings,...(Array.isArray(result.warnings)?result.warnings.map(v=>safeText(v,300)):[])];n.status='review';}
 return this.commit(next);}
 async remove(ids){const set=checkIds(ids),removed=this.state.receipts.filter(r=>set.has(r.id)),next=this.list();next.receipts=next.receipts.filter(r=>!set.has(r.id));await this.commit(next);for(const r of removed)await fs.rm(this.attachment(r),{force:true});return this.list();}
 async archive(ids){const set=checkIds(ids),next=this.list();for(const id of set){const r=next.receipts.find(r=>r.id===id);if(!r||r.deletedAt)throw Error('发票不存在或已在回收站');r.archivedAt=r.archivedAt||Date.now();}return this.commit(next);}
 async trash(ids,now=Date.now()){const set=checkIds(ids),next=this.list();for(const id of set){const r=next.receipts.find(r=>r.id===id);if(!r||!r.archivedAt)throw Error('只能从归档区移入回收站');r.deletedAt=r.deletedAt||now;}return this.commit(next);}
 async recover(ids,now=Date.now()){const set=checkIds(ids),next=this.list();for(const id of set){const r=next.receipts.find(r=>r.id===id);if(!r||!r.deletedAt||now-r.deletedAt>=30*86400000)throw Error('恢复期限已到，请刷新回收站');delete r.deletedAt;}return this.commit(next);}
 async unarchive(ids){const set=checkIds(ids),next=this.list();for(const id of set){const r=next.receipts.find(r=>r.id===id);if(!r||r.deletedAt)throw Error('请先恢复发票');delete r.archivedAt;}return this.commit(next);}
 async purgeExpired(now=Date.now()){const expired=this.state.receipts.filter(r=>r.deletedAt&&now-r.deletedAt>=30*86400000);if(!expired.length)return false;const ids=new Set(expired.map(r=>r.id));for(const r of expired){if(!this.state.receipts.some(o=>!ids.has(o.id)&&o.blob===r.blob))await fs.rm(this.attachment(r),{force:true});}const next=this.list();next.receipts=next.receipts.filter(r=>!ids.has(r.id));await this.commit(next);await fs.copyFile(this.file,this.file+'.bak');return true;}
 async mark(from,to,type,country='GB'){if(!P.validDate(from)||!P.validDate(to)||to<from||!['business','office','holiday',''].includes(type))throw Error('日历范围无效');if(type==='business'&&!P.TRIP_COUNTRIES.some(c=>c.code===country))throw Error('出差国家无效');let day=new Date(from+'T00:00:00Z'),last=new Date(to+'T00:00:00Z');if((last-day)/86400000>730)throw Error('一次最多标记两年');const next=this.list();while(day<=last){const key=day.toISOString().slice(0,10);if(type)next.days[key]=type;else delete next.days[key];next.tripCountries=next.tripCountries||{};if(type==='business')next.tripCountries[key]=country;else delete next.tripCountries[key];day.setUTCDate(day.getUTCDate()+1);}return this.commit(next);}
 exportRows(q){checkCategory(q.category);if(!P.validDate(q.from)||!P.validDate(q.to)||q.to<q.from)throw Error('日期范围无效');const set=checkIds(q.ids);if(!set.size)throw Error('请勾选发票');
 const rows=[...set].map(id=>this.get(id));if(rows.some(r=>r.deletedAt||!r.confirmed||r.category!==q.category||r.date<q.from||r.date>q.to))throw Error('选中的发票尚未核对，或不属于当前分类和日期');return rows.sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));}
 async export(q,destination,toPNG){const rows=this.exportRows(q);const pdf=await PDFDocument.create(),details=[];let page=1;
 for(const r of rows){const first=page,bytes=await fs.readFile(this.attachment(r));
 if(r.mime==='application/pdf'){const source=await PDFDocument.load(bytes);if(source.isEncrypted)throw Error(r.filename+' 是加密 PDF');if(page-1+source.getPageCount()>300)throw Error('一次最多合并 300 页，请分批导出');for(const copied of await pdf.copyPages(source,source.getPageIndices())){pdf.addPage(copied);page++;}}
 else{if(page>300)throw Error('一次最多合并 300 页');let image;try{image=r.mime==='image/jpeg'?await pdf.embedJpg(bytes):r.mime==='image/png'?await pdf.embedPng(bytes):await pdf.embedPng(await toPNG(bytes));}catch{image=await pdf.embedPng(await toPNG(bytes));}const p=pdf.addPage([595,842]),scale=Math.min(555/image.width,802/image.height),w=image.width*scale,h=image.height*scale;p.drawImage(image,{x:(595-w)/2,y:(842-h)/2,width:w,height:h});page++;}
 details.push({...r,pdfPages:first===page-1?String(first):first+'–'+(page-1)});}
 const language=this.state.settings.language,t=zh=>I18N.t(language,zh),category=P.categoryLabel(q.category,language),format=c=>'"'+P.CURRENCY_SYMBOLS[c]+'"#,##0.00';
 const wb=new ExcelJS.Workbook();wb.creator=t('随手报账');const sheet=wb.addWorksheet(t('发票明细'));
 sheet.columns=[{header:t('日期'),key:'date',width:15},{header:t('费用种类'),key:'category',width:23},{header:t('商家'),key:'merchant',width:30},{header:t('金额'),key:'amount',width:18},{header:t('货币'),key:'currency',width:10},{header:t('备注'),key:'note',width:35},{header:t('原文件名'),key:'filename',width:36},{header:t('合并 PDF 页码'),key:'pdfPages',width:18}];
 details.forEach(r=>{const currency=P.currencyOf(r);sheet.addRow({...r,category:P.categoryLabel(r.category,language),amount:r.amountMinor/100,currency}).getCell('amount').numFmt=format(currency);});
 // One total per currency: amounts in different currencies are never added together.
 const byCurrency=P.totals(rows),used=P.CURRENCIES.filter(c=>byCurrency[c]);for(const currency of used)sheet.addRow({merchant:t('合计'),amount:byCurrency[currency]/100,currency}).getCell('amount').numFmt=format(currency);sheet.autoFilter={from:'A1',to:'H'+(rows.length+1)};sheet.views=[{state:'frozen',ySplit:1}];
 const summary=wb.addWorksheet(t('分类汇总'));summary.columns=[{header:t('费用种类'),key:'category',width:24},{header:t('开始日期'),key:'from',width:16},{header:t('结束日期'),key:'to',width:16},{header:t('发票数量'),key:'count',width:14},{header:t('合计'),key:'amount',width:18},{header:t('货币'),key:'currency',width:10}];for(const currency of used)summary.addRow({category,from:q.from,to:q.to,count:rows.filter(r=>P.currencyOf(r)===currency).length,amount:byCurrency[currency]/100,currency}).getCell('amount').numFmt=format(currency);
 for(const ws of [sheet,summary]){ws.getRow(1).font={bold:true,color:{argb:'FFFFFFFF'}};ws.getRow(1).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF246B5B'}};ws.getRow(1).height=26;ws.eachRow(row=>{row.alignment={vertical:'middle',wrapText:true};});}
 const names=P.exportNames(q.category,q.from,q.to,language),pdfBytes=await pdf.save(),xlsxBytes=await wb.xlsx.writeBuffer();const stamp=new Date().toISOString().replace(/[:.]/g,'-');const folder=await fs.mkdtemp(path.join(destination,names.base+'_'+stamp+'_'));
 try{await fs.writeFile(path.join(folder,names.pdf),pdfBytes);await fs.writeFile(path.join(folder,names.xlsx),Buffer.from(xlsxBytes));}catch(e){await fs.rm(folder,{recursive:true,force:true});throw e;}return {folder,pdfName:names.pdf,xlsxName:names.xlsx,count:rows.length,pages:page-1,totals:byCurrency,totalMinor:used.length===1?byCurrency[used[0]]:null,receiptIds:rows.map(r=>r.id)};}
 async backup(target){const entries={'receipts.json':Buffer.from(JSON.stringify(this.state))};let total=entries['receipts.json'].length;for(const r of this.state.receipts){const bytes=await fs.readFile(this.attachment(r));total+=bytes.length;if(total>MAX_BACKUP)throw Error('备份超过 250 MB，请直接复制应用数据文件夹');entries['documents/'+r.blob]=bytes;}await fs.writeFile(target,zipSync(entries,{level:1}));return {count:this.state.receipts.length};}
 async restore(source){const st=await fs.stat(source);if(st.size>MAX_BACKUP)throw Error('备份超过 250 MB');let expanded=0;const files=unzipSync(await fs.readFile(source),{filter:e=>{expanded+=e.originalSize;if(expanded>MAX_BACKUP||e.originalSize>MAX_FILE)throw Error('备份体积超过限制');return true;}});
 if(!files['receipts.json'])throw Error('不是电脑版报账备份');const data=JSON.parse(Buffer.from(files['receipts.json']).toString());if(data.version!==1||!Array.isArray(data.receipts)||data.receipts.length>1000||!data.days||typeof data.days!=='object')throw Error('备份格式不支持');
 const next=this.list(),pending=[],hashes=new Set(next.receipts.map(r=>r.sha256));for(const r of data.receipts){checkCategory(r.category);if(typeof r.blob!=='string'||!/^[a-f0-9-]{36}\.(pdf|png|jpg|jpeg|webp)$/i.test(r.blob))throw Error('备份附件名称无效');const bytes=files['documents/'+r.blob];if(!bytes||hash(bytes)!==r.sha256)throw Error('备份附件缺失或校验失败');if(hashes.has(r.sha256))continue;
 for(const k of ['archivedAt','deletedAt'])if(r[k]!==undefined&&(!Number.isSafeInteger(r[k])||r[k]<=0||r[k]>Date.now()))throw Error('备份归档或删除时间无效');if(r.deletedAt&&!r.archivedAt)throw Error('备份回收站状态无效');if(r.deletedAt&&Date.now()-r.deletedAt>=30*86400000)continue;const id=crypto.randomUUID(),blob=id+path.extname(r.blob).toLowerCase(),amount=r.amountMinor;if(amount!==null&&(!Number.isSafeInteger(amount)||amount<=0||amount>99999999999))throw Error('备份金额无效');if(r.date&&!P.validDate(r.date))throw Error('备份日期无效');if(r.currency!==undefined)checkCurrency(r.currency);
 const restored={id,blob,sha256:r.sha256,filename:safeText(r.filename,240),mime:blob.endsWith('.pdf')?'application/pdf':blob.endsWith('.png')?'image/png':blob.endsWith('.webp')?'image/webp':'image/jpeg',size:bytes.length,category:r.category,currency:P.currencyOf(r),date:r.date||'',amountMinor:amount,merchant:safeText(r.merchant,150),location:safeText(r.location,200),note:safeText(r.note,2000),ocrText:safeText(r.ocrText,100000),warnings:Array.isArray(r.warnings)?r.warnings.map(v=>safeText(v,300)):[],confirmed:r.confirmed===true&&!!r.date&&amount>0&&!!r.merchant,status:r.confirmed===true&&!!r.date&&amount>0&&!!r.merchant?'confirmed':r.ocrText?'review':'pending',createdAt:safeText(r.createdAt,60)};
 if(r.archivedAt)restored.archivedAt=r.archivedAt;if(r.deletedAt)restored.deletedAt=r.deletedAt;next.receipts.push(restored);pending.push({blob,bytes});hashes.add(r.sha256);}
 next.tripCountries=next.tripCountries||{};for(const [date,type] of Object.entries(data.days))if(P.validDate(date)&&['business','office','holiday'].includes(type)&&!next.days[date]){next.days[date]=type;const country=data.tripCountries&&data.tripCountries[date];if(type==='business'&&P.TRIP_COUNTRIES.some(c=>c.code===country))next.tripCountries[date]=country;}
 const written=[];try{for(const p of pending){await fs.writeFile(path.join(this.docs,p.blob),p.bytes);written.push(p.blob);}await this.commit(next);}catch(e){for(const name of written)await fs.rm(path.join(this.docs,name),{force:true});throw e;}return {count:pending.length,data:this.list()};}
}
module.exports={Store,hash};
