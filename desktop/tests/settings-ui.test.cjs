// Language and currency settings on the Windows UI (built ui/app.js, simulated Desktop bridge). Electron dialogs, OCR and real files are not executed here.
const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
// The language picker keeps both languages on purpose, so nobody gets stuck in one they can't read.
const CJK=/[一-鿿]/,picker=text=>text.replace(/中文/g,'').replace(/语言/g,''),english=text=>!CJK.test(picker(text)),chinese=text=>picker(text).split('\n').filter(l=>CJK.test(l)).join(' | ');
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
 try{const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   const r=(id,date,category,amountMinor,currency,confirmed=true,extra={})=>({id,filename:id+'.png',mime:'image/png',size:2048,category,date,amountMinor,currency,merchant:confirmed?'Tesco':'',location:'London',note:'',ocrText:'',warnings:[],confirmed,status:confirmed?'confirmed':'pending',...extra});
   const saved=JSON.parse(sessionStorage.getItem('state')||'null');
   const state=saved||{version:1,settings:{language:'zh',currency:'GBP'},days:{'2026-10-09':'business','2026-10-10':'business'},receipts:[r('gbp-meal','2026-10-09','出差餐补',12000,'GBP'),r('eur-meal','2026-10-09','出差餐补',4000,'EUR'),r('city','2026-10-09','市内交通（地铁）',2000,'GBP'),r('open','','出差餐补',null,'GBP',false,{ocrText:'REWE\n09.10.2026\nSumme 1.234,56 EUR\nMwSt 19% 197,12\nKarte 1.234,56',warnings:['商家名称为候选结果，请核对；所在地需手动填写']})]};
   const keep=()=>sessionStorage.setItem('state',JSON.stringify(state));window.__state=state;window.__saved=[];
   window.Desktop={list:async()=>structuredClone(state),read:async()=>({bytes:Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j/a0AAAAASUVORK5CYII='),c=>c.charCodeAt(0)),mime:'image/png'}),
    settings:async s=>{state.settings=s;for(const x of state.receipts)if(!x.confirmed)x.currency=s.currency;keep();return structuredClone(state);},
    save:async(id,f)=>{window.__saved.push({...f});const x=state.receipts.find(o=>o.id===id);Object.assign(x,f,{amountMinor:f.amount?Math.round(Number(f.amount)*100):null,status:f.confirmed?'confirmed':'review'});keep();return structuredClone(state);},
    export:async q=>({folder:'x',pdfName:'a.pdf',xlsxName:'a.xlsx',count:q.ids.length,pages:1}),archiveExport:async()=>structuredClone(state),openExport:async()=>{}};
  });
  await page.clock.setFixedTime(new Date('2026-10-20T12:00:00'));
  await page.goto(process.env.BAOZHANG_UI_URL||pathToFileURL(path.resolve(__dirname,'../ui/index.html')).href);await page.waitForSelector('body[data-ready=true]');
  const open=async()=>{await page.locator('#settingsBtn').click();await page.locator('#settingsDialog[open]').waitFor();};
  assert.equal(await page.evaluate(()=>document.documentElement.lang),'zh-CN');assert.match(await page.locator('.sidebar').innerText(),/英镑 GBP · 离线识别/);
  // English everywhere, including text fixed in the HTML.
  await open();await page.locator('#settingLanguage').selectOption('en');await page.waitForFunction(()=>document.documentElement.lang==='en-GB');
  let text=await page.locator('body').innerText();assert.ok(english(text),chinese(text));await page.locator('#closeSettings').click();assert.match(await page.locator('.sidebar').innerText(),/Pounds \(GBP\) · Scans offline/);assert.equal(await page.title(),'BaoZhang · Desktop');assert.match(await page.locator('.stat').nth(2).innerText(),/1 receipt\b/);
  for(const tab of ['inbox','archive','export','calendar']){await page.locator('nav [data-tab='+tab+']').click();text=await page.locator('body').innerText();assert.ok(english(text),tab+': '+chinese(text));}
  if(process.env.BAOZHANG_UI_SCREENSHOT)await page.screenshot({path:process.env.BAOZHANG_UI_SCREENSHOT});
  await page.locator('nav [data-tab=inbox]').click();await page.locator('[data-row=open]').click();text=await page.locator('#editorPanel').innerText();assert.ok(english(text),chinese(text));assert.match(await page.locator('#editorWarnings').innerText(),/merchant name is only a suggestion/);assert.equal(await page.locator('#editCurrency').inputValue(),'GBP');assert.equal(await page.locator('[data-amountcandidate="1234.56"]').count(),0,'Pound mode does not read 1.234,56');
  // Currency on one receipt: candidates, label and warnings follow without a save, and the check is cleared.
  await page.locator('#editCurrency').selectOption('EUR');assert.match(await page.locator('#editAmountLabel').innerText(),/Euros/);assert.equal(await page.locator('[data-amountcandidate="1234.56"]').innerText(),'€1234.56');assert.equal(await page.locator('#editAmount').inputValue(),'1234.56');await page.locator('#editDate').fill('2026-10-12');await page.locator('#editMerchant').fill('REWE');await page.locator('#editConfirmed').check();await page.locator('#saveReceipt').click();await page.waitForFunction(()=>window.__saved.length===1);assert.equal(await page.evaluate(()=>window.__saved[0].currency),'EUR');assert.doesNotMatch(await page.locator('#toast').innerText(),/allowance/,'No allowance reminder for a euro receipt');
  // Separate totals and hidden reminders.
  await page.locator('nav [data-tab=export]').click();await page.locator('[data-exportcat="2"]').click();assert.match(await page.locator('.export-summary strong').innerText(),/^£120\.00 \+ €1,274\.56$/,'Totals stay separate');assert.equal(await page.locator('.trip-budget').count(),1);assert.match(await page.locator('.trip-budget').innerText(),/£120\.00/,'Euro receipts are not counted');assert.match(await page.locator('.export-name-hint').innerText(),/_Travel_Subsistence_Receipts\.pdf/);text=await page.locator('body').innerText();assert.ok(english(text),chinese(text));
  await open();await page.locator('#settingCurrency').selectOption('EUR');await page.waitForFunction(()=>window.__state.settings.currency==='EUR');await page.locator('#closeSettings').click();assert.equal(await page.locator('.trip-budget').count(),1,'The UK trip keeps its pound allowance in euro mode');assert.match(await page.locator('.sidebar').innerText(),/Euros \(EUR\)/);assert.equal(await page.evaluate(()=>window.__state.receipts.find(r=>r.id==='gbp-meal').currency),'GBP','Confirmed pounds stay pounds');
  // Survives a restart, and Chinese comes back.
  await page.reload();await page.waitForSelector('body[data-ready=true]');assert.equal(await page.evaluate(()=>document.documentElement.lang),'en-GB');assert.match(await page.locator('.sidebar').innerText(),/Euros \(EUR\)/);
  await open();assert.equal(await page.locator('#settingLanguage').inputValue(),'en');assert.equal(await page.locator('#settingCurrency').inputValue(),'EUR');await page.locator('#settingLanguage').selectOption('zh');await page.waitForFunction(()=>document.documentElement.lang==='zh-CN');await page.locator('#closeSettings').click();assert.match(await page.locator('.sidebar').innerText(),/发票工作台/);assert.match(await page.locator('.sidebar').innerText(),/欧元 EUR · 离线识别/);
  assert.deepEqual(errors,[]);console.log('Desktop settings UI PASS: language switch, British text, currency per receipt, euro OCR rules, hidden allowances, separate totals, persistence (simulated bridge).');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
