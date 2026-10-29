const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const path=require('node:path');const ctx={window:{}};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../engine.js'),'utf8'),ctx);
const E=ctx.window.StyleEngine;
const i=(id,category,color,style,occasions)=>({id,name:id,kind:'garment',image:'data:image/jpeg;base64,AA==',category,color,style,occasions,seasons:[]});
const garments=[i('tee','top','blu','sportivo',['running']),i('jeans','bottom','blu','casual',['quotidiano']),i('shorts','bottom','nero','sportivo',['running']),i('heels','shoes','nero','elegante',['sera']),i('trainers','shoes','azzurro','sportivo',['running']),i('private','intimate','rosa','casual',['intimo'])];
for(const look of E.makeLooks(garments,{occasion:'running',color:'blu',season:'estate'}).looks){
  assert(!look.ids.includes('jeans'));assert(!look.ids.includes('heels'));assert(!look.ids.includes('private'));
}
const missing=E.makeLooks(garments.filter(g=>g.id!=='trainers'),{occasion:'running'});
assert(missing.looks.every(l=>!l.ids.includes('heels')));
assert(missing.looks.every(l=>l.missing.includes('shoes')));
assert.equal(E.makeLooks(garments,{occasion:'intimo'}).looks.length,1);
console.log('PASS running athletic-only, no heels/jeans, missing shoes reported, intimate isolation');
