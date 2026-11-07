// Business trips by country on the Windows UI (built ui/app.js, simulated Desktop bridge).
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
 try{const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const report=path.resolve(__dirname,'../verification');fs.mkdirSync(report,{recursive:true});
  await page.addInitScript(()=>{
   const state={version:1,settings:{language:'zh',currency:'GBP'},days:{},tripCountries:{},receipts:[{id:'open',filename:'rewe.png',mime:'image/png',size:2048,category:'出差餐补',date:'',amountMinor:null,currency:'GBP',merchant:'',location:'',note:'',ocrText:'REWE Markt\n07.10.2026\nSumme 45,90 EUR\nKarte 45,90',warnings:[],confirmed:false,status:'review'}]};
   window.__state=state;window.__marks=[];
   window.Desktop={list:async()=>structuredClone(state),read:async()=>({bytes:Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j/a0AAAAASUVORK5CYII='),c=>c.charCodeAt(0)),mime:'image/png'}),
    settings:async s=>{state.settings=s;return structuredClone(state);},
    mark:async(from,to,type,country)=>{window.__marks.push({from,to,type,country});const d=new Date(from+'T00:00:00Z'),end=new Date(to+'T00:00:00Z');while(d<=end){const k=d.toISOString().slice(0,10);if(type)state.days[k]=type;else delete state.days[k];if(type==='business')state.tripCountries[k]=country||'GB';else delete state.tripCountries[k];d.setUTCDate(d.getUTCDate()+1);}return structuredClone(state);},
    save:async(id,f)=>{const x=state.receipts.find(o=>o.id===id);Object.assign(x,f,{amountMinor:f.amount?Math.round(Number(f.amount)*100):null,confirmed:f.confirmed,status:f.confirmed?'confirmed':'review'});return structuredClone(state);}};
  });
  await page.clock.setFixedTime(new Date('2026-10-20T12:00:00'));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../ui/index.html')).href);await page.waitForSelector('body[data-ready=true]');
  await page.locator('[data-day="2026-10-06"]').click();await page.locator('#markRange').click();await page.locator('#markType').selectOption('business');
  assert.equal(await page.locator('#markCountry').inputValue(),'GB');await page.locator('#markCountry').selectOption('DE');assert.match(await page.locator('#markDaily').innerText(),/德国出差每天餐补上限 €50\.00/);
  await page.locator('#markDays').fill('3');assert.equal(await page.locator('#markTo').inputValue(),'2026-10-08');
  await page.locator('#markForm button[type=submit]').click();assert.deepEqual(await page.evaluate(()=>window.__marks.at(-1)),{from:'2026-10-06',to:'2026-10-08',type:'business',country:'DE'});
  let card=await page.locator('.trip-budget').innerText();assert.match(card,/德国 · 出差 3 天/);assert.match(card,/€150\.00/);assert.match(await page.locator('[data-day="2026-10-07"] .type').innerText(),/出差 DE/);assert.match(await page.locator('.panel-head .badge').innerText(),/出差 · 德国/);
  // The next day's quick "trip" button carries the country on.
  await page.locator('[data-day="2026-10-09"]').click();await page.locator('[data-daytype="business"]').click();await page.waitForFunction(()=>window.__marks.length===2);assert.equal(await page.evaluate(()=>window.__marks.at(-1).country),'DE');
  // Switzerland: own trip and rate.
  await page.locator('[data-day="2026-10-12"]').click();await page.locator('#markRange').click();await page.locator('#markCountry').selectOption('CH');await page.locator('#markDays').fill('2');await page.locator('#markForm button[type=submit]').click();assert.match(await page.locator('.trip-budget').innerText(),/瑞士 · 出差 2 天[\s\S]*€120\.00/);
  // The receipt's date falls on the German trip: euros, read with euro rules.
  await page.locator('nav [data-tab=inbox]').click();await page.locator('[data-row=open]').click();await page.locator('[data-datecandidate="2026-10-07"]').click();
  assert.equal(await page.locator('#editCurrency').inputValue(),'EUR');assert.match(await page.locator('#toast').innerText(),/这天在德国出差，已改为按欧元 EUR记录/);await page.locator('[data-amountcandidate="45.90"]').click();
  card=await page.locator('#editorBudget').innerText();assert.match(card,/德国 · 出差 4 天/);assert.match(card,/还有 €154\.10 额度未使用/);
  await page.locator('#editCurrency').selectOption('GBP');assert.match(await page.locator('#editorBudget .warning').innerText(),/不计入额度/);await page.locator('#editCurrency').selectOption('EUR');
  await page.locator('#editMerchant').fill('REWE');await page.locator('#editConfirmed').check();await page.locator('#saveReceipt').click();assert.match(await page.locator('#toast').innerText(),/还有 €154\.10 额度未使用/);assert.equal(await page.evaluate(()=>window.__state.receipts[0].currency),'EUR');
  await page.locator('nav [data-tab=calendar]').click();await page.locator('[data-day="2026-10-07"]').click();await page.waitForTimeout(6600);await page.screenshot({path:path.join(report,'desktop-trip-calendar-zh.png')});await page.locator('nav [data-tab=inbox]').click();
  // English and screenshots.
  await page.locator('#settingsBtn').click();await page.locator('#settingLanguage').selectOption('en');await page.waitForFunction(()=>document.documentElement.lang==='en-GB');await page.locator('#closeSettings').click();
  await page.locator('nav [data-tab=calendar]').click();await page.locator('[data-day="2026-10-07"]').click();card=await page.locator('.trip-budget').innerText();assert.match(card,/Germany · 4-day trip/);assert.match(card,/€154\.10 of the allowance is unused/);
  await page.screenshot({path:path.join(report,'desktop-trip-calendar-en.png')});
  await page.locator('#markRange').click();await page.locator('#markCountry').selectOption('IT');assert.match(await page.locator('#markDaily').innerText(),/Italy: €40\.00/);await page.screenshot({path:path.join(report,'desktop-trip-mark-en.png')});await page.locator('#closeMark').click();
  await page.locator('nav [data-tab=export]').click();await page.locator('[data-exportcat="2"]').click();assert.match(await page.locator('.trip-budget').first().innerText(),/Germany/);
  assert.deepEqual(errors,[]);console.log('Desktop trips PASS: country and days, Europe-region euro allowances, quick mark keeps the country, currency follows the trip day, English (simulated bridge).');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
