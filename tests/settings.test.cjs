// Language and currency settings on the Android UI (browser demo mode). Native prefs, OCR and exports are not executed here.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const CJK=/[一-鿿]/;
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{}),args:['--disable-gpu']});
 try{const page=await browser.newPage({viewport:{width:360,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  const report=path.resolve(__dirname,'../verification');fs.mkdirSync(report,{recursive:true});
  await page.goto(pathToFileURL(path.resolve(__dirname,'../app/src/main/assets/index.html')).href);await page.waitForSelector('.calendar-grid');await page.evaluate(()=>localStorage.clear());await page.reload();await page.waitForSelector('.calendar-grid');
  // Fixed sample data: its merchants and notes are the user's own text and must never be translated.
  const seed=rows=>page.evaluate(rows=>{S.tab='calendar';S.month='2026-10';S.selectedDay='2026-10-09';window.onNative({type:'data',data:{receipts:rows,days:{'2026-10-09':'business','2026-10-10':'business'},draft:null}});},rows);
  const r=(id,date,category,amountMinor,currency,merchant='Shop')=>({id,date,category,amountMinor,currency,merchant,location:'',note:'',ocr:'',documents:[{name:id+'.jpg',mime:'image/jpeg',pages:1}]});
  const rows=[r('a','2026-10-09','出差餐补',12000,'GBP','Tesco'),r('b','2026-10-09','出差餐补',4000,'EUR','REWE'),r('c','2026-10-09','市内交通（地铁）',2000,'GBP','TfL')];
  await seed(rows);
  assert.equal(await page.locator('.legend').innerText(),'出差\n办公\n休假','Chinese stays the default');assert.equal(await page.evaluate(()=>document.documentElement.lang),'zh-CN');
  assert.match(await page.locator('main').innerText(),/£120\.00/);assert.match(await page.locator('main').innerText(),/€40\.00/);assert.equal(await page.locator('.trip-budget').count(),2,'Pounds show allowance cards');
  assert.match(await page.locator('.trip-budget').first().innerText(),/£120\.00/,'Euro receipts are not counted towards the allowance');
  // English: the whole page, in British wording, with user text untouched.
  await page.locator('#settingsButton').click();await page.locator('#settingLanguage').selectOption('en');await page.waitForFunction(()=>document.documentElement.lang==='en-GB');
  assert.equal(await page.locator('#modalTitle').innerText(),'Settings & help');await page.locator('#closeModal').click();
  const text=await page.locator('body').innerText();assert.ok(!CJK.test(text),'No Chinese left: '+[...text.split('\n')].filter(l=>CJK.test(l)).join(' | '));
  assert.match(text,/Trip\s/);assert.match(text,/Leave/);assert.match(text,/October 2026/);assert.match(text,/Mon/);assert.match(text,/Tesco/);assert.match(text,/allowance/);assert.equal(await page.title(),'BaoZhang');
  await page.screenshot({path:path.join(report,'settings-english-calendar-360.png')});
  for(const tab of ['receipts','export','archive']){await page.locator(`[data-tab=${tab}]`).click();const main=await page.locator('body').innerText();assert.ok(!CJK.test(main),tab+': '+main.split('\n').filter(l=>CJK.test(l)).join(' | '));}
  await page.locator('[data-tab=export]').click();await page.locator('[data-exportcat="2"]').click();const body=await page.locator('body').innerText();assert.ok(!CJK.test(body),body.split('\n').filter(l=>CJK.test(l)).join(' | '));assert.match(body,/Travel subsistence/);assert.match(await page.locator('.summary-strip').innerText(),/£120\.00 \+ €40\.00/,'Separate totals for each currency');assert.match(await page.locator('.export-name-hint').innerText(),/Travel_Subsistence_Receipts\.pdf/);
  await page.screenshot({path:path.join(report,'settings-english-export-360.png')});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true,'No sideways scrolling in English at 360px');
  // Euros: reminders go, saved receipts keep their currency, new receipts use euros.
  await page.locator('[data-tab=calendar]').click();await page.locator('#settingsButton').click();await page.locator('#settingCurrency').selectOption('EUR');await page.waitForFunction(()=>S.settings.currency==='EUR');await page.locator('#closeModal').click();
  assert.equal(await page.locator('.city-budget').count(),0,'Euros hide the monthly local travel allowance');assert.equal(await page.locator('.trip-budget:not(.city-budget)').count(),1,'The UK trip keeps its pound subsistence allowance');assert.match(await page.locator('main').innerText(),/£120\.00/,'Saved pounds stay pounds');
  await page.locator('#addReceipt').click();await page.locator('[data-choose="2"]').click();await page.locator('#importNew').click();await page.waitForSelector('#editDate');assert.equal(await page.locator('#editCurrency').inputValue(),'GBP','The demo receipt is dated 09/10, a UK trip day, so it follows the trip into pounds');assert.equal(await page.locator('#editorBudget .trip-budget').count(),1,'Subsistence on a UK trip day still shows its pound allowance');
  assert.ok(!CJK.test((await page.locator('#modalBody').innerText()).replace(/界面演示/,'')),'Editor in English: '+(await page.locator('#modalBody').innerText()).split('\n').filter(l=>CJK.test(l)).join(' | '));
  await page.screenshot({path:path.join(report,'settings-english-editor-360.png'),fullPage:true});
  await page.evaluate(()=>{const text='REWE\n15.10.2026\nSumme 1.234,56 EUR\nMwSt 19% 197,12\nKarte 1.234,56';window.onNative({type:'scan',data:{draft:{...S.draft,currency:undefined,date:'',amount:'',merchant:'',ocr:text},text,first:true}});});
  assert.equal(await page.locator('#editAmount').inputValue(),'1234.56','Euro receipts read in euro mode');assert.match(await page.locator('.candidates').innerText(),/€1234\.56/);
  // Changing the currency on one receipt re-reads it under that currency and un-ticks the check; typed amounts stay.
  await page.locator('#editConfirmed').check();await page.locator('#editCurrency').selectOption('GBP');assert.equal(await page.locator('#editCurrency').inputValue(),'GBP');assert.equal(await page.locator('#editConfirmed').isChecked(),false);assert.equal(await page.locator('#editAmount').inputValue(),'1234.56');assert.equal(await page.locator('[data-amountcandidate="1234.56"]').count(),0,'Pound mode does not read the continental amount');
  await page.locator('#editCurrency').selectOption('EUR');assert.match(await page.locator('.candidates').innerText(),/€1234\.56/);
  await page.locator('#editDate').fill('2026-10-15');await page.locator('#editMerchant').fill('REWE');await page.locator('#editConfirmed').check();await page.locator('#saveReceipt').click();await page.waitForFunction(()=>S.receipts.some(r=>r.merchant==='REWE'&&r.amountMinor===123456));assert.equal(await page.evaluate(()=>S.receipts.find(r=>r.amountMinor===123456).currency),'EUR');assert.equal(await page.evaluate(()=>S.receipts.find(r=>r.id==='a').currency),'GBP');assert.match(await page.locator('#toast').innerText(),/Demo receipt saved/);assert.doesNotMatch(await page.locator('#toast').innerText(),/allowance/,'No allowance reminder for a euro receipt');
  // Back to pounds: reminders return; a saved euro receipt stays in euros and outside the allowance.
  await page.locator('#settingsButton').click();await page.locator('#settingCurrency').selectOption('GBP');await page.waitForFunction(()=>S.settings.currency==='GBP');await page.locator('#closeModal').click();await page.locator('[data-tab=calendar]').click();assert.equal(await page.locator('.trip-budget').count(),2);assert.match(await page.locator('.trip-budget').first().innerText(),/£120\.00/);
  // Settings survive a restart.
  await page.locator('#settingsButton').click();await page.locator('#settingCurrency').selectOption('EUR');await page.waitForFunction(()=>S.settings.currency==='EUR');await page.reload();await page.waitForSelector('.calendar-grid');assert.equal(await page.evaluate(()=>document.documentElement.lang),'en-GB');assert.deepEqual(await page.evaluate(()=>S.settings),{language:'en',currency:'EUR'});assert.ok(!CJK.test(await page.locator('nav').innerText()));
  // And back to Chinese, including text fixed in the page.
  await page.locator('#settingsButton').click();await page.locator('#settingLanguage').selectOption('zh');await page.waitForFunction(()=>document.documentElement.lang==='zh-CN');await page.locator('#closeModal').click();assert.match(await page.locator('.brand').innerText(),/随手报账/);assert.match(await page.locator('.legend').innerText(),/出差/);
  assert.deepEqual(errors,[]);console.log('Android settings UI PASS: language switch, British text, currency per receipt, euro OCR rules, hidden allowances, separate totals, persistence (browser demo).');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
