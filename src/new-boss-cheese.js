(function BossCheese2026(){
"use strict";
const source=window.CRXBossData2026;
if(!source)return;
const SAVE="crx-boss-cheese-2026-v1";
const defaults={bossId:"Sin_Chronus",difficulty:1,runs:200,team:["Robin Hood","Pandora","Noveau Riche","Kuchisake-onna"],borders:["","","",""],mutations:["","","",""],abilityAura:"End Times",excluded:[],added:[],poolQuery:"",ownedOnly:false,owned:"",excludedExtra:"",redGem:0,result:null,error:"",running:false};
let state={...defaults};
try{state={...state,...JSON.parse(localStorage.getItem(SAVE)||"{}"),running:false,result:null,error:""};}catch(_){}
let cards=[],thumbs={},worker=null,loading=false,seq=0,rerenderFn=null;
const esc=x=>String(x??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[t]));
const fmt=x=>new Intl.NumberFormat("en-US",{notation:"compact",maximumFractionDigits:2}).format(x);
const parse=x=>String(x||"").split(/[,;\n]/).map(x=>x.trim()).filter(Boolean);
const card=x=>cards.find(c=>c.name===x);
const current=()=>source.bosses.find(x=>x.id===state.bossId)||source.bosses[0];
const mode=()=>current().difficulty[Math.max(0,Math.min(4,Number(state.difficulty)-1))];
const isRapture=x=>card(x)?.weather==="Rapture";
const save=()=>{try{const {result,error,running,...rest}=state;localStorage.setItem(SAVE,JSON.stringify(rest))}catch(_){}};
const options=(a,v)=>a.map(x=>`<option value="${esc(x)}" ${String(v)===String(x)?"selected":""}>${esc(x)}</option>`).join("");
const portrait=(name,size="small")=>{const c=card(name),url=c&&thumbs[String(c.imageAssetId)];return `<div class="cc-portrait ${size}">${url?`<img loading="lazy" src="${esc(url)}" alt="">`:`<span>${esc(String(name||"?").slice(0,1))}</span>`}</div>`};
function getPool(){
 return ["Judgment Day","Robin Hood","Parallax","Piccolo","Pandora","Kuchisake-onna","Fate Seamstress","Kira","Hell's Army","Noveau Riche"];
}
function groupOpts(){
const groups=["Sins","Virtues","Mother","Kaelis"];
return `<select id="bc-group">${options(groups,current().group)}</select>`;
}
function deckInputs(){
 return `<div class="cc-manual-grid">${state.team.map((name,i)=>`<div class="cc-manual-slot">${portrait(name)}<div class="cc-manual-fields"><label>Card ${i+1}<input list="bc-cardnames" data-bc-card="${i}" value="${esc(name)}"></label><div class="cc-manual-sub"><label>Border<select data-bc-border="${i}">${options(["","Platinum","Crystal","Ruby","Galaxy"],state.borders[i]||"")}</select></label><label>Mutation<select data-bc-mutation="${i}">${options(["","Storm","Snow","Aurora","Shroud","Meteor Shower","Time Storm","Eclipse","Virus","Blood Rain","Armageddon","Manga","Pumpkin Moon","The Great Deluge","Reality Fracture","Dreamfall"],state.mutations[i]||"")}</select></label></div></div></div>`).join("")}</div>`;
}
function results(){
 const r=state.result;if(!r)return"";
 if(Array.isArray(r.recommendations)){
 return `<div class="cc-results"><h3>Recommended decks</h3>${r.recommendations.slice(0,6).map((x,i)=>`<div class="cc-rec"><strong>${(x.winRate*100).toFixed(2)}%</strong><div class="cc-rec-line">${x.loadout.cards.map(c=>`<span>${portrait(c.cardName)}<b>${esc(c.cardName)}</b></span>`).join("")}</div><small>${esc(x.loadout.abilityAura?.auraName||"No Aura")}${x.trusted===false?" · Unverified abilities":""}</small><button type="button" data-bc-load="${i}">Use deck</button></div>`).join("")}</div>`;
 }
 return `<div class="cc-results cc-single"><h3>Simulation</h3><strong>${(r.winRate*100).toFixed(2)}% win rate</strong><small>${r.wins}/${r.runs} victories · ${fmt(r.averageTurns)} turns${r.trusted===false?" · Unverified abilities":""}</small></div>`;
}
function render(){
 if(!cards.length&&!loading)load();
 const boss=current(),level=mode();
 const groups=source.bosses.filter(x=>x.group===boss.group),bans=source.bannedCards||[];
 const raptures=state.team.filter(isRapture).length;
 return `<div class="cc-page"><div class="cc-page-top"><h2>Boss Cheese</h2><small>16 bosses · 5 difficulties each</small></div>
 <div class="cc-controls"><label>Group${groupOpts()}</label><label>Boss<select id="bc-boss">${groups.map(x=>`<option value="${esc(x.id)}" ${x.id===boss.id?"selected":""}>${esc(x.name)}</option>`).join("")}</select></label><label>Difficulty<select id="bc-difficulty">${source.difficultyNames.map((x,i)=>`<option value="${i+1}" ${Number(state.difficulty)===i+1?"selected":""}>${esc(x)}</option>`).join("")}</select></label><label>Runs<select id="bc-runs">${options(["100","200","500","1000"],String(state.runs))}</select></label></div>
 <div class="cc-stats"><b>${fmt(level.hp)} HP</b><b>${fmt(level.attack)} ATK</b><span>Max 1 Rapture card</span>${level.enemyAura?`<span>Enemy Aura: ${esc(level.enemyAura)} (Galaxy)</span>`:""}</div>
 <div class="cc-heading"><h3>Enemy lineup</h3><small>From game configuration</small></div>
 <div class="cc-enemies">${level.team.map((name,i)=>`<div class="cc-enemy">${portrait(name,"large")}<div><small>#${i+1}</small><b>${esc(name)}</b><span>${esc(card(name)?.ability||"")}</span></div></div>`).join("")}</div>
 <div class="cc-heading"><h3>Your deck</h3><small>${raptures}/1 Rapture selected</small></div>
 ${deckInputs()}
 <details class="cc-options"><summary>Search pool & options</summary><div class="cc-pool"><p>Click cards you don't own to exclude them.</p><div class="cc-pool-list">${getPool().map(x=>`<button type="button" class="${state.excluded.includes(x)?"off":""}" data-bc-toggle="${esc(x)}">${esc(x)}${state.excluded.includes(x)?" (off)":""}</button>`).join("")}</div><label>Add card to pool<input list="bc-cardnames" id="bc-poolinput" value="${esc(state.poolQuery)}" placeholder="Type a card name"></label><button type="button" id="bc-add">Add card</button><div class="cc-added">${state.added.map(x=>`<button type="button" data-bc-remove="${esc(x)}">${esc(x)} ×</button>`).join("")}</div><label>Other excluded cards<textarea id="bc-excluded" rows="2" placeholder="Name, Name">${esc(state.excludedExtra)}</textarea></label><label>Owned cards (optional)<textarea id="bc-owned" rows="2" placeholder="Enter your owned cards">${esc(state.owned)}</textarea></label><label class="cc-ownership"><input id="bc-ownedonly" type="checkbox" ${state.ownedOnly?"checked":""}> Search only owned cards</label><label>Ability Aura<input id="bc-aura" value="${esc(state.abilityAura)}"></label><label>Red Gem PvE bonus %<input id="bc-redgem" type="number" min="0" max="100" value="${esc(state.redGem)}"></label></div></details>
 <datalist id="bc-cardnames">${cards.map(c=>`<option value="${esc(c.name)}"></option>`).join("")}</datalist>
 <div class="cc-actions"><button id="bc-search" type="button" ${state.running?"disabled":""}>Find Cheese</button><button id="bc-test" type="button" ${state.running?"disabled":""}>Simulate deck</button><span id="bc-progress">${state.running?"Running…":esc(state.error)}</span></div>
 ${results()}
 <p class="cc-foot">Boss deck limit is enforced. Win rates are simulated estimates.</p>
 </div>`;
}
function bind(root,rerender){
 rerenderFn=rerender;
 const evt=(id,action)=>root.querySelector("#"+id)?.addEventListener("change",e=>{action(e.target);state.result=null;save();rerender()});
 evt("bc-group",el=>{state.bossId=source.bosses.find(x=>x.group===el.value)?.id||state.bossId});
 evt("bc-boss",el=>state.bossId=el.value);
 evt("bc-difficulty",el=>state.difficulty=Number(el.value));
 evt("bc-runs",el=>state.runs=Number(el.value));
 for(const [sel,key] of [["data-bc-card","team"],["data-bc-border","borders"],["data-bc-mutation","mutations"]]){
 root.querySelectorAll(`[${sel}]`).forEach(el=>el.addEventListener("change",()=>{state[key][Number(el.getAttribute(sel))]=el.value;state.result=null;save();rerender()}));
 }
 root.querySelectorAll("[data-bc-toggle]").forEach(el=>el.addEventListener("click",()=>{const x=el.dataset.bcToggle;state.excluded=state.excluded.includes(x)?state.excluded.filter(n=>n!==x):[...state.excluded,x];save();rerender()}));
 root.querySelectorAll("[data-bc-remove]").forEach(el=>el.addEventListener("click",()=>{state.added=state.added.filter(n=>n!==el.dataset.bcRemove);save();rerender()}));
 root.querySelector("#bc-add")?.addEventListener("click",()=>{const x=root.querySelector("#bc-poolinput")?.value.trim();if(!card(x)){state.error="Unknown card name";rerender();return;}state.added=[...new Set([...state.added,x])];state.poolQuery="";save();rerender()});
 evt("bc-owned",el=>state.owned=el.value);
 evt("bc-excluded",el=>state.excludedExtra=el.value);
 evt("bc-ownedonly",el=>state.ownedOnly=el.checked);
 evt("bc-aura",el=>state.abilityAura=el.value);
 evt("bc-redgem",el=>state.redGem=Math.max(0,Math.min(100,Number(el.value)||0)));
 root.querySelector("#bc-search")?.addEventListener("click",()=>run("new-tower-cheese",rerender));
 root.querySelector("#bc-test")?.addEventListener("click",()=>run("new-tower-sim",rerender));
 root.querySelectorAll("[data-bc-load]").forEach(btn=>btn.addEventListener("click",()=>{
  const rec=state.result?.recommendations?.[Number(btn.dataset.bcLoad)];if(!rec)return;
  state.team=rec.loadout.cards.map(x=>x.cardName);state.borders=rec.loadout.cards.map(x=>x.borders?.[0]||"");
  state.mutations=rec.loadout.cards.map(x=>x.mutationWeather||"");state.abilityAura=rec.loadout.abilityAura?.auraName||"";
  state.result=null;save();rerender();
 }));
}
function run(kind,rerender){
 if(state.running)return;
 const level=mode(),banned=source.bannedCards||[],id=++seq;
 const owned=parse(state.owned);
 if(state.ownedOnly&&owned.length<4){state.error="Enter at least four owned cards";rerender();return;}
 if(kind==="new-tower-sim"){
   if(state.team.some(x=>!card(x))){state.error="Select four valid cards";rerender();return;}
   if(state.team.filter(isRapture).length>source.maxRaptureCards){state.error="Only one Rapture card allowed";rerender();return;}
   if(state.team.some(x=>banned.includes(x))){state.error="Deck contains a banned card";rerender();return;}
 }
 if(!worker)worker=new Worker("./browser/tower-worker.js?v="+(window.__CRX_SITE_VERSION||"2026"));
 state.running=true;state.error="";state.result=null;rerender();
 worker.onmessage=e=>{
  const msg=e.data||{};if(msg.id!==id)return;
  if(msg.kind==="new-tower-progress"){const el=document.getElementById("bc-progress");if(el)el.textContent=msg.step?.phase?`${msg.step.phase} ${msg.step.completed||0}/${msg.step.total||0}`:`${msg.done||0}/${msg.total||0}`;return;}
  state.running=false;if(msg.ok)state.result=msg.result;else state.error=msg.error||"Simulation failed";rerender();
 };
 worker.onerror=e=>{state.running=false;state.error=e.message||"Worker error";rerender()};
 const arg={kind,id,enemyNames:level.team,floor:Number(state.difficulty),attack:level.attack,hp:level.hp,mode:{maxRapture:source.maxRaptureCards,enemyAura:level.enemyAura,enemyAuraBorder:"Galaxy"},gemPveBonus:state.redGem,banned,excludedCards:[...new Set([...state.excluded,...parse(state.excludedExtra)])],addedCards:[...new Set([...state.added,...(state.ownedOnly?owned:[])])],hasGuardianAngel:true,hasEndTimes:true,seed:17,runs:state.runs,onlyOwned:state.ownedOnly,ownedCards:owned};
 if(kind==="new-tower-sim")arg.loadout={cards:state.team.map((name,i)=>({cardName:name,borders:state.borders[i]?[state.borders[i]]:[],mutationWeather:state.mutations[i]||null})),statAura:null,abilityAura:state.abilityAura?{auraName:state.abilityAura,border:null}:null};
 worker.postMessage(arg);
}
async function load(){
 loading=true;
 try{
  const version=window.__CRX_SITE_VERSION||"2026";
  const [lists,thumbnail]=await Promise.all([Promise.all(Array.from({length:7},(_,i)=>fetch(`./src/data/cards-${i+1}.json?v=${version}`).then(x=>x.json()))),fetch(`./src/data/thumbnails.json?v=${version}`).then(x=>x.json())]);
  cards=lists.flat();thumbs=thumbnail;loading=false;window.dispatchEvent(new CustomEvent("crx-boss-data-ready"));
 }catch(e){loading=false;console.warn("Boss cards loading failed",e)}
}
window.CRXBossCheese={render,bind};
})();