/* Deterministic, explainable offline matching. Never invents catalog items. */
(() => {
  const EVENTS = ['quotidiano','running','palestra','ufficio','sera','cerimonia','viaggio','intimo'];
  const COLORS = ['nero','bianco','grigio','beige','marrone','blu','azzurro','verde','rosso','rosa','viola','giallo','arancione'];
  const COLOR_HEX = {nero:'#292a2c',bianco:'#f4f2ed',grigio:'#909197',beige:'#cbb9a1',marrone:'#875c44',blu:'#314c88',azzurro:'#83b9e2',verde:'#60876c',rosso:'#bd5255',rosa:'#df9fb8',viola:'#8e73a2',giallo:'#edce68',arancione:'#e1a066'};
  const COLOR_HUE = {marrone:24,blu:225,azzurro:205,verde:132,rosso:0,rosa:335,viola:277,giallo:50,arancione:25};
  const NEUTRAL = new Set(['nero','bianco','grigio','beige']);
  const SLOT_LABEL = {top:'Sopra',bottom:'Sotto',dress:'Abito',outer:'Strato',shoes:'Scarpe',accessory:'Accessorio',intimate:'Intimo'};
  const EVENT_LABEL = {quotidiano:'Quotidiano',running:'Running',palestra:'Palestra',ufficio:'Ufficio',sera:'Sera elegante',cerimonia:'Cerimonia',viaggio:'Viaggio',intimo:'Intimo'};
  const STYLES = {casual:'Casual',sportivo:'Sportivo',elegante:'Elegante',minimal:'Minimal'};
  const SEASONS={primavera:'Primavera',estate:'Estate',autunno:'Autunno',inverno:'Inverno'};
  const CATEGORIES = ['top','bottom','dress','outer','shoes','accessory','intimate'];
  const preferredStyle={running:'sportivo',palestra:'sportivo',sera:'elegante',cerimonia:'elegante',ufficio:'minimal'};
  function guessQuery(text) {
    const q=(text||'').toLocaleLowerCase('it');
    let occasion='quotidiano';
    const keys = [
      ['running',/running|corsa|correre|jogging|maratona/],
      ['palestra',/palestra|fitness|allenamento|gym|yoga/],
      ['ufficio',/ufficio|lavoro|meeting|riunione/],
      ['sera',/elegant|sera|serata|cena|ristorante|appuntamento|aperitivo/],
      ['cerimonia',/matrimonio|cerimonia|gala|festa formale/],
      ['viaggio',/viaggio|aereo|vacanza|trasferta/],
      ['intimo',/intimo|lingerie|reggiseno|slip|brasilian/]
    ];
    for(const [k,re] of keys) if(re.test(q)) { occasion=k;break; }
    let color='';
    for(const c of COLORS) if(new RegExp(`\\b${c}\\b`).test(q)){color=c;break;}
    let season='';
    for(const [s,re] of [['estate',/estate|estivo|caldo/],['inverno',/inverno|invernale|freddo/],['primavera',/primavera/],['autunno',/autunno|autunnale/]]) if(re.test(q)){season=s;break;}
    return {occasion,color,season};
  }
  function affinity(a,b) {
    if(!a||!b) return 0;
    if(a===b) return 12;
    if(NEUTRAL.has(a) || NEUTRAL.has(b)) return 10;
    const d=Math.abs((COLOR_HUE[a]||0)-(COLOR_HUE[b]||0)); const delta=Math.min(d,360-d);
    if(delta<45) return 7;
    if(delta>145&&delta<210) return 5;
    if(delta>85&&delta<140) return -7;
    return -1;
  }
  function rankItem(item,opts) {
    let score=0;
    if(item.occasions?.includes(opts.occasion)) score+=30;
    else if(item.occasions?.length) score-=15;
    else if(['running','palestra','cerimonia'].includes(opts.occasion)) score-=15;
    else score+=2;
    if(opts.season && item.seasons?.length && !item.seasons.includes(opts.season)) score-=24;
    if(opts.season && item.seasons?.includes(opts.season)) score+=11;
    if(opts.color && item.color===opts.color) score+=18;
    const style=preferredStyle[opts.occasion];
    if(style&&item.style===style) score+=12;
    if(item.favorite) score+=3;
    return score;
  }
  function makeLooks(items,opts={occasion:'quotidiano',color:'',season:''}) {
    const visible=items.filter(i=>i.kind==='garment' && i.image && i.category &&
      (opts.occasion==='intimo' ? i.category==='intimate' : i.category!=='intimate'));
    if(opts.occasion==='intimo') {
      return {looks:visible.sort((a,b)=>rankItem(b,opts)-rankItem(a,opts)).slice(0,4).map(i=>({ids:[i.id],score:rankItem(i,opts),explanation:'Selezione dal reparto privato.',missing:[]})),missing:visible.length?[]:['intimate']};
    }
    const bySlot=(slot)=>visible.filter(i=>i.category===slot).sort((a,b)=>rankItem(b,opts)-rankItem(a,opts)).slice(0,12);
    const tops=bySlot('top'),bottoms=bySlot('bottom'),dresses=bySlot('dress'),shoes=bySlot('shoes'),outers=bySlot('outer'),accessories=bySlot('accessory');
    const combos=[];
    const base=[];
    if(dresses.length) for(const d of dresses) base.push([d]);
    for(const t of tops) for(const b of bottoms) base.push([t,b]);
    // When the wardrobe is incomplete, show partial looks rather than imaginary products.
    if(!base.length) for(const i of [...tops,...bottoms,...dresses]) base.push([i]);
    const shoeOpts=shoes.length?shoes:[null];
    for(const pair of base) for(const shoe of shoeOpts) {
      if(opts.occasion==='running' && pair.some(i=>i.category==='dress')) continue;
      const outfit=[...pair,...(shoe?[shoe]:[])];
      const scores=outfit.map(i=>rankItem(i,opts));
      let score=scores.reduce((a,b)=>a+b,0)/outfit.length;
      for(let a=0;a<outfit.length;a++) for(let b=a+1;b<outfit.length;b++) score+=affinity(outfit[a].color,outfit[b].color);
      if(pair.length===1 && pair[0].category!=='dress')score-=30;
      if(!shoe)score-=12;
      if(opts.color && outfit.some(i=>i.color===opts.color))score+=18;
      if(opts.color && !outfit.some(i=>i.color===opts.color))score-=8;
      if(opts.occasion==='running' && shoe && shoe.occasions?.includes('running')) score+=18;
      if(opts.occasion==='running' && !outfit.some(i=>i.occasions?.includes('running')))score-=35;
      const sortedOuter=outers.filter(i=>!opts.season || !i.seasons?.length || i.seasons.includes(opts.season))
        .sort((a,b)=>rankItem(b,opts)+affinity(b.color,outfit[0].color)-rankItem(a,opts)-affinity(a.color,outfit[0].color));
      if(opts.season==='inverno' && sortedOuter[0]) {outfit.push(sortedOuter[0]); score+=7;}
      if(accessories.length && opts.occasion!=='running' && opts.occasion!=='palestra') {
        const acc=accessories.slice().sort((a,b)=> (rankItem(b,opts)+affinity(b.color,outfit[0].color))-(rankItem(a,opts)+affinity(a.color,outfit[0].color)))[0];
        if(acc){outfit.push(acc);score+=5;}
      }
      const missing=[];
      if(!pair.some(i=>i.category==='dress') && !pair.some(i=>i.category==='top'))missing.push('top');
      if(!pair.some(i=>i.category==='dress') && !pair.some(i=>i.category==='bottom'))missing.push('bottom');
      if(!shoe)missing.push('shoes');
      combos.push({ids:outfit.map(i=>i.id),score,missing});
    }
    combos.sort((a,b)=>b.score-a.score);
    const used=new Set();const looks=[];
    for(const c of combos){
      const key=c.ids.slice(0,3).join('|');if(used.has(key))continue;
      // Avoid three near-identical sets if several diverse options exist.
      if(looks.length && looks.some(l=>l.ids.filter(id=>c.ids.includes(id)).length>=Math.min(l.ids.length,c.ids.length)) && combos.length>6)continue;
      used.add(key);looks.push({...c,explanation:c.missing.length?'Proposta parziale: mancano alcuni capi in catalogo.':`Abbinamento basato su occasione, palette cromatica e stagionalità.`});
      if(looks.length===3)break;
    }
    const missing=[];
    if(!tops.length && !dresses.length)missing.push('top');
    if(!bottoms.length && !dresses.length)missing.push('bottom');
    if(!shoes.length)missing.push('shoes');
    return {looks,missing};
  }
  window.StyleEngine={EVENTS,COLORS,COLOR_HEX,CATEGORIES,SLOT_LABEL,EVENT_LABEL,STYLES,SEASONS,guessQuery,makeLooks,affinity};
})();
