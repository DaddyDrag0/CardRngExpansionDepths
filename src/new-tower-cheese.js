(function NewTowerCheese(){
"use strict";
const cfg=window.CRXTowerConfig2026;
if(!cfg)return;
const STORE="crx-2026-tower-cheese-v1";
const defaults={tower:"Normal",floor:105,seed:117,runs:200,team:["Robin Hood","Noveau Riche","Pandora","Kuchisake-onna"],borders:["","","",""],mutations:["","","",""],abilityAura:"Guardian Angel",gemPveBonus:0,ownedOnly:false,ownedPool:"",excludedPool:"",customEnemy:["","","",""],result:null,error:"",running:false};
let s={...defaults};
try{s={...s,...JSON.parse(localStorage.getItem(STORE)||"{}"),running:false,result:null,error:""};}catch(_){}
let cardList=[],worker=null,requestId=0,cardsLoading=false;
const esc=x=>String(x??"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[a]));
const nice=x=>new Intl.NumberFormat("en-US",{notation:"compact",maximumFractionDigits:2}).format(x);
const opts=(arr,v)=>arr.map(x=>`<option value="${esc(x)}" ${x===v?"selected":""}>${esc(x)}</option>`).join("");
const parsing=x=>String(x||"").split(/[,;\n]/).map(x=>x.trim()).filter(Boolean);
const banned=()=>s.tower==="Impossible"||["Mutation","Auraloss","FrozenGlaze","Oblivion","Eruption"].includes(s.tower)?cfg.bannedCards:[];
function stats(){
 const t=cfg.towers[s.tower],floor=Math.max(1,Math.min(105,Math.floor(Number(s.floor)||1)));
 s.floor=floor;
 function val([start,end]){if(floor===1)return start;if(floor===105)return end;return Math.max(1,Math.floor(start*Math.pow((end/1.25)/start,(floor-1)/104)*(floor%5===0?1.25:1)))}
 return {attack:val(t.damage),hp:val(t.hp),floor,t};
}
function generatedPool(){
 return cardList.filter(c=>c.rarity>0&&!c.unobtainable&&!c.expires&&!c.boss&&!c.weather&&!c.collection&&!["Era2","Christmas","Halloween","Halloween2","Halloween3"].includes(c.pack))
  .sort((a,b)=>a.rarity-b.rarity||a.name.localeCompare(b.name)).map(c=>c.name);
}
function enemies(){
 const {floor,t}=stats(),boss=cfg.bossTeams[t.set]?.[floor];
 if(boss)return {names:boss.split("|"),exact:true};
 const all=generatedPool();
 if(!all.length)return {names:["Archer","Good Boy","Wizard","Forest Spirit"],exact:false};
 const size=Math.max(8,Math.floor(all.length*.25)),start=Math.max(0,Math.min(all.length-size,Math.floor((floor-1)/104*(all.length-size))));
 const pool=all.slice(start,start+size);
 let v=0;for(let i=0;i<s.tower.length;i++)v=(v*31+s.tower.charCodeAt(i))%1000003;
 let seed=(v*1000+floor)>>>0;
 const rand=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296};
 const result=[];for(let i=0;i<4&&pool.length;i++)result.push(pool.splice(Math.floor(rand()*pool.length),1)[0]);
 return {names:result,exact:false};
}
function effectiveEnemies(){
 const generated=enemies();
 return {names:generated.names.map((x,i)=>s.customEnemy?.[i]?.trim()||x),exact:generated.exact&&!s.customEnemy?.some(x=>x)};
}
function save(){try{const {result,error,running,...safe}=s;localStorage.setItem(STORE,JSON.stringify(safe))}catch(_){}}
function rowLabel(x){return `<span>${x}</span>`}
function selectCards() {
 const cards=s.team.map((name,i)=>`<div class="tc-member"><label>${rowLabel(`Card ${i+1}`)}<input list="tc-cards" data-team="${i}" value="${esc(name)}" placeholder="Card name"></label><label>${rowLabel("Border")}<select data-border="${i}">${opts(["","Platinum","Crystal","Ruby","Galaxy"],s.borders[i]||"")}</select></label><label>${rowLabel("Mutation")}<select data-mutation="${i}">${opts(["","Storm","Snow","Aurora","Shroud","Meteor Shower","Time Storm","Eclipse","Virus","Blood Rain","Armageddon","Manga","Pumpkin Moon","The Great Deluge","Reality Fracture","Dreamfall"],s.mutations[i]||"")}</select></label></div>`).join("");
 return `<datalist id="tc-cards">${cardList.map(c=>`<option value="${esc(c.name)}"></option>`).join("")}</datalist><div class="tc-team">${cards}</div>`;
}
function render(){
 if(!cardList.length&&!cardsLoading)loadCards();
 const {attack,hp,floor,t}=stats(),e=effectiveEnemies(),blocked=banned();
 const rules=[t.mutatedOnly?"Mutated cards only":null,t.noAuras?"No Auras":null,t.freezeChance?"25% freeze":null,t.noHealing?"No healing":null,t.stun?"Stun / burn":null].filter(Boolean).join(" · ");
 const result=s.result;
 let output="";
 if(result?.recommendations){
   const recommendations=result.recommendations.slice(0,5);
   output=`<div class="tc-results"><div class="tc-results-title">Cheese results</div>${recommendations.length?recommendations.map((v,i)=>`<div class="tc-recommend"><strong>${i+1}. ${(v.winRate*100).toFixed(1)}%</strong><span>${v.loadout.cards.map(c=>esc(c.cardName)).join(" · ")}</span><small>${esc(v.loadout.abilityAura?.auraName||"No ability Aura")} · ${nice(v.averageTurns||0)} turns ${v.trusted===false?"· Model limits":""}</small><button data-use="${i}" type="button">Use team</button></div>`).join(""):`<p>No winning decks in the selected pool.</p>`}</div>`;
 }else if(result?.wins!==undefined)output=`<div class="tc-result-simple"><strong>${(result.winRate*100).toFixed(1)}% wins</strong><span>${result.wins}/${result.runs} battles · ${nice(result.averageTurns)} avg turns ${result.trusted===false?"· Some ability interactions unsupported":""}</span></div>`;
 return `<div class="tc">
 <div class="tc-bar"><label>${rowLabel("Tower")}<select id="tc-tower">${opts(cfg.order,s.tower)}</select></label><label>${rowLabel("Floor")}<input id="tc-floor" type="number" min="1" max="105" value="${floor}"></label><label>${rowLabel("Simulation runs")}<select id="tc-runs">${opts(["100","200","500","1000"],String(s.runs))}</select></label></div>
 <div class="tc-stats"><strong>${nice(hp)} HP</strong><strong>${nice(attack)} ATK</strong><span>${t.set} boss teams · ${t.border||"No"} border</span></div>
 ${rules?`<div class="tc-rules">${esc(rules)}</div>`:""}${blocked.length?`<div class="tc-bans">Banned: ${blocked.map(esc).join(", ")}</div>`:""}
 <div class="tc-label"><h3>Enemy team</h3><small>${e.exact?"Fixed lineup from game data":"Editable preview for random floor"}</small></div>
 <div class="tc-enemies">${e.names.map((name,i)=>`<label>${rowLabel(`#${i+1}`)}<input list="tc-cards" data-enemy="${i}" value="${esc(name)}" aria-label="Enemy ${i+1}"></label>`).join("")}</div>
 <div class="tc-label"><h3>Your deck</h3><small>Select cards or run Cheese search</small></div>
 ${selectCards()}
 <details class="tc-extra"><summary>Search options</summary><div class="tc-extra-grid">
 <label>${rowLabel("Ability Aura (manual)")}<input id="tc-aura" value="${esc(s.abilityAura)}" placeholder="None"></label>
 <label>${rowLabel("Red Gem PvE bonus %")}<input id="tc-redgem" type="number" min="0" max="100" step="2.5" value="${esc(s.gemPveBonus)}"></label>
 <label>${rowLabel("Owned cards (comma separated)")}<textarea id="tc-owned" rows="2" placeholder="Card 1, Card 2, Card 3...">${esc(s.ownedPool)}</textarea></label>
 <label>${rowLabel("Excluded cards (comma separated)")}<textarea id="tc-excluded" rows="2">${esc(s.excludedPool)}</textarea></label>
 <label class="tc-check"><input type="checkbox" id="tc-ownedonly" ${s.ownedOnly?"checked":""}> Search only owned cards</label>
 </div></details>
 <div class="tc-actions"><button id="tc-simulate" ${s.running?"disabled":""} type="button">Simulate deck</button><button id="tc-cheese" ${s.running?"disabled":""} type="button">Find Cheese</button><span id="tc-progress">${s.running?"Running…":s.error?esc(s.error):""}</span></div>
 ${output}
 <div class="tc-disclaimer">${!e.exact?"Non-boss enemy combinations use an estimated preview seed. Match your in-game enemies for accurate matchup selection. ":""}${t.freezeChance||t.noHealing||t.stun?"Special status effects are not fully simulated yet. ":""}Combat results are estimates.</div>
 </div>`;
}
function bind(root,rerender){
 const el=id=>root.querySelector("#"+id);
 function change(id,key,convert=x=>x){const n=el(id);n?.addEventListener("change",()=>{s[key]=convert(n.value);s.result=null;s.error="";save();rerender()})}
 change("tc-tower","tower",x=>{s.customEnemy=["","","",""];return x});
 change("tc-floor","floor",x=>{s.customEnemy=["","","",""];return Math.max(1,Math.min(105,Number(x)||1))});
 change("tc-runs","runs",Number);
 for(const [selName,key] of [["data-team","team"],["data-border","borders"],["data-mutation","mutations"],["data-enemy","customEnemy"]]){
  root.querySelectorAll(`[${selName}]`).forEach(n=>n.addEventListener("change",()=>{s[key][Number(n.getAttribute(selName))]=n.value;s.result=null;save();rerender()}));
 }
 for(const [id,key] of [["tc-aura","abilityAura"],["tc-owned","ownedPool"],["tc-excluded","excludedPool"]]){
  const n=el(id);n?.addEventListener("change",()=>{s[key]=n.value;save()});
 }
 el("tc-redgem")?.addEventListener("change",e=>{s.gemPveBonus=Math.max(0,Math.min(100,Number(e.target.value)||0));save()});
 el("tc-ownedonly")?.addEventListener("change",e=>{s.ownedOnly=e.target.checked;save()});
 el("tc-cheese")?.addEventListener("click",()=>run("new-tower-cheese",rerender));
 el("tc-simulate")?.addEventListener("click",()=>run("new-tower-sim",rerender));
 root.querySelectorAll("[data-use]").forEach(n=>n.addEventListener("click",()=>{const best=s.result?.recommendations?.[Number(n.dataset.use)];if(!best)return;s.team=best.loadout.cards.map(c=>c.cardName);s.borders=best.loadout.cards.map(c=>(c.borders||[])[0]||"");s.mutations=best.loadout.cards.map(c=>c.mutationWeather||"");s.abilityAura=best.loadout.abilityAura?.auraName||"";s.result=null;save();rerender()}));
}
function run(kind,rerender){
 if(s.running)return;
 const enemiesNow=effectiveEnemies().names;
 const allCards=new Set(cardList.map(c=>c.name));
 if(cardList.length&&enemiesNow.some(n=>!allCards.has(n))){s.error="Unknown enemy card name";rerender();return}
 const {attack,hp,floor,t}=stats(),id=++requestId;
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
  s.running=false;if(d.ok)s.result=d.result;else s.error=d.error||"Simulation failed";rerender();
 };
 worker.onerror=err=>{s.running=false;s.error="Worker error: "+(err.message||"Unknown");rerender()};
 const msg={kind,id,enemyNames:enemiesNow,floor,attack,hp,mode:t,gemPveBonus:s.gemPveBonus,banned:isBanned,excludedCards:excluded,addedCards:s.ownedOnly?owned:owned,hasEndTimes:true,hasGuardianAngel:true,seed:Math.max(1,Number(s.seed)||1),runs:Math.max(10,Number(s.runs)||200)};
 if(s.ownedOnly){msg.ownedCards=owned;msg.onlyOwned=true}
 if(kind==="new-tower-sim"){
   msg.loadout={cards:s.team.map((name,i)=>({cardName:name,borders:s.borders[i]?[s.borders[i]]:[],mutationWeather:s.mutations[i]||(t.mutatedOnly?"Dreamfall":null)})),statAura:null,abilityAura:t.noAuras||!s.abilityAura?null:{auraName:s.abilityAura,border:null}};
 }
 worker.postMessage(msg);
}
async function loadCards(){
 cardsLoading=true;
 try{const a=await Promise.all(Array.from({length:7},(_,i)=>fetch(`./src/data/cards-${i+1}.json?v=${window.__CRX_SITE_VERSION||"2026"}`).then(r=>r.json())));cardList=a.flat();window.dispatchEvent(new CustomEvent("crx-tower-cards-loaded"))}catch(e){cardsLoading=false;console.warn("Tower cards unavailable",e)}
}
window.CRXNewTowerCheese={render,bind,getState:()=>s,stats,enemies};
})();