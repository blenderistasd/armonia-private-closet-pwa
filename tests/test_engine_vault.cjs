const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
const root=require('path').join(__dirname,'..');
function memoryDb(){
 const stores=new Map(); const api={objectStoreNames:{contains:n=>stores.has(n)},createObjectStore(n){stores.set(n,new Map());},transaction(n){const map=stores.get(n);return {objectStore(){return {
 get(k){return request(()=>map.get(k));},put(v,k){return request(()=>{const id=k??v.id;map.set(id,v);return id;});},getAll(){return request(()=>Array.from(map.values()));},delete(k){return request(()=>map.delete(k));},clear(){return request(()=>map.clear());}
 };}}}};
 const request=(fn)=>{const req={};queueMicrotask(()=>{try{req.result=fn();req.onsuccess?.();}catch(e){req.error=e;req.onerror?.();}});return req};
 return {api,open(){const req={};queueMicrotask(()=>{req.result=api;req.onupgradeneeded?.();queueMicrotask(()=>req.onsuccess?.());});return req;}};
}
(async()=>{
 const s=memoryDb();const ctx={window:{},TextEncoder,TextDecoder,Uint8Array,crypto:webcrypto,indexedDB:{open:()=>s.open()},btoa,atob,queueMicrotask,console};
 vm.createContext(ctx);
 for(const script of ['storage.js','engine.js'])vm.runInContext(fs.readFileSync(require('path').join(root,script),'utf8'),ctx);
 const V=ctx.window.Vault,E=ctx.window.StyleEngine;
 const db=await V.openDb();assert.equal(await V.metadata(db),undefined);
 const key=await V.setup(db,'private-catalog-password');
 await V.save(db,key,'garment',{name:'Maglia blu',category:'top',image:'data:image/jpeg;base64,AA==',color:'blu',occasions:['running']});
 await V.save(db,key,'garment',{name:'Leggings',category:'bottom',image:'data:image/jpeg;base64,AA==',color:'nero',occasions:['running']});
 await V.save(db,key,'garment',{name:'Scarpe bianche',category:'shoes',image:'data:image/jpeg;base64,AA==',color:'bianco',occasions:['running']});
 await V.save(db,key,'garment',{name:'Intimo rosa privato',category:'intimate',image:'data:image/jpeg;base64,AA==',color:'rosa'});
 const encrypted=JSON.stringify(await V.backup(db));
 assert(!encrypted.includes('Intimo rosa privato')&&!encrypted.includes('Maglia blu')&&!encrypted.includes('data:image/jpeg'));
 try{await V.unlock(db,'wrong password');throw new Error('Password non rifiutata');}catch(e){assert.notEqual(e.message,'Password non rifiutata');}
 const key2=await V.unlock(db,'private-catalog-password'); const saved=await V.getAll(db,key2);
 assert.equal(saved.length,4);const looks=E.makeLooks(saved,{occasion:'running',color:'blu'});
 assert(looks.looks.length>0); assert(looks.looks.every(x=>!x.ids.some(id=>saved.find(i=>i.id===id)?.category==='intimate')));
 assert.equal(E.makeLooks(saved,{occasion:'intimo'}).looks.length,1);
 const old=db;await V.wipe(db);assert.equal(await V.metadata(db),undefined);
 await V.restoreIntoEmpty(db,JSON.parse(encrypted));
 assert.equal((await V.getAll(db,await V.unlock(db,'private-catalog-password'))).length,4);
 console.log('PASS: setup, AES-GCM ciphertext, password rejection, persistence, matching, intimate segregation, backup restore.');
})().catch(e=>{console.error('FAIL',e);process.exitCode=1;});
