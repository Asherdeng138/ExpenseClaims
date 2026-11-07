// Language table: every Chinese string the app can show needs natural British English.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const I=require('../app/src/main/assets/i18n.js'),P=require('../app/src/main/assets/parser.js');
const root=path.resolve(__dirname,'..'),read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const CJK=/[\u4e00-\u9fff]/;
// Not interface text: stored category keys (shown via categoryLabel), the merchant key, demo sample data and Chinese file-name parts built beside an English branch.
// Fragments joined at runtime are listed as well; their full sentences are in the table or PATTERNS.
const ALLOWED=new Set([...P.CATEGORIES,...P.TRIP_COUNTRIES.map(c=>c.zh),'麦当劳','报账文件','_发票合集.pdf','_明细汇总.xlsx','报账备份_','_市内交通报账','年','月','至','报账','_','中文','品牌','网址','公司名','抬头',' 是加密 PDF',' 识别成数字，已给出修正候选，请核对原件','总额前疑似把 ','两种识别结果的','不一致，已留空，请点击候选或对照原件填写','票据上的金额标着']);
const known=s=>ALLOWED.has(s)||Object.prototype.hasOwnProperty.call(I.EN,s)||I.translate('en',s)!==s;
function missingIn(rel,{quote="'",skipLine=()=>false,residual=true}={}){
 const literal=quote==="'"?/'((?:[^'\\\n]|\\.)*)'/g:/"((?:[^"\\\n]|\\.)*)"/g,missing=[];
 for(const raw of read(rel).split(/\r?\n/)){
  const line=raw.replace(/^\s*(\/\/|\*|\/\*).*$/,'');if(!CJK.test(line)||skipLine(line))continue;
  const check=(m,s)=>{if(CJK.test(s)&&!known(s.replace(/\\'/g,"'")))missing.push(s);return "''";};
  const rest=line.replace(literal,check).replace(/"((?:[^"\\\n]|\\.)*)"/g,check).replace(/中文/g,'');
  if(residual&&CJK.test(rest))missing.push('RAW: '+rest.replace(/^.*?([^<>'"`]*[\u4e00-\u9fff][^<>'"`]*).*$/,'$1').slice(0,80));
 }
 return missing;
}
const demo=line=>/TfL · 地铁|界面演示数据/.test(line),logOnly=line=>/console\.error/.test(line);
test('Android and desktop language tables are identical',()=>assert.equal(read('app/src/main/assets/i18n.js'),read('desktop/i18n.cjs'),'Copy app/src/main/assets/i18n.js to desktop/i18n.cjs'));
for(const [rel,opts] of [['app/src/main/assets/app.js',{skipLine:demo}],['app/src/main/assets/scan.js',{skipLine:l=>l.includes('a-z0-9一-')}],['desktop/ui/app.src.js',{}],['desktop/ui/viewer.js',{}],['desktop/service.cjs',{skipLine:logOnly}],['desktop/main.cjs',{skipLine:l=>l.includes('启动失败')||logOnly(l)}],['desktop/preload.cjs',{}],['desktop/ocr-worker.cjs',{}],['desktop/receipt-ocr.js',{residual:false}]])
 test('every Chinese string is translated: '+rel,()=>assert.deepEqual(missingIn(rel,opts),[]));
test('every parser warning and label is translated',()=>{
 const regexSource=/\(\?:|\\\\|\|/;
 const missing=missingIn('app/src/main/assets/parser.js',{residual:false}).filter(s=>!regexSource.test(s)&&!/^[<>(]/.test(s));
 assert.deepEqual(missing,[]);
});
for(const name of ['MainActivity','ReceiptStore','Documents','ExportService','ExportNames','BatchQueue','CropSpec'])
 test('every Android message is translated: '+name,()=>{
  // Messages with a value are covered by the PATTERNS table; their fragments are listed here.
  const fragments=new Set(['正在识别第 ',' 张发票文字…','正在保留第 ',' 个原件…','第 ',' 个文件：','部分文件未导入：','部分文件已保存：','；其余失败，请重新保存','；','、','请确认','确认','取消','分享报账文件']);
  const missing=missingIn('app/src/main/java/com/asher/baozhang/'+name+'.java',{quote:'"',skipLine:l=>l.includes('[\\\\u4e00')}).filter(s=>!fragments.has(s));
  assert.deepEqual(missing,[]);
 });
for(const rel of ['app/src/main/assets/index.html','desktop/ui/index.html','desktop/ui/viewer.html'])
 test('every fixed page text is translated: '+rel,()=>{
  const body=read(rel).replace(/<script[\s\S]*?<\/script>/g,''),texts=[...body.matchAll(/>([^<>]*[\u4e00-\u9fff][^<>]*)</g)].map(m=>m[1].trim()),attrs=[...body.matchAll(/(?:placeholder|aria-label|title|alt)="([^"]*[\u4e00-\u9fff][^"]*)"/g)].map(m=>m[1]);
  assert.deepEqual([...texts,...attrs].filter(s=>!known(s)),[]);
 });
test('English text is British, complete and keeps its placeholders',()=>{
 const american=/\b(color|center|canceled|canceling|organiz|recogniz|gray|license|check out|vacation|apartment|cellphone|meal plan|reimbursable|program\b|analyz|catalog\b|favorite|behavior|labeled|modeled|traveled|traveling)/i;
 for(const [zh,value] of Object.entries(I.EN))for(const en of [].concat(value)){
  assert.ok(!CJK.test(en.replace('语言','')),'Chinese left in the English for: '+zh);
  assert.ok(!american.test(en),'American spelling in: '+en);
  assert.ok(!/  |\s[,.;]/.test(en.replace(/^ · /,'')),'Spacing in: '+en);
  assert.deepEqual([...zh.matchAll(/\{\w+\}/g)].map(m=>m[0]).sort(),[...new Set([...en.matchAll(/\{\w+\}/g)].map(m=>m[0]))].concat([...zh.matchAll(/\{\w+\}/g)].map(m=>m[0]).filter(k=>!en.includes(k))).sort(),'Placeholder mismatch: '+zh);
 }
 assert.deepEqual(P.CATEGORY_EN,['Local travel (Tube)','Long-distance travel','Travel subsistence','Office supplies','Client entertainment']);
});
test('translation, plurals and British date formats',()=>{
 assert.equal(I.t('zh','{n} 张发票',{n:2}),'2 张发票');assert.equal(I.t('en','{n} 张发票',{n:1}),'1 receipt');assert.equal(I.t('en','{n} 张发票',{n:2}),'2 receipts');
 assert.equal(I.t('en','不在表中的文字'),'不在表中的文字');assert.equal(I.translate('zh','发票已保存'),'发票已保存');assert.equal(I.translate('en','发票已保存'),'Receipt saved');
 assert.equal(I.translate('en','部分文件未导入：第 2 个文件：附件超过 50 MB；第 3 个文件：图片解码失败'),'Some files weren’t imported: File 2: The attachment is larger than 50 MB; File 3: The image couldn’t be read');
 assert.equal(I.translate('en','未识别出金额，请手动填写'),'No amount was found. Please enter it by hand.');
 assert.equal(I.fmtDate('en','2026-10-09'),'9 Oct 2026');assert.equal(I.fmtDate('zh','2026-10-09'),'2026-10-09');assert.equal(I.shortDate('en','2026-10-09'),'9 Oct');assert.equal(I.shortDate('zh','2026-10-09'),'10/09');
 assert.equal(I.monthTitle('en',2026,10),'October 2026');assert.equal(I.monthTitle('zh',2026,10),'2026 年 10 月');assert.equal(I.dayTitle('en',10,9),'9 October');
 assert.deepEqual(I.weekdays('en'),['Mon','Tue','Wed','Thu','Fri','Sat','Sun']);assert.equal(I.weekdays('zh',true)[0],'周一');
});
