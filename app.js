(() => {
  'use strict';
  const E=()=>window.StyleEngine;
  const app=document.getElementById('app');
  const toast=document.getElementById('toast');
  const state={db:null,key:null,hasVault:false,view:'home',items:[],saved:[],search:'',category:'all',showPrivateSaved:false,editor:null,queue:[],query:'',occasion:'quotidiano',season:'',color:'',results:null,busy:false};
  const esc=(v='')=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const imgSafe=(v)=>typeof v==='string'&&/^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(v)?v:'';
  const label=(s)=> E().SLOT_LABEL[s]||s;
  const icon=(s)=>({'home':'⌂','closet':'▦','stylist':'✧','saved':'♡','settings':'⚙'})[s]||'•';
  const navs=[['home','Home'],['closet','Guardaroba'],['stylist','Stylist'],['saved','Salvati'],['settings','Altro']];
  const count=()=>state.items.length;
  const demoCount=()=>state.items.filter(i=>i.demo===true).length;
  let toastTimeout;
  function notify(message,error=false){clearTimeout(toastTimeout);toast.textContent=message;toast.className='toast show'+(error?' danger':'');toastTimeout=setTimeout(()=>toast.className='toast',4100);}
  function setBusy(b){state.busy=b;document.querySelectorAll('button[type=submit]').forEach(x=>x.disabled=b);}
  const byId=id=>state.items.find(i=>i.id===id);
  const photo=(item,extra='')=>imgSafe(item?.image)?`<img ${extra} src="${item.image}" alt="${esc(item.name)}${item.demo?' (illustrazione dimostrativa)':''}" loading="lazy">`:'<div class="empty-photo">Immagine non disponibile</div>';
  async function refresh(){
    const r=await Vault.getAll(state.db,state.key);
    state.items=r.filter(x=>x.kind==='garment').sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));
    state.saved=r.filter(x=>x.kind==='outfit').sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));
  }
  function authView(){
    const setup=!state.hasVault;
    app.innerHTML=`<main class="auth-wrap"><div class="auth-orb"></div><section class="auth-card">
      <div class="auth-brand"><div class="brand-mark large">A<span>✦</span></div><span>ARMONIA</span></div>
      <p class="eyebrow">IL TUO GUARDAROBA. SOLO TUO.</p>
      <h1>Vestiti come <em>ti senti.</em></h1>
      <p class="auth-sub">Fotografa i tuoi capi, crea outfit su misura e tieni tutto in uno spazio cifrato e privato.</p>
      <form id="auth-form" class="auth-form">
        <label for="password">${setup?'Crea una password privata':'La tua password privata'}</label>
        <input id="password" name="password" type="password" autocomplete="${setup?'new-password':'current-password'}" minlength="8" required placeholder="Minimo 8 caratteri">
        ${setup?'<label for="confirm">Ripeti la password</label><input id="confirm" name="confirm" type="password" autocomplete="new-password" minlength="8" required placeholder="Conferma password">':''}
        <button class="primary wide" type="submit">${setup?'Crea il mio guardaroba':'Apri il mio guardaroba'} <span>→</span></button>
      </form>
      ${setup?'<div class="auth-import"><span>Hai già un backup cifrato?</span><button class="text-link" data-action="restore-start">Ripristina archivio</button></div>':''}
      <p class="auth-fine">✧ Nessun account, nessun caricamento sul cloud. Le foto sono cifrate su questo dispositivo. <strong>La password non può essere recuperata.</strong></p>
    </section></main>`;
  }
  function header(){return `<header class="topbar"><button class="brand-link" data-nav="home" aria-label="Home"><span class="brand-mark">A<span>✦</span></span><span class="brand-word">ARMONIA<small>YOUR PRIVATE CLOSET</small></span></button><div class="header-right"><span class="catalog-pill">${count()} capi</span><button class="lock-button" data-action="lock" title="Blocca guardaroba" aria-label="Blocca guardaroba">⌑</button></div></header>`;}
  function bottomNav(){return `<nav class="bottomnav" aria-label="Navigazione principale">${navs.map(([id,name])=>`<button data-nav="${id}" class="${state.view===id?'active':''}" aria-label="${name}" aria-current="${state.view===id?'page':'false'}"><span class="navico">${icon(id)}</span><span>${name}</span></button>`).join('')}</nav>`;}
  function latestGrid(){
    if(!state.items.some(i=>i.category!=='intimate'))return `<div class="empty-small"><span class="spark">✳</span><p>Il tuo armadio digitale aspetta la prima foto.</p><button class="quiet-button" data-action="open-add">Aggiungi un capo →</button></div>`;
    return `<div class="recent-scroll">${state.items.filter(i=>i.category!=='intimate').slice(0,5).map(i=>`<button class="recent-tile" data-action="edit" data-id="${esc(i.id)}">${photo(i)}<span>${esc(i.name)}</span></button>`).join('')}</div>`;
  }
  function homeView(){return `<div class="page home-page"><div class="salute"><span class="eyebrow">IL TUO STILE, OGNI GIORNO</span><span class="day-date">${new Intl.DateTimeFormat('it',{day:'numeric',month:'long'}).format(new Date())}</span></div>
  <section class="hero"><div class="hero-decoration"><span class="ring ring-one"></span><span class="ring ring-two"></span><span class="hero-star">✧</span></div><p class="hero-eyebrow">ARMONIA STYLIST</p><h1>Ogni giorno,<br><em>una versione</em><br>di te.</h1><p>Il look giusto è già nel tuo armadio. Ti aiutiamo a trovarlo.</p><button class="hero-button" data-nav="stylist">Crea il mio outfit <span>↗</span></button></section>
  <div class="kpi-row"><div class="kpi"><strong>${count().toString().padStart(2,'0')}</strong><span>Capi nel guardaroba</span></div><div class="kpi"><strong>${state.saved.length.toString().padStart(2,'0')}</strong><span>Look salvati</span></div></div>
  <div class="section-header"><div><span class="eyebrow">PERSONAL CLOSET</span><h2>Ultimi arrivi</h2></div><button class="text-link" data-nav="closet">Vedi tutto ↗</button></div>${latestGrid()}
  <section class="demo-lab"><div><p class="eyebrow">LABORATORIO DEMO</p><h3>30 capi per provarlo.</h3><p>${demoCount()?`${demoCount()} di 30 capi illustrati inseriti, separati dai tuoi.`:'Abiti, sport, scarpe e accessori simulati per testare gli abbinamenti. Non sono vestiti reali.'}</p><div class="demo-actions"><button class="primary" data-action="load-demo">${demoCount()===30?'Demo già caricata':`Carica ${30-demoCount()} capi demo`}</button>${demoCount()?'<button class="outline" data-action="remove-demo">Rimuovi solo demo</button>':''}</div></div><span class="demo-illustration">✧</span></section>
  <section class="tip"><span>✦</span><div><strong>Consiglio di stile</strong><p>Per creare outfit completi, carica almeno un capo sopra, uno sotto e un paio di scarpe. Le foto private non appariranno nei suggerimenti normali.</p></div></section></div>`;}
  function closetView(){
    const cats=[['all','Tutti'],...E().CATEGORIES.map(x=>[x,label(x)])];
    let rows=state.items.filter(i=>((state.category==='all'&&i.category!=='intimate')||i.category===state.category) && (!state.search||(`${i.name} ${i.color} ${label(i.category)}`).toLowerCase().includes(state.search.toLowerCase())));
    return `<div class="page"><div class="heading"><div><p class="eyebrow">IL TUO ARCHIVIO PERSONALE</p><h1>Il guardaroba<span class="accent-dot">.</span></h1><p class="subtitle">Ogni capo, un nuovo abbinamento.</p></div><button class="square-add" data-action="open-add" aria-label="Aggiungi foto">+</button></div>
    <div class="search-wrap"><span>⌕</span><input id="closet-search" type="search" placeholder="Cerca per nome, colore, categoria..." value="${esc(state.search)}" aria-label="Cerca capi"></div>
    <div class="chip-scroll">${cats.map(([id,n])=>`<button class="filter-chip ${state.category===id?'selected':''}" data-category="${id}">${n}</button>`).join('')}</div>
    <p class="results-meta">${rows.length} ${rows.length===1?'capo':'capi'} ${state.category==='intimate'?'· reparto privato':''}</p>
    ${!rows.length?`<div class="empty-gallery"><div class="empty-gallery-visual"><span>✧</span><div class="hanger">♧</div></div><h3>${count()?'Nessun capo trovato':'Inizia dal primo capo'}</h3><p>${count()?'Prova un altro filtro o aggiungi una foto.':'Carica una foto: la terremo cifrata e potrai usarla nei tuoi outfit.'}</p><button class="primary" data-action="open-add">+ Aggiungi una foto</button></div>`:
    `<div class="garment-grid">${rows.map(i=>`<button class="garment-card" data-action="edit" data-id="${esc(i.id)}"><div class="garment-image">${photo(i)}<span class="garment-badge">${label(i.category)}</span>${i.demo?'<span class="demo-badge">DEMO</span>':''}${i.favorite?'<span class="garment-heart">♥</span>':''}</div><div class="garment-details"><strong>${esc(i.name)}</strong><span><i class="swatch" style="background:${E().COLOR_HEX[i.color]||'#aaa'}"></i>${esc(i.color||'Colore da impostare')}</span></div></button>`).join('')}</div>`}</div>`;
  }
  function lookCard(look,n,saved=false) {
    const items=look.ids.map(byId).filter(Boolean);
    if(!items.length)return '';
    return `<article class="look-card"><div class="look-card-heading"><div><span class="eyebrow">${saved?'LOOK SALVATO':`PROPOSTA ${String(n).padStart(2,'0')}`}</span><h3>${saved?esc(look.title||'Il mio look'):`${esc(E().EVENT_LABEL[state.occasion])}`}</h3></div><span class="look-number">${String(n).padStart(2,'0')}</span></div>
    <div class="look-composition">${items.map(i=>`<div class="look-piece">${photo(i)}<span>${esc(i.name)}${i.demo?' · DEMO':''}</span></div>`).join('')}</div>
    <p class="look-rationale">${esc(look.explanation||'Abbinamento con i capi del tuo catalogo.')}</p>
    ${look.missing?.length?`<p class="missing-notice">Da completare: ${look.missing.map(label).join(', ')}</p>`:''}
    <div class="look-actions">${saved?`<button class="outline" data-action="remove-look" data-id="${esc(look.id)}">Rimuovi</button>`:
    `<button class="outline" data-action="save-look" data-ids="${esc(look.ids.join(','))}">♡ Salva questo look</button>`}<span>${items.length} capi ${items.some(i=>i.demo)?'con demo':'reali'}</span></div></article>`;
  }
  function stylistView(){
    const examples=['Running con colori neutri','Cena elegante in nero','Look da ufficio in autunno'];
    return `<div class="page stylist-page"><div class="heading"><div><p class="eyebrow">LO STYLIST DEL TUO ARMADIO</p><h1>Come vuoi <em>sentirti?</em></h1><p class="subtitle">${demoCount()?'Prove con capi illustrativi. I tuoi abiti restano separati.':'Descrivi l’occasione. Userò solo ciò che possiedi.'}</p></div><span class="stylist-symbol">✧</span></div>
    <form id="stylist-form" class="stylist-form"><label class="field-caption" for="outfit-query">CHIEDI UN OUTFIT</label><textarea id="outfit-query" rows="3" placeholder="Es. Vorrei un look per una corsa al parco, con qualcosa di blu...">${esc(state.query)}</textarea>
      <div class="examples">${examples.map(q=>`<button type="button" data-query="${esc(q)}">${esc(q)} ↗</button>`).join('')}</div>
      <div class="selector-group"><label class="field-caption" for="occasion-select">OCCASIONE</label><select id="occasion-select">${E().EVENTS.map(o=>`<option value="${o}" ${state.occasion===o?'selected':''}>${E().EVENT_LABEL[o]}</option>`).join('')}</select></div>
      <div class="two-fields"><div><label class="field-caption" for="season-select">STAGIONE</label><select id="season-select"><option value="">Qualsiasi</option>${Object.entries(E().SEASONS).map(([v,n])=>`<option value="${v}" ${state.season===v?'selected':''}>${n}</option>`).join('')}</select></div>
      <div><label class="field-caption" for="color-select">COLORE PREFERITO</label><select id="color-select"><option value="">Nessuna preferenza</option>${E().COLORS.map(v=>`<option value="${v}" ${state.color===v?'selected':''}>${v[0].toUpperCase()+v.slice(1)}</option>`).join('')}</select></div></div>
      <button class="primary wide generate" type="submit"><span>✧</span> Crea 3 proposte <span>→</span></button></form>
      ${state.results?`<section class="proposal-section"><div class="section-header"><div><span class="eyebrow">CREATI PER TE</span><h2>Le tue proposte</h2></div></div>${state.results.looks.length?state.results.looks.map((l,i)=>lookCard(l,i+1)).join(''):`<div class="empty-gallery compact"><h3>Non ci sono ancora abbastanza capi</h3><p>Carica almeno un capo fotografato per ricevere una proposta reale.</p><button class="primary" data-action="open-add">Aggiungi un capo</button></div>`}</section>`:''}
      <p class="privacy-inline">⌑ Le immagini restano sul dispositivo. Le proposte sono calcolate offline, senza inviare foto a servizi esterni.</p></div>`;
  }
  function savedView(){const visible=state.saved.filter(l=>state.showPrivateSaved||l.occasion!=='intimo');return `<div class="page"><div class="heading"><div><p class="eyebrow">I TUOI ABBINAMENTI</p><h1>Look del cuore<span class="accent-dot">.</span></h1><p class="subtitle">Le combinazioni che vuoi ritrovare.</p></div></div>${state.saved.some(l=>l.occasion==='intimo')?`<button class="outline private-toggle" data-action="toggle-private-saved">${state.showPrivateSaved?'Nascondi':'Mostra'} look privati</button>`:''}${visible.length?visible.map((l,i)=>lookCard(l,i+1,true)).join(''):`<div class="empty-gallery"><div class="empty-gallery-visual"><span>♡</span></div><h3>Ancora nessun preferito</h3><p>Genera un outfit e premi “Salva questo look”.</p><button class="primary" data-nav="stylist">Vai allo Stylist</button></div>`}</div>`;}
  function settingsView(){return `<div class="page"><div class="heading"><div><p class="eyebrow">IL TUO SPAZIO PERSONALE</p><h1>Privacy e dati<span class="accent-dot">.</span></h1><p class="subtitle">Sei tu a controllare tutto.</p></div></div>
    <div class="setting-card"><span class="setting-icon">⌑</span><div><strong>Archivio cifrato</strong><p>Foto, descrizioni e look sono protetti con AES-256-GCM. La password resta solo nella tua memoria, non viene inviata a nessuno.</p></div><span class="check">✓</span></div>
    <div class="setting-card"><span class="setting-icon">☁̸</span><div><strong>Nessun cloud automatico</strong><p>Le foto non sono caricate online. Il catalogo resta nel browser di questo dispositivo, senza sincronizzazione tra telefoni.</p></div><span class="check">✓</span></div>
    <div class="settings-actions"><h2>Backup e sicurezza</h2><button class="setting-action" data-action="export">Esporta backup cifrato <span>↓</span></button><small>Consigliato dopo ogni caricamento importante. Il backup include foto e look, sempre cifrati.</small>
    <button class="setting-action" data-action="lock">Blocca subito il guardaroba <span>⌑</span></button><button class="setting-action danger-link" data-action="wipe">Elimina definitivamente tutti i dati <span>×</span></button></div>
    <div class="footnote"><strong>Nota importante</strong><p>Disinstallare l'app o cancellare i dati di Safari può eliminare il catalogo locale. Conserva il backup e la password separatamente. Nessun recupero password è possibile.</p></div>
    <p class="version">ARMONIA · R1.3 · iOS READY · PRIVACY-FIRST · OFFLINE</p></div>`;}
  function editorModal(){
    if(!state.editor)return '';
    const i=state.editor;
    const existing=!!i.id;
    const toggleGroup=(field,values,labels)=>values.map(v=>`<label class="toggle-option"><input type="checkbox" name="${field}" value="${v}" ${(i[field]||[]).includes(v)?'checked':''}><span>${labels[v]||v}</span></label>`).join('');
    return `<div class="modal-backdrop" data-action="close-editor" role="presentation"><section class="editor-modal" role="dialog" aria-modal="true" aria-label="Dettagli del capo"><header class="modal-header"><div><span class="eyebrow">${existing?'MODIFICA CAPO':'NUOVO CAPO'}</span><h2>${existing?'Dettagli del capo':'Aggiungi al guardaroba'}</h2></div><button class="close" data-action="close-editor" aria-label="Chiudi">×</button></header>
    <div class="editor-scroll"><div class="editor-photo">${photo(i)}</div>
    ${state.queue.length?`<p class="queue-note">${state.queue.length} foto in attesa dopo questa</p>`:''}
    <form id="garment-form"><label class="input-label" for="garment-name">Nome del capo</label><input id="garment-name" name="name" required maxlength="80" value="${esc(i.name||'')}" placeholder="Es. Leggings neri, blazer beige...">
    <div class="two-fields"><div><label class="input-label" for="garment-category">Categoria</label><select id="garment-category" name="category" required>${E().CATEGORIES.map(c=>`<option value="${c}" ${i.category===c?'selected':''}>${label(c)}</option>`).join('')}</select></div>
    <div><label class="input-label" for="garment-color">Colore principale</label><select name="color" id="garment-color">${E().COLORS.map(c=>`<option value="${c}" ${i.color===c?'selected':''}>${c[0].toUpperCase()+c.slice(1)}</option>`).join('')}</select></div></div>
    <label class="input-label" for="garment-style">Stile</label><select id="garment-style" name="style">${Object.entries(E().STYLES).map(([v,n])=>`<option value="${v}" ${i.style===v?'selected':''}>${n}</option>`).join('')}</select>
    <label class="input-label">Quando lo indossi?</label><div class="option-grid">${toggleGroup('occasions',E().EVENTS.filter(x=>x!=='intimo'),E().EVENT_LABEL)}</div>
    <label class="input-label">Stagione adatta</label><div class="option-grid">${toggleGroup('seasons',Object.keys(E().SEASONS),E().SEASONS)}</div>
    <label class="favorite-row"><input name="favorite" type="checkbox" ${i.favorite?'checked':''}><span>♡ Segna come preferito</span></label>
    <p class="form-tip">${i.category==='intimate'?'Questo capo resta nel reparto privato.':'Le foto di intimo compaiono soltanto se cerchi esplicitamente un outfit intimo.'}</p>
    <button class="primary wide" type="submit">${existing?'Salva modifiche':'Salva questo capo'} <span>→</span></button></form>
    ${existing?`<button class="delete-item" data-action="delete-item" data-id="${esc(i.id)}">Elimina questo capo</button>`:''}</div></section></div>`;
  }
  function render(){
    if(!state.key){authView();return;}
    const views={home:homeView,closet:closetView,stylist:stylistView,saved:savedView,settings:settingsView};
    app.innerHTML=`<div class="app-shell">${header()}<main class="main-content" id="main">${(views[state.view]||homeView)()}</main>${bottomNav()}<input type="file" id="upload-input" accept="image/*" multiple hidden>${editorModal()}</div>`;
  }
  async function onAuth(form){
    if(state.busy)return;
    const password=String(new FormData(form).get('password')||'');
    if(!state.hasVault&&password!==String(new FormData(form).get('confirm')||'')){notify('Le due password non coincidono.',true);return;}
    try{setBusy(true);
      state.key=state.hasVault?await Vault.unlock(state.db,password):await Vault.setup(state.db,password);
      state.hasVault=true;await refresh();state.view='home';render();notify('Guardaroba aperto. Le tue foto restano private.');
    }catch(err){state.key=null;notify(state.hasVault?'Password non corretta o archivio non disponibile.':err.message,true);}
    finally{setBusy(false);}
  }
  function lock(){state.key=null;state.items=[];state.saved=[];state.editor=null;state.queue=[];state.results=null;state.query='';state.showPrivateSaved=false;state.category='all';state.occasion='quotidiano';render();notify('Guardaroba bloccato.');}
  // iOS/Safari may not expose createImageBitmap; HTMLImageElement is a local, safe fallback.
  // Never sends photo data over the network. The canvas standardizes output to JPEG.
  async function photoToData(file){
    if(!(file.type.startsWith('image/') || /\.(?:jpe?g|png|webp|heic|heif)$/i.test(file.name)))
      throw new Error('Formato non supportato: scegli una fotografia JPG, PNG, WebP o HEIC.');
    if(file.size>25*1024*1024)throw new Error('Foto troppo grande (massimo 25 MB).');
    let source=null, revoke=null;
    if(typeof createImageBitmap==='function') {
      try{source=await createImageBitmap(file);}catch{ /* fallback to the native image decoder */ }
    }
    if(!source) {
      const url=URL.createObjectURL(file);
      revoke=()=>URL.revokeObjectURL(url);
      try {
        source=await new Promise((resolve,reject)=>{
          const picture=new Image();
          picture.onload=()=>resolve(picture);
          picture.onerror=()=>reject(new Error('Immagine non decodificabile su questo dispositivo. Per HEIC, prova a esportarla come JPEG.'));
          picture.src=url;
        });
      }catch(err){revoke();throw err;}
    }
    try {
      const w=source.width||source.naturalWidth,h=source.height||source.naturalHeight;
      if(!w||!h)throw new Error('Foto priva di dimensioni valide.');
      const scale=Math.min(1,1200/Math.max(w,h));
      const canvas=document.createElement('canvas');
      canvas.width=Math.max(1,Math.round(w*scale));canvas.height=Math.max(1,Math.round(h*scale));
      const ctx=canvas.getContext('2d',{willReadFrequently:true});
      if(!ctx)throw new Error('Elaborazione fotografica non disponibile.');
      ctx.fillStyle='#f9f7f3';ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(source,0,0,canvas.width,canvas.height);
      const color=predictColor(ctx,canvas.width,canvas.height);
      return {image:canvas.toDataURL('image/jpeg',0.78),color};
    }finally {
      if(typeof source.close==='function')source.close();
      if(revoke)revoke();
    }
  }
  function predictColor(ctx,w,h){
    const data=ctx.getImageData(0,0,w,h).data;
    const palette=Object.entries(E().COLOR_HEX).map(([name,hex])=>[name,...[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16))]);
    const votes={};
    // Sample the central region, reducing influence of plain backdrops.
    const step=Math.max(2,Math.floor(Math.min(w,h)/35));
    for(let y=Math.floor(h*.18);y<h*.82;y+=step)for(let x=Math.floor(w*.18);x<w*.82;x+=step){
      const p=(y*w+x)*4,r=data[p],g=data[p+1],b=data[p+2];
      if((r>230&&g>230&&b>230)||(r<12&&g<12&&b<12))continue;
      const [name]=palette.slice().sort((a,b1)=>
        ((r-a[1])**2+(g-a[2])**2+(b-a[3])**2)-((r-b1[1])**2+(g-b1[2])**2+(b-b1[3])**2))[0];
      votes[name]=(votes[name]||0)+1;
    }
    return Object.entries(votes).sort((a,b)=>b[1]-a[1])[0]?.[0]||'nero';
  }
  async function loadFiles(files){
    const selected=[...files];
    const valid=selected.filter(f=>f.type.startsWith('image/')||/\.(?:jpe?g|png|webp|heic|heif)$/i.test(f.name));
    if(!valid.length){notify('Seleziona fotografie JPG, PNG, WebP o HEIC leggibili sul dispositivo.',true);return;}
    if(selected.length>40){notify('Carica massimo 40 foto per volta.',true);return;}
    try {
      setBusy(true);
      const prepared=[],failed=[];
      for(const file of valid){
        try {
          const p=await photoToData(file);
          const name=file.name.replace(/\.[^.]+$/,'').replace(/[_-]/g,' ').slice(0,80);
          prepared.push({image:p.image,color:p.color,name,category:'top',style:'casual',occasions:[],seasons:[],favorite:false});
        }catch(err){failed.push(file.name+': '+err.message);}
      }
      if(!prepared.length)throw new Error(failed[0]||'Nessuna foto leggibile.');
      state.queue.push(...prepared);
      if(!state.editor)state.editor=state.queue.shift();
      render();
      notify(`${prepared.length} foto pronte${failed.length?`; ${failed.length} non leggibili (usa JPG per HEIC non supportati)`:''}. Completa e salva i capi.`,!!failed.length);
    }catch(err){notify('Importazione non riuscita: '+err.message,true);}
    finally{setBusy(false);}
  }
  async function loadDemo(){
    if(state.busy)return;
    let loaded=0;
    try {
      setBusy(true);
      const known=new Set(state.items.filter(i=>i.demo).map(i=>i.demoKey));
      for(const entry of DemoWardrobe.ITEMS){
        if(known.has(entry.key))continue;
        const image=await DemoWardrobe.imageData(entry.asset);
        await Vault.save(state.db,state.key,'garment',DemoWardrobe.toRecord(entry,image));
        loaded++;
      }
      await refresh();state.results=null;render();notify(loaded?`${loaded} capi DEMO aggiunti. Prova lo Stylist!`:'Tutti i 30 capi DEMO sono già presenti.');
    }catch(err){await refresh();render();notify('Importazione demo parziale ('+loaded+'): '+err.message,true);}
    finally{setBusy(false);}
  }
  async function removeDemo(){
    if(state.busy)return;
    const ids=state.items.filter(i=>i.demo).map(i=>i.id);
    if(!ids.length){notify('Nessun capo demo presente.');return;}
    if(!confirm(`Eliminare ${ids.length} capi DEMO e i look salvati che li contengono? Le tue foto personali resteranno intatte.`))return;
    try{
      setBusy(true);
      const known=new Set(ids);
      const linked=state.saved.filter(l=>l.ids.some(id=>known.has(id)));
      for(const l of linked)await Vault.remove(state.db,l.id);
      for(const id of ids)await Vault.remove(state.db,id);
      await refresh();state.results=null;state.view='home';render();notify(`${ids.length} capi demo rimossi. Foto personali intatte.`);
    }catch(err){await refresh();render();notify('Pulizia DEMO incompleta: '+err.message,true);}
    finally{setBusy(false);}
  }
  async function saveGarment(form){
    if(state.busy)return;
    const f=new FormData(form);const draft=state.editor;
    if(!draft)return;
    const item={...draft,name:String(f.get('name')||'').trim().slice(0,80),category:String(f.get('category')),color:String(f.get('color')),style:String(f.get('style')),
      occasions:f.getAll('occasions'),seasons:f.getAll('seasons'),favorite:f.has('favorite'),createdAt:draft.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
    if(!item.name){notify('Inserisci il nome del capo.',true);return;}
    try{setBusy(true);await Vault.save(state.db,state.key,'garment',item);await refresh();state.editor=state.queue.shift()||null;state.results=null;render();notify('Capo salvato nel tuo archivio cifrato.');}
    catch(err){notify('Salvataggio non riuscito: '+err.message,true);}
    finally{setBusy(false);}
  }
  async function saveLook(ids){
    const good=ids.filter(id=>byId(id));if(!good.length)return;
    const item={title:E().EVENT_LABEL[state.occasion]||'Il mio outfit',ids:good,occasion:state.occasion,createdAt:new Date().toISOString(),explanation:'Outfit salvato dal mio guardaroba.'};
    try{await Vault.save(state.db,state.key,'outfit',item);await refresh();render();notify('Outfit aggiunto ai preferiti.');}catch(err){notify(err.message,true);}
  }
  function generate(){
    const query=String(document.getElementById('outfit-query')?.value||'');
    const parsed=E().guessQuery(query);
    state.query=query;
    state.occasion=query&&parsed.occasion!=='quotidiano'?parsed.occasion:document.getElementById('occasion-select')?.value||'quotidiano';
    state.season=parsed.season||document.getElementById('season-select')?.value||'';
    state.color=parsed.color||document.getElementById('color-select')?.value||'';
    state.results=E().makeLooks(state.items,{occasion:state.occasion,season:state.season,color:state.color});
    render();document.querySelector('.proposal-section')?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  async function exportData(){
    try{
      const data=await Vault.backup(state.db);
      const blob=new Blob([JSON.stringify(data)],{type:'application/json'});
      const a=document.createElement('a');const url=URL.createObjectURL(blob);a.href=url;a.download='ARMONIA_BACKUP_CIFRATO_'+new Date().toISOString().slice(0,10)+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
      notify('Backup cifrato creato. Conservalo in un luogo sicuro.');
    }catch(err){notify(err.message,true);}
  }
  async function restore(file){
    try{
      if(file.size>350*1024*1024)throw new Error('Backup troppo grande');
      const data=JSON.parse(await file.text());
      await Vault.restoreIntoEmpty(state.db,data);
      state.hasVault=true;render();notify('Archivio importato. Sbloccalo con la password originale.');
    }catch(err){notify('Ripristino fallito: '+err.message,true);}
  }
  async function wipe(){
    const response=prompt('ATTENZIONE: tutto il guardaroba e i look saranno cancellati definitivamente. Scrivi ELIMINA per continuare.');
    if(response!=='ELIMINA')return;
    if(!confirm('Hai esportato un backup? Questa azione non è reversibile.'))return;
    try{await Vault.wipe(state.db);state.hasVault=false;lock();notify('Archivio eliminato dal dispositivo.');}catch(err){notify(err.message,true);}
  }
  app.addEventListener('submit',async ev=>{
    ev.preventDefault();
    if(ev.target.id==='auth-form')await onAuth(ev.target);
    if(ev.target.id==='garment-form')await saveGarment(ev.target);
    if(ev.target.id==='stylist-form')generate();
  });
  app.addEventListener('click',async ev=>{
    const button=ev.target.closest('[data-nav],[data-action],[data-category],[data-query]');
    if(!button||state.busy)return;
    if(button.dataset.nav){if(state.view==='stylist'&&state.occasion==='intimo'){state.results=null;state.query='';state.occasion='quotidiano';}state.view=button.dataset.nav;state.editor=null;state.queue=[];state.search='';render();window.scrollTo(0,0);return;}
    if(button.dataset.category){state.category=button.dataset.category;render();return;}
    if(button.dataset.query){state.query=button.dataset.query;state.results=null;render();document.querySelector('#outfit-query')?.focus();return;}
    const action=button.dataset.action;
    if(action==='load-demo')await loadDemo();
    else if(action==='remove-demo')await removeDemo();
    else if(action==='open-add')document.getElementById('upload-input')?.click();
    else if(action==='lock')lock();
    else if(action==='edit'){const row=byId(button.dataset.id);if(row){state.editor={...row};render();}}
    else if(action==='close-editor'){
      if(ev.target===button||button.classList.contains('close')){state.editor=null;state.queue=[];render();}
    }
    else if(action==='delete-item'){
      if(confirm('Eliminare definitivamente questo capo dal guardaroba?')){
        await Vault.remove(state.db,button.dataset.id);await refresh();state.editor=null;state.results=null;render();notify('Capo eliminato.');
      }
    }
    else if(action==='save-look')await saveLook((button.dataset.ids||'').split(','));
    else if(action==='remove-look'){
      if(confirm('Rimuovere il look dai salvati?')){await Vault.remove(state.db,button.dataset.id);await refresh();render();notify('Look rimosso.');}
    }
    else if(action==='toggle-private-saved'){state.showPrivateSaved=!state.showPrivateSaved;render();}
    else if(action==='export')await exportData();
    else if(action==='restore-start'){
      const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.onchange=()=>input.files[0]&&restore(input.files[0]);input.click();
    }
    else if(action==='wipe')await wipe();
  });
  app.addEventListener('change',ev=>{if(ev.target.id==='upload-input'){const files=ev.target.files;loadFiles(files);}});
  app.addEventListener('input',ev=>{
    if(ev.target.id==='closet-search'){
      state.search=ev.target.value;
      const selectionStart=ev.target.selectionStart;
      render();const inp=document.getElementById('closet-search');inp?.focus();try{inp?.setSelectionRange(selectionStart,selectionStart);}catch{}
    }
  });
  async function init(){
    try{
      if(!window.crypto?.subtle||!window.indexedDB)throw new Error('Apri l’app in un browser aggiornato tramite HTTPS o localhost.');
      state.db=await Vault.openDb();state.hasVault=!!(await Vault.metadata(state.db));render();
      if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
    }catch(err){app.innerHTML=`<div class="critical"><h1>Impossibile aprire Armonia</h1><p>${esc(err.message)}</p><p>Usa un server locale o una pubblicazione HTTPS. Il catalogo non viene inviato al server.</p></div>`;}
  }
  init();
})();
