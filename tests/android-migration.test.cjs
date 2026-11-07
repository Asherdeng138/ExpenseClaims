// Executes the SQL copied directly from ReceiptStore.java, not Android Java/bridge code.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
const source=fs.readFileSync(path.join(__dirname,'../app/src/main/java/com/asher/baozhang/ReceiptStore.java'),'utf8');
const table=source.match(/db\.execSQL\("(CREATE TABLE receipts[^"\n]+)"\)/)[1];
test('Android v1 upgrade adds archive/trash columns without changing existing receipts',()=>{
 const db=new DatabaseSync(':memory:');try{
  db.exec(table.replace(',archivedAt INTEGER NOT NULL DEFAULT 0,deletedAt INTEGER NOT NULL DEFAULT 0',''));
  db.prepare('INSERT INTO receipts VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run('original','2026-10-10',24000,'GBP','出差餐补','Costco','London','original note','original OCR','[{"name":"original.jpg"}]',1000,2000);
  const previous=db.prepare('SELECT * FROM receipts').get();
  const upgrades=[...source.matchAll(/db\.execSQL\("(ALTER TABLE receipts[^"\n]+)"\)/g)].map(m=>m[1]);assert.equal(upgrades.length,2);
  for(const sql of upgrades)db.exec(sql);
  const row=db.prepare('SELECT * FROM receipts').get();assert.equal(row.archivedAt,0);assert.equal(row.deletedAt,0);
  delete row.archivedAt;delete row.deletedAt;assert.deepEqual(row,previous);
 }finally{db.close();}
});
test('Android stores the chosen currency on each receipt and needs no new database version',()=>{
 assert.match(source,/super\(c,"receipts\.db",null,3\)/);assert.match(table,/currency TEXT NOT NULL/);assert.match(source,/CURRENCIES=new HashSet<>\(Arrays\.asList\("GBP","EUR"\)\)/);assert.match(source,/cv\.put\("currency",currency\)/);assert.doesNotMatch(source,/cv\.put\("currency","GBP"\)/);
 const db=new DatabaseSync(':memory:');try{db.exec(table);const row=['id','2026-10-10',750];const insert=c=>db.prepare('INSERT INTO receipts(id,date,amountMinor,currency,category,merchant,location,note,ocr,documents,createdAt,updatedAt) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run(c,row[1],row[2],c,'出差餐补','Shop','','','','[]',1,1);insert('GBP');insert('EUR');assert.deepEqual(db.prepare('SELECT currency FROM receipts ORDER BY currency').all().map(r=>r.currency),['EUR','GBP']);}finally{db.close();}
});
test('new Android databases have the same additive columns and defaults as upgraded databases',()=>{
 const db=new DatabaseSync(':memory:');try{db.exec(table);const columns=db.prepare('PRAGMA table_info(receipts)').all();for(const name of ['archivedAt','deletedAt']){const column=columns.find(c=>c.name===name);assert.equal(column.type,'INTEGER');assert.equal(column.notnull,1);assert.equal(column.dflt_value,'0');}}finally{db.close();}
});

test('Android v2 upgrade adds the trip country without changing calendar days',()=>{
 const db=new DatabaseSync(':memory:');try{
  db.exec('CREATE TABLE days(date TEXT PRIMARY KEY,type TEXT NOT NULL)');db.prepare('INSERT INTO days VALUES(?,?)').run('2026-10-09','business');db.prepare('INSERT INTO days VALUES(?,?)').run('2026-10-10','office');
  const upgrade=[...source.matchAll(/db\.execSQL\("(ALTER TABLE days[^"\n]+)"\)/g)].map(m=>m[1]);assert.equal(upgrade.length,1);db.exec(upgrade[0]);
  assert.deepEqual(db.prepare('SELECT * FROM days ORDER BY date').all().map(r=>({...r})),[{date:'2026-10-09',type:'business',country:''},{date:'2026-10-10',type:'office',country:''}],'Old business days read as UK days');
  const created=source.match(/db\.execSQL\("(CREATE TABLE days[^"\n]+)"\)/)[1];const fresh=new DatabaseSync(':memory:');fresh.exec(created);assert.deepEqual(fresh.prepare('PRAGMA table_info(days)').all().map(c=>[c.name,c.notnull,c.dflt_value]),[['date',0,null],['type',1,null],['country',1,"''"]]);fresh.close();
  assert.match(source,/if\(a<2\)\{db\.execSQL\("ALTER TABLE receipts/,'v1 databases get both upgrades');
 }finally{db.close();}
});
test('Android trip country codes match the parser list',()=>{
 const P=require('../app/src/main/assets/parser.js'),codes=source.match(/COUNTRIES=new HashSet<>\(Arrays\.asList\(([^)]*)\)\)/)[1].match(/"([A-Z]{2})"/g).map(s=>s.slice(1,3));
 assert.deepEqual(codes,P.TRIP_COUNTRIES.map(c=>c.code));
});
