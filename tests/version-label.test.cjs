// The version shown in the app must match the build version (Android settings page, Windows footer).
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const I18N=require(path.join(root,'desktop','i18n.cjs'));

test('Android settings page shows the versionName from app/build.gradle',()=>{
  const v=read('app/build.gradle').match(/versionName '([^']+)'/)[1];
  const shown=[...read('app/src/main/assets/app.js').matchAll(/随手报账 · (\d+\.\d+\.\d+)/g)].map(m=>m[1]);
  assert.deepEqual(shown,[v]);
  assert.equal(I18N.t('en',`随手报账 · ${v}`),`BaoZhang · ${v}`);
});

test('Windows footer shows the version from desktop/package.json',()=>{
  const v=JSON.parse(read('desktop/package.json')).version;
  const shown=[...read('desktop/ui/index.html').matchAll(/随手报账 (\d+\.\d+\.\d+)/g)].map(m=>m[1]);
  assert.deepEqual(shown,[v]);
  assert.equal(I18N.t('en',`随手报账 ${v}`),`BaoZhang ${v}`);
});
