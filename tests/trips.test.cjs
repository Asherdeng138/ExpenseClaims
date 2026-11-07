// Business trips by country on the Android UI (browser demo mode): country, days, euro allowance and currency follow-through.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{}),args:['--disable-gpu']});
 try{const page=await browser.newPage({viewport:{width:360,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  const report=path.resolve(__dirname,'../verification');fs.mkdirSync(report,{recursive:true});
  await page.clock.setFixedTime(new Date('2026-10-20T12:00:00'));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../app/src/main/assets/index.html')).href);await page.waitForSelector('.calendar-grid');
  await page.evaluate(()=>{localStorage.clear();localStorage.setItem('baozhang-demo',JSON.stringify({receipts:[],days:{},countries:{},draft:null}));});await page.reload();await page.waitForSelector('.calendar-grid');
  // Am I travelling, where, for how many days.
  await page.locator('#markDay').click();await page.locator('#markType').selectOption('business');assert.equal(await page.locator('#markCountry').inputValue(),'GB','UK by default');assert.match(await page.locator('#markDaily').innerText(),/£50\.00/);
  await page.locator('#markCountry').selectOption('DE');assert.match(await page.locator('#markDaily').innerText(),/德国出差每天餐补上限 €50\.00，按欧元 EUR计算/);
  await page.locator('#markFrom').fill('2026-10-06');await page.locator('#markFrom').dispatchEvent('change');await page.locator('#markDays').fill('3');assert.equal(await page.locator('#markTo').inputValue(),'2026-10-08','Days set the end date');
  await page.locator('#markTo').fill('2026-10-09');await page.locator('#markTo').dispatchEvent('change');assert.equal(await page.locator('#markDays').inputValue(),'4','The end date sets the days');await page.locator('#markDays').fill('3');
  await page.locator('#markType').selectOption('office');assert.equal(await page.locator('#markCountryField').isVisible(),false,'Only trips have a country');await page.locator('#markType').selectOption('business');
  await page.locator('#saveMark').click();await page.waitForFunction(()=>S.days['2026-10-08']==='business');
  assert.deepEqual(await page.evaluate(()=>S.countries),{'2026-10-06':'DE','2026-10-07':'DE','2026-10-08':'DE'});
  await page.locator('[data-day="2026-10-07"]').click();assert.match(await page.locator('[data-day="2026-10-07"] .type').innerText(),/出差 DE/);assert.match(await page.locator('.day-status').innerText(),/出差 · 德国/);
  let card=await page.locator('main .trip-budget').innerText();assert.match(card,/德国 · 出差 3 天/);assert.match(card,/€150\.00/);assert.match(card,/德国每天 €50\.00/);
  // Switzerland right after: a new trip with its own rate.
  await page.locator('#markDay').click();await page.locator('#markType').selectOption('business');await page.locator('#markCountry').selectOption('CH');await page.locator('#markFrom').fill('2026-10-09');await page.locator('#markFrom').dispatchEvent('change');await page.locator('#markDays').fill('2');await page.locator('#saveMark').click();await page.waitForFunction(()=>S.countries['2026-10-10']==='CH');
  await page.locator('[data-day="2026-10-09"]').click();assert.match(await page.locator('main .trip-budget').innerText(),/瑞士 · 出差 2 天[\s\S]*€120\.00/);
  // A receipt dated on the German trip switches to euros and is read with euro rules.
  await page.locator('#addReceipt').click();await page.locator('[data-choose="2"]').click();await page.locator('#importNew').click();await page.waitForSelector('#editDate');
  await page.evaluate(()=>{const text='REWE Markt\n07.10.2026\nSumme 45,90 EUR\nMwSt 7% 3,00\nKarte 45,90';window.onNative({type:'scan',data:{draft:{...S.draft,id:undefined,date:'',amount:'',merchant:'',currency:'GBP',ocr:text},text,first:true}});});
  assert.equal(await page.locator('#editDate').inputValue(),'2026-10-07');assert.equal(await page.locator('#editCurrency').inputValue(),'EUR','Trip day → euros');assert.equal(await page.locator('#editAmount').inputValue(),'45.90');
  card=await page.locator('#editorBudget').innerText();assert.match(card,/德国 · 出差 3 天/);assert.match(card,/还有 €104\.10 额度未使用/);
  // Choosing pounds on a German day: the receipt is shown as not counted.
  await page.locator('#editCurrency').selectOption('GBP');assert.match(await page.locator('#editorBudget .warning').innerText(),/这天在德国出差，餐补按欧元 EUR计算；这张发票是英镑 GBP，不计入额度/);await page.locator('#editCurrency').selectOption('EUR');
  // Moving the date to a non-trip day keeps the currency; onto a UK trip day switches to pounds.
  await page.locator('#editDate').fill('2026-10-15');await page.locator('#editDate').dispatchEvent('change');assert.equal(await page.locator('#editCurrency').inputValue(),'EUR');assert.match(await page.locator('#editorBudget').innerText(),/未标记为出差/);
  await page.locator('#editDate').fill('2026-10-07');await page.locator('#editDate').dispatchEvent('change');assert.equal(await page.locator('#editCurrency').inputValue(),'EUR');
  await page.locator('#editMerchant').fill('REWE');await page.locator('#editConfirmed').check();await page.locator('#saveReceipt').click();await page.waitForFunction(()=>S.receipts.length===1);assert.match(await page.locator('#toast').innerText(),/还有 €104\.10 额度未使用/);
  await page.locator('[data-tab=calendar]').click();await page.locator('[data-day="2026-10-07"]').click();await page.waitForTimeout(5000);await page.locator('main .trip-budget').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(report,'trip-country-calendar-zh-360.png')});
  // English, and the screenshots for review.
  await page.locator('#settingsButton').click();await page.locator('#settingLanguage').selectOption('en');await page.waitForFunction(()=>document.documentElement.lang==='en-GB');await page.locator('#closeModal').click();
  await page.locator('[data-day="2026-10-07"]').click();card=await page.locator('main .trip-budget').innerText();assert.match(card,/Germany · 3-day trip/);assert.match(card,/€50\.00 a day in Germany/);assert.match(card,/€104\.10 of the allowance is unused/);
  await page.locator('main .trip-budget').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(report,'trip-country-calendar-en-360.png')});
  await page.locator('#markDay').click();await page.locator('#markType').selectOption('business');await page.locator('#markCountry').selectOption('FR');await page.locator('#markDays').fill('4');
  assert.match(await page.locator('#markDaily').innerText(),/Daily subsistence allowance in France: €50\.00, worked out in Euros \(EUR\)/);assert.match(await page.locator('#markCountry option[value=CH]').innerText(),/Switzerland · €60\.00 a day/);
  await page.screenshot({path:path.join(report,'trip-country-mark-en-360.png')});await page.locator('#closeModal').click();
  await page.locator('#settingsButton').click();await page.locator('#settingLanguage').selectOption('zh');await page.waitForFunction(()=>document.documentElement.lang==='zh-CN');await page.locator('#closeModal').click();
  await page.locator('#markDay').click();await page.locator('#markCountry').selectOption('DE');await page.screenshot({path:path.join(report,'trip-country-mark-zh-360.png')});await page.locator('#closeModal').click();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true,'No sideways scrolling at 360px');
  await page.reload();await page.waitForSelector('.calendar-grid');assert.equal(await page.evaluate(()=>S.countries['2026-10-10']),'CH','Countries survive a restart');
  assert.deepEqual(errors,[]);console.log('Android trips PASS: country and days, Europe-region euro allowances, currency follows the trip day, separate trips per country, English text, persistence (browser demo).');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
