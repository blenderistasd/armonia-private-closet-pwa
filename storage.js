/* Armonia local vault — PBKDF2/AES-GCM; no remote calls. */
(() => {
  const DB_NAME = 'armonia-closet-v1';
  const DB_VERSION = 1;
  const textEncoder = new TextEncoder();
  const textDecoder = new TextDecoder();
  const toB64 = (input) => {
    const bytes = new Uint8Array(input);
    let str = '';
    for (let i=0;i<bytes.length;i+=0x8000) str += String.fromCharCode(...bytes.subarray(i,i+0x8000));
    return btoa(str);
  };
  const fromB64 = (str) => Uint8Array.from(atob(str), ch => ch.charCodeAt(0));
  function transaction(db, table, mode, action) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(table, mode);
      const req = action(tx.objectStore(table));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      tx.onerror = () => reject(tx.error);
    });
  }
  function openDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
        if (!db.objectStoreNames.contains('records')) db.createObjectStore('records', {keyPath:'id'});
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error('Database bloccato da un’altra scheda'));
    });
  }
  async function derive(password, salt) {
    const material = await crypto.subtle.importKey('raw', textEncoder.encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      {name:'PBKDF2',salt:fromB64(salt),iterations:250000,hash:'SHA-256'},
      material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']
    );
  }
  async function seal(key, plain) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({name:'AES-GCM',iv},key,textEncoder.encode(JSON.stringify(plain)));
    return {iv:toB64(iv),ct:toB64(ct)};
  }
  async function unseal(key, record) {
    const bytes = await crypto.subtle.decrypt({name:'AES-GCM',iv:fromB64(record.iv)},key,fromB64(record.ct));
    return JSON.parse(textDecoder.decode(bytes));
  }
  async function metadata(db) { return transaction(db,'meta','readonly',s => s.get('config')); }
  async function setup(db,password) {
    if (password.length < 8) throw new Error('Usa almeno 8 caratteri');
    if (await metadata(db)) throw new Error('Guardaroba già inizializzato');
    const salt = toB64(crypto.getRandomValues(new Uint8Array(16)));
    const key = await derive(password,salt);
    const verifier = await seal(key,{check:'armonia:v1'});
    const config={version:1,salt,verifier,createdAt:new Date().toISOString()};
    await transaction(db,'meta','readwrite',s => s.put(config,'config'));
    return key;
  }
  async function unlock(db,password) {
    const meta = await metadata(db);
    if (!meta) throw new Error('Nessun guardaroba trovato');
    const key = await derive(password,meta.salt);
    const payload = await unseal(key,meta.verifier);
    if (payload.check !== 'armonia:v1') throw new Error('Password non valida');
    return key;
  }
  async function getAll(db,key) {
    const rows = await transaction(db,'records','readonly',s => s.getAll());
    return Promise.all(rows.map(async r => ({id:r.id,kind:r.kind,...await unseal(key,r)})));
  }
  async function save(db,key,kind,data) {
    const id = data.id || crypto.randomUUID();
    const encrypted = await seal(key,{...data,id});
    await transaction(db,'records','readwrite',s=>s.put({id,kind,...encrypted}));
    return id;
  }
  async function remove(db,id) { await transaction(db,'records','readwrite',s=>s.delete(id)); }
  async function backup(db) {
    const meta = await metadata(db);
    const records=await transaction(db,'records','readonly',s=>s.getAll());
    return {format:'armonia-encrypted-backup-v1',exportedAt:new Date().toISOString(),meta,records};
  }
  async function restoreIntoEmpty(db,content) {
    if (!content || content.format!=='armonia-encrypted-backup-v1' || !content.meta ||
      typeof content.meta.salt!=='string' || !content.meta.verifier || !Array.isArray(content.records) ||
      content.records.length>10000) throw new Error('Backup non valido');
    if (await metadata(db)) throw new Error('Per sicurezza il ripristino è permesso solo in un archivio vuoto');
    const seen = new Set();
    for (const r of content.records) {
      if (!r || !r.id || !['garment','outfit'].includes(r.kind) || !r.iv || !r.ct || seen.has(r.id)) throw new Error('Backup corrotto');
      seen.add(r.id);
    }
    // Metadata written last, so interrupted imports never present a usable partial vault.
    for (const r of content.records) await transaction(db,'records','readwrite',s=>s.put(r));
    await transaction(db,'meta','readwrite',s=>s.put(content.meta,'config'));
  }
  async function wipe(db) {
    await Promise.all(['records','meta'].map(table=>transaction(db,table,'readwrite',s=>s.clear())));
  }
  window.Vault={openDb,metadata,setup,unlock,getAll,save,remove,backup,restoreIntoEmpty,wipe};
})();
