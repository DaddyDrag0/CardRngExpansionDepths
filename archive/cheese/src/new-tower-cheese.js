(function NewTowerCheese(){
"use strict";
const cfg=window.CRXTowerConfig2026;
if(!cfg)return;
const STORE="crx-2026-tower-cheese-v1";
const defaults={tower:"Normal",floor:105,hardcore:false,rerolls:{},seed:117,aiEffort:"quick",runs:200,team:["","","",""],borders:["","","",""],mutations:["","","",""],abilityAura:"Guardian Angel",gemPveBonus:0,searchMutation:"Storm",ownedOnly:false,ownedPool:"",excludedPool:"",addedCards:[],poolQuery:"",optionsOpen:false,customEnemy:["","","","","","","",""],result:null,error:"",running:false};
let s={...defaults};
try{s={...s,...JSON.parse(localStorage.getItem(STORE)||"{}"),running:false,result:null,error:""};}catch(_){}
try{
 const marker=STORE+"-empty-starter-v2";
 if(!localStorage.getItem(marker)){
  if(JSON.stringify(s.team)==="[\"Robin Hood\",\"Noveau Riche\",\"Pandora\",\"Kuchisake-onna\"]"&&[...(s.borders||[]),...(s.mutations||[])].every(v=>!v)){
   s.team=["","","",""];
  }
  localStorage.setItem(marker,"1");
 }
}catch(_){}

let cardList=[],thumbs={},worker=null,requestId=0,cardsLoading=false;
function revealCheeseResults(selector){
 window.requestAnimationFrame?.(()=>{
  const node=document.querySelector("#crx-simple-view "+selector.split(",").join(",#crx-simple-view "));
  if(!node)return;
  const rect=node.getBoundingClientRect();
  if(rect.top>window.innerHeight-100)node.scrollIntoView({behavior:window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches?"auto":"smooth",block:"nearest"});
 });
}
const esc=x=>String(x??"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[a]));
const nice=x=>new Intl.NumberFormat("en-US",{notation:"compact",maximumFractionDigits:2}).format(x);
const opts=(arr,v)=>arr.map(x=>`<option value="${esc(x)}" ${x===v?"selected":""}>${esc(x)}</option>`).join("");
const parsing=x=>String(x||"").split(/[,;\n]/).map(x=>x.trim()).filter(Boolean);
const banned=()=>s.hardcore?[]:(s.tower==="Impossible"||!["Easy","Normal","Hard","Extreme","Hell"].includes(s.tower)?cfg.bannedCards:[]);
const hardcoreDisabled=()=>s.hardcore?(cfg.hardcoreDisabledCards||[]).filter(n=>!(cfg.hardcoreExceptions?.[s.tower]||[]).includes(n)):[];
function stats(){
 const t=cfg.towers[s.tower],floor=Math.max(1,Math.min(105,Math.floor(Number(s.floor)||1)));
 s.floor=floor;
 function val([start,end]){if(floor===1)return start;if(floor===105)return end;return Math.max(1,Math.floor(start*Math.pow((end/1.25)/start,(floor-1)/104)*(floor%5===0?1.25:1)))}
 return {attack:val(t.damage),hp:val(t.hp),floor,t};
}
function generatedPool(t){
 const weather=t.enemyPool==="Weather";
 return cardList.filter(c=>{
  if(!c.rarity||c.unobtainable||c.expires||c.boss)return false;
  if(weather)return !!c.weather&&cfg.weatherPool.includes(c.weather)&&(!c.collection||c.collection==="Mythical")&&!["Era2","Christmas","Halloween","Halloween2","Halloween3"].includes(c.pack);
  return !c.weather&&!c.collection&&!c.sin&&!c.virtue&&!["Era2","Christmas","Halloween","Halloween2","Halloween3"].includes(c.pack);
 }).sort((a,b)=>a.rarity-b.rarity||a.name.localeCompare(b.name)).map(c=>c.name);
}
function enemies(){
 const {floor,t}=stats(),boss=cfg.bossTeams[t.set]?.[floor];
 if(boss)return {names:boss.split("|"),exact:true};
 const all=generatedPool(t),n=t.teamSize===8?8:4;
 if(!all.length)return {names:Array(n).fill("Archer"),exact:false};
 const count=t.teamSize===8?all.length:Math.max(8,Math.floor(all.length*.25));
 const start=t.teamSize===8?0:Math.max(0,Math.min(all.length-count,Math.floor((floor-1)/104*(all.length-count))));
 const pool=all.slice(start,start+count);
 let v=0;for(let i=0;i<s.tower.length;i++)v=(v*31+s.tower.charCodeAt(i))%1000003;
 const reroll=Math.max(0,Math.floor(Number(s.rerolls?.[s.tower+"|"+floor])||0));
 let seed=(v*1000+floor+(reroll?reroll*1000003:0))>>>0;
 const rand=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296};
 const result=[];for(let i=0;i<n&&pool.length;i++)result.push(pool.splice(Math.floor(rand()*pool.length),1)[0]);
 return {names:result,exact:false};
}
function effectiveEnemies(){
 const generated=enemies();
 return {names:generated.names.map((x,i)=>s.customEnemy?.[i]?.trim()||x),exact:generated.exact&&!s.customEnemy?.some(x=>x)};
}
function save(){try{const {result,error,running,...safe}=s;localStorage.setItem(STORE,JSON.stringify(safe))}catch(_){}}
function rowLabel(x){return `<span>${x}</span>`}
const cardByName=name=>cardList.find(c=>c.name===name);
const portrait=name=>{const card=cardByName(name),src=card&&thumbs[String(card.imageAssetId)];return `<span class="cc-portrait">${src?`<img loading="lazy" src="${esc(src)}" alt="">`:`<span>${esc((name||"?").slice(0,1))}</span>`}</span>`};
const poolDefaults=["Judgment Day","Robin Hood","Parallax","Piccolo","Pandora","Kuchisake-onna","Fate Seamstress","Kira","Hell's Army","Noveau Riche"];
function selectCards(){
 const cards=s.team.map((name,i)=>`<div class="tc-member">${portrait(name)}<div class="tc-member-fields"><label>${rowLabel(`Card ${i+1}`)}<input list="tc-cards" data-team="${i}" value="${esc(name)}" placeholder="Choose card"></label><div class="tc-member-details"><label>${rowLabel("Border")}<select data-border="${i}">${opts(["","Platinum","Emerald","Crystal","Ruby","Galaxy"],s.borders[i]||"")}</select></label><label>${rowLabel("Mutation")}<select data-mutation="${i}">${opts(["","Storm","Snow","Aurora","Shroud","Meteor Shower","Time Storm","Eclipse","Virus","Blood Rain","Armageddon","Manga","Pumpkin Moon","The Great Deluge","Reality Fracture","Dreamfall"],s.mutations[i]||"")}</select></label></div></div></div>`).join("");
 return `<datalist id="tc-cards">${cardList.map(c=>`<option value="${esc(c.name)}"></option>`).join("")}</datalist><div class="tc-team">${cards}</div>`;
}
function render(){
 if(!cardList.length&&!cardsLoading)loadCards();
 const {attack,hp,floor,t}=stats(),e=effectiveEnemies(),blocked=banned();
 const rules=[t.mutatedOnly?"Mutated cards only":null,t.noAuras?"No Auras":null,t.freezeChance?"25% freeze":null,t.noHealing?"No healing":null,t.stun?"Stun / burn":null,t.teamSize===8?"4 vs 8 enemies":null,t.enemyPool==="Weather"?"Rare / Mythical Weather enemies":null,s.hardcore?"Hardcore · abilities restricted":null].filter(Boolean).join(" · ");
 const result=s.result;
 let output="";
 if(result?.recommendations){
   const recommendations=result.recommendations.slice(0,5);
   output=`<div class="tc-results"><div class="tc-results-title">Cheese results</div>${recommendations.length?recommendations.map((v,i)=>`<div class="tc-recommend"><strong><small>#${i+1} / WIN RATE</small>${(v.winRate*100).toFixed(1)}%</strong><span>${v.loadout.cards.map(c=>`<span class="tc-rec-card">${portrait(c.cardName)}<b>${esc(c.cardName)}</b></span>`).join("")}</span><small>${v.wins}/${v.runs} simulated wins · ${esc(v.loadout.abilityAura?.auraName||"No ability Aura")} · ${nice(v.averageTurns||0)} turns ${v.trusted===false?"· Unverified effects":""}</small><button data-use="${i}" type="button">Load &amp; verify</button></div>`).join(""):`<p>No winning decks in the selected pool.</p>`}</div>`;
 }else if(result?.wins!==undefined)output=`<div class="tc-result-simple"><strong>${(result.winRate*100).toFixed(1)}% wins</strong><span><b>${result.wins}/${result.runs} simulated battles</b> · ${nice(result.averageTurns)} avg turns · seed ${result.simSeed||"?"}${result.trusted===false?" · Some effects unverified":""}</span></div>`;
 return `<div class="tc cc-rework cc-tower">
 <div class="cc-page-top tc-page-top cc-hero"><div class="cc-hero-copy"><span class="cc-kicker">EXPANSION / TOWER</span><h2>Tower Cheese</h2><small>Find a winning setup for any tower and floor.</small></div><div class="cc-hero-index"><b>13</b><span>TOWERS<br>105 FLOORS</span></div></div>
 <section class="cc-match-strip">
 <div class="tc-bar"><label>${rowLabel("Tower")}<select id="tc-tower">${opts(cfg.order,s.tower)}</select></label><label>${rowLabel("Floor")}<input id="tc-floor" type="number" min="1" max="105" value="${floor}"></label><label class="tc-hardcore-toggle">Hardcore<input id="tc-hardcore" type="checkbox" ${s.hardcore?"checked":""}></label><label>${rowLabel("Simulation runs")}<select id="tc-runs">${opts(["100","200","500","1000"],String(s.runs))}</select></label></div>
 <div class="tc-stats"><strong>${nice(hp)} HP</strong><strong>${nice(attack)} ATK</strong><span>${t.set} boss teams · ${t.border||"No"} border</span></div>
 </section>
 ${rules?`<div class="tc-rules">${esc(rules)}</div>`:""}${blocked.length?`<div class="tc-bans">Unavailable: ${blocked.map(esc).join(", ")}</div>`:""}
 <div class="cc-arena"><section class="cc-opponents">
 <div class="tc-label"><h3>Enemy team</h3><small>${e.exact?"Fixed lineup":`Random floor · reroll ${s.rerolls?.[s.tower+"|"+floor]||0}`}</small>${!e.exact?`<button id="tc-reroll" type="button">Reroll enemies</button>`:""}</div>
 <div class="tc-enemies">${e.names.map((name,i)=>`<div class="tc-enemy-card">${portrait(name)}<div class="tc-enemy-info"><span class="tc-enemy-label">Enemy ${i+1}</span>${e.exact?`<strong class="tc-enemy-name" title="${esc(name)}">${esc(name)}</strong>`:`<input list="tc-cards" data-enemy="${i}" value="${esc(name)}" aria-label="Enemy ${i+1}">`}<span class="tc-ability" title="${esc(cardByName(name)?.ability||"")}">${esc(cardByName(name)?.ability||"")}</span></div></div>`).join("")}</div>
 ${s.hardcore?`<div class="tc-bans">Disabled card abilities: ${hardcoreDisabled().map(esc).join(", ")} · Disabled Auras: ${(cfg.hardcoreDisabledAuras||[]).join(", ")}</div>`:""}
 </section><section class="cc-players">
 <div class="tc-label"><h3>Your deck</h3><small>Choose four cards</small><button type="button" class="cc-clear-deck" id="tc-clear-deck">Clear deck</button></div>
 ${selectCards()}
 </section></div>

 <div class="tc-actions"><button id="tc-cheese" ${s.running?"disabled":""} type="button">Find Cheese</button><button id="tc-simulate" ${s.running?"disabled":""} type="button">Simulate deck</button><span id="tc-progress" role="status" aria-live="polite">${s.running?"Running…":s.error?esc(s.error):""}</span></div>

 ${output}
 <details class="cc-additional"><summary>Tower rewards &amp; first clears</summary> ${window.CRXTowerPackPlanner?.render(cfg.order)||""}</details>

 <details class="tc-extra" ${s.optionsOpen?"open":""}><summary>Search options</summary><div class="tc-extra-grid"><div style="grid-column:1/-1"><small style="color:var(--muted)">Search pool — click cards to disable them</small><div class="tc-pool-list">${poolDefaults.map(name=>`<button type="button" class="${parsing(s.excludedPool).includes(name)?"off":""}" data-tc-pool="${esc(name)}">${esc(name)}</button>`).join("")}</div></div><label>${rowLabel("Add card to search")}<input list="tc-cards" id="tc-pool-input" value="${esc(s.poolQuery)}" placeholder="Card name"></label><button type="button" id="tc-pool-add">Add card</button><div class="tc-added-list">${(s.addedCards||[]).map(n=>`<button type="button" data-tc-remove="${esc(n)}">${esc(n)} ×</button>`).join("")}</div>
 <label>${rowLabel("Ability Aura (manual)")}<input id="tc-aura" value="${esc(s.abilityAura)}" placeholder="None"></label>
 <label>${rowLabel("Red Gem PvE bonus %")}<input id="tc-redgem" type="number" min="0" max="100" step="2.5" value="${esc(s.gemPveBonus)}"></label>${t.mutatedOnly?`<label>${rowLabel("Search mutation weather")}<select id="tc-search-mutation">${opts(["Storm","Snow","Aurora","Shroud","Meteor Shower","Time Storm","Eclipse","Virus","Blood Rain","Armageddon","Manga","Pumpkin Moon","The Great Deluge","Reality Fracture","Dreamfall"],s.searchMutation)}</select></label>`:""}
 <label>${rowLabel("Owned cards (comma separated)")}<textarea id="tc-owned" rows="2" placeholder="Card 1, Card 2, Card 3...">${esc(s.ownedPool)}</textarea></label>
 <label>${rowLabel("Excluded cards (comma separated)")}<textarea id="tc-excluded" rows="2">${esc(s.excludedPool)}</textarea></label>
 <label class="tc-check"><input type="checkbox" id="tc-ownedonly" ${s.ownedOnly?"checked":""}> Search only owned cards</label>
 </div></details>
 <div class="tc-disclaimer">${!e.exact?"Random enemy lineup is an estimate. ":""}${t.freezeChance||t.noHealing||t.stun?"Some special effects are approximate. ":""}Simulated results.</div>
 </div>`;
}
function bind(root,rerender){
 const el=id=>root.querySelector("#"+id);
 el("tc-clear-deck")?.addEventListener("click",()=>{s.team=Array(4).fill("");s.borders=Array(4).fill("");s.mutations=Array(4).fill("");s.result=null;s.error="";save();rerender()});
 root.querySelector(".tc-extra")?.addEventListener("toggle",e=>{if(s.optionsOpen!==e.target.open){s.optionsOpen=e.target.open;save()}});
 function change(id,key,convert=x=>x){const n=el(id);n?.addEventListener("change",()=>{s[key]=convert(n.value);s.result=null;s.error="";save();rerender()})}
 change("tc-tower","tower",x=>{s.customEnemy=["","","","","","","",""];return x});
 change("tc-floor","floor",x=>{s.customEnemy=["","","","","","","",""];return Math.max(1,Math.min(105,Number(x)||1))});
 change("tc-runs","runs",Number);
 el("tc-hardcore")?.addEventListener("change",e=>{s.hardcore=e.target.checked;s.result=null;save();rerender()});
 el("tc-reroll")?.addEventListener("click",()=>{const key=s.tower+"|"+s.floor;s.rerolls??={};s.rerolls[key]=Math.min(1000,(s.rerolls[key]||0)+1);s.customEnemy=Array(8).fill("");s.result=null;save();rerender()});
 for(const [selName,key] of [["data-team","team"],["data-border","borders"],["data-mutation","mutations"],["data-enemy","customEnemy"]]){
  root.querySelectorAll(`[${selName}]`).forEach(n=>n.addEventListener("change",()=>{s[key][Number(n.getAttribute(selName))]=n.value;s.result=null;save();rerender()}));
 }
 for(const [id,key] of [["tc-aura","abilityAura"],["tc-owned","ownedPool"],["tc-excluded","excludedPool"]]){
  const n=el(id);n?.addEventListener("change",()=>{s[key]=n.value;save()});
 }
 el("tc-search-mutation")?.addEventListener("change",e=>{s.searchMutation=e.target.value;save()});
 el("tc-redgem")?.addEventListener("change",e=>{s.gemPveBonus=Math.max(0,Math.min(100,Number(e.target.value)||0));save()});
 el("tc-ownedonly")?.addEventListener("change",e=>{s.ownedOnly=e.target.checked;save()});
el("tc-pool-add")?.addEventListener("click",()=>{
 const value=el("tc-pool-input")?.value.trim();
 if(!cardByName(value)){s.error="Unknown card name";rerender();return;}
 s.addedCards=[...new Set([...(s.addedCards||[]),value])];s.poolQuery="";s.result=null;save();rerender();
});
root.querySelectorAll("[data-tc-remove]").forEach(b=>b.addEventListener("click",()=>{s.addedCards=(s.addedCards||[]).filter(x=>x!==b.dataset.tcRemove);s.result=null;save();rerender()}));
root.querySelectorAll("[data-tc-pool]").forEach(b=>b.addEventListener("click",()=>{
 const value=b.dataset.tcPool,excluded=new Set(parsing(s.excludedPool));
 excluded.has(value)?excluded.delete(value):excluded.add(value);
 s.excludedPool=[...excluded].join(",");s.result=null;save();rerender();
}));
 el("tc-cheese")?.addEventListener("click",()=>run("new-tower-cheese",rerender));
 el("tc-simulate")?.addEventListener("click",()=>run("new-tower-sim",rerender));
 root.querySelectorAll("[data-use]").forEach(n=>n.addEventListener("click",()=>{const best=s.result?.recommendations?.[Number(n.dataset.use)];if(!best)return;s.team=best.loadout.cards.map(c=>c.cardName);s.borders=best.loadout.cards.map(c=>(c.borders||[])[0]||"");s.mutations=best.loadout.cards.map(c=>c.mutationWeather||"");s.abilityAura=best.loadout.abilityAura?.auraName||"";s.result=null;save();rerender();run("new-tower-sim",rerender)}));
 window.CRXCheeseCardSearch?.attach(root,cardList,thumbs);
 window.CRXTowerPackPlanner?.bind(root,cfg.order);
}
function run(kind,rerender){
 if(s.running)return;
 const enemiesNow=effectiveEnemies().names;
 const allCards=new Set(cardList.map(c=>c.name));
 if(cardList.length&&enemiesNow.some(n=>!allCards.has(n))){s.error="Unknown enemy card name";rerender();return}
 const {attack,hp,floor,t}=stats(),id=++requestId,simSeed=1+Math.floor(Math.random()*2147483646);
 const isBanned=banned(),owned=parsing(s.ownedPool),excluded=parsing(s.excludedPool);
 if(s.ownedOnly&&owned.length<4){s.error="Add at least 4 owned cards, or disable owned-only search";rerender();return}
 if(kind==="new-tower-sim"){
  for(const n of s.team){if(!n||cardList.length&&!allCards.has(n)){s.error="Select four valid cards";rerender();return}}
  if(s.team.some(x=>isBanned.includes(x))){s.error="Deck includes a banned card";rerender();return}
 }
 if(!worker){try{worker=new Worker("./browser/tower-worker.js?v="+(window.__CRX_SITE_VERSION||"2026"));}catch(e){s.error="Simulation worker unavailable";rerender();return}}
 s.running=true;s.error="";s.result=null;rerender();
 worker.onmessage=event=>{
  const d=event.data||{};if(d.id!==id)return;
  if(d.kind==="new-tower-progress"){
   const span=document.querySelector("#tc-progress");
   if(span)span.textContent=d.step?.phase?`${d.step.phase} ${d.step.completed||0}/${d.step.total||0}`:`${d.done||0}/${d.total||0}`;
   return;
  }
  s.running=false;if(d.ok)s.result={...d.result,simSeed,computeMs:d.elapsedMs||0};else s.error=d.error||"Simulation failed";rerender();if(d.ok)revealCheeseResults(".tc-results,.tc-result-simple");
 };
 worker.onerror=err=>{s.running=false;s.error="Worker error: "+(err.message||"Unknown");rerender()};
 const msg={kind,id,enemyNames:enemiesNow,floor,attack,hp,mode:{...t,searchMutation:s.searchMutation,hardcore:!!s.hardcore,disabledCards:hardcoreDisabled(),disabledAuras:s.hardcore?(cfg.hardcoreDisabledAuras||[]):[]},gemPveBonus:s.gemPveBonus,banned:isBanned,excludedCards:excluded,addedCards:s.ownedOnly?owned:[...new Set([...(s.addedCards||[]),...owned])],hasEndTimes:!s.hardcore,hasGuardianAngel:true,seed:simSeed,aiEffort:s.aiEffort||"quick",runs:Math.max(10,Number(s.runs)||200)};
 if(s.ownedOnly){msg.ownedCards=owned;msg.onlyOwned=true}
 const referenceLoadout={cards:s.team.map((name,i)=>({cardName:name,borders:s.borders[i]?[s.borders[i]]:[],mutationWeather:s.mutations[i]||(t.mutatedOnly?s.searchMutation:null)})),statAura:null,abilityAura:t.noAuras||!s.abilityAura||s.hardcore&&(cfg.hardcoreDisabledAuras||[]).includes(s.abilityAura)?null:{auraName:s.abilityAura,border:null}};
 msg.searchGear={borders:[...s.borders],mutations:[...s.mutations],aura:s.abilityAura};
 msg.referenceLoadout=referenceLoadout;
 if(kind==="new-tower-sim")msg.loadout=referenceLoadout;
 worker.postMessage(msg);
}
async function loadCards(){
 cardsLoading=true;
 try{const version=window.__CRX_SITE_VERSION||"2026";const [lists,t]=await Promise.all([Promise.all(Array.from({length:7},(_,i)=>fetch(`./src/data/cards-${i+1}.json?v=${version}`).then(r=>r.json()))),fetch(`./src/data/thumbnails.json?v=${version}`).then(r=>r.json())]);cardList=lists.flat();thumbs=t;cardsLoading=false;window.dispatchEvent(new CustomEvent("crx-tower-cards-loaded"))}catch(e){cardsLoading=false;console.warn("Tower cards unavailable",e)}
}
window.CRXNewTowerCheese={render,bind,getState:()=>s,stats,enemies};
})();