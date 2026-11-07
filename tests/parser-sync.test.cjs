// Android and Windows ship separate copies of the receipt parser; they must stay identical.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
test('Android parser.js and desktop parser.cjs are identical',()=>{
 const root=path.resolve(__dirname,'..');
 assert.equal(fs.readFileSync(path.join(root,'app/src/main/assets/parser.js'),'utf8'),fs.readFileSync(path.join(root,'desktop/parser.cjs'),'utf8'),'Copy app/src/main/assets/parser.js to desktop/parser.cjs');
});
test('Android i18n.js and desktop i18n.cjs are identical',()=>{
 const root=path.resolve(__dirname,'..');
 assert.equal(fs.readFileSync(path.join(root,'app/src/main/assets/i18n.js'),'utf8'),fs.readFileSync(path.join(root,'desktop/i18n.cjs'),'utf8'),'Copy app/src/main/assets/i18n.js to desktop/i18n.cjs');
});
test('Android and desktop receipt-ocr.js engine copies are identical',()=>{
 const root=path.resolve(__dirname,'..');
 assert.equal(fs.readFileSync(path.join(root,'app/src/main/assets/receipt-ocr.js'),'utf8'),fs.readFileSync(path.join(root,'desktop/receipt-ocr.js'),'utf8'),'Copy app/src/main/assets/receipt-ocr.js to desktop/receipt-ocr.js');
});
