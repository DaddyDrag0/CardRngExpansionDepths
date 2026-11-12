(function TrialCheese2026(){
"use strict";
const configs=window.CRXTrialData2026;
if(!configs)return;
const KEY="crx-trial-cheese-2026";
let s={mode:"Daily",floor:45,runs:200,team:["Robin Hood","Pandora","Noveau Riche","Kuchisake-onna"],borders:["","","",""],mutations:["","","",""],enemies:["","","",""],aura:"End Times",owned:"",onlyOwned:false,extraCards:"",excludedCards:"",gem:0,result:null,error:"",running:false};
try{s={...s,...JSON.parse(localStorage.getItem(KEY)||"{}"),result:null,error:"",running:false}}catch(_){}
let cards=[],thumbs={},loading=false,worker=null,id=0;
const esc=x=>String(x??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[t]));
const fmt=x=>new Intl.NumberFormat("en-US",{notation:"compact",maximumFractionDigits:2}).format(x);
const parse=x=>String(x||"").split(/[,;\n]/).map(x=>x.trim()).filter(Boolean);
const options=(arr,val)=>arr.map(x=>`<option value="${esc(x)}" ${x===val?"selected":""}>${esc(x)}</option>`).join("");
const card=x=>cards.find(c=>c.name===x);
const portrait=name=>{const c=card(name),url=thumbs[String(c?.imageAssetId)];return `<div class="cc-portrait">${url?`<img loading="lazy" src="${esc(url)}" alt="">`:`<span>${esc((name||"?").charAt(0))}</span>`}</div>`};
const def=()=>configs[s.mode];
function getFloor(){
 const f=Math.max(1,Math.min(def().max,Math.floor(Number(s.floor)||1)));s.floor=f;
 const fixed=def().teams[f];
 const boss=s.mode==="Monthly"?(f===200?2.5:[50,100,150].includes(f)?1.6:f%10===0?1.25:1):1;
 const base=(def().base+f*f*f*def().cube)*boss;
 const pow=Math.ceil(Math.sqrt(base/2)*2);
 const names=fixed?fixed.cards:s.enemies;
 return {f,fixed,enemyNames:names,power:pow,hp:pow,attack:Math.ceil(pow/2)};
}
const save=()=>{try{const {result,error,running,...x}=s;localStorage.setItem(KEY,JSON.stringify(x))}catch(_){}};
function render(){
 if(!cards.length&&!loading)load();
 const d=def(),f=getFloor(),names=f.enemyNames;
 const team=s.team.map((n,i)=>`<div class="cc-manual-slot">${portrait(n)}<div class="cc-manual-fields"><label>Card ${i+1}<input data-tr-team="${i}" list="tr-cards" value="${esc(n)}"></label><div class="cc-manual-sub"><label>Border<select data-tr-border="${i}">${options(["","Platinum","Crystal","Ruby","Galaxy"],s.borders[i])}</select></label><label>Mutation<select data-tr-mutation="${i}">${options(["","Storm","Snow","Aurora","Shroud","Meteor Shower","Time Storm","Eclipse","Virus","Blood Rain","Armageddon","Manga","Pumpkin Moon","The Great Deluge","Reality Fracture","Dreamfall"],s.mutations[i])}</select></label></div></div></div>`).join("");
 let result="";
 if(s.result?.recommendations)result=`<div class="cc-results"><h3>Recommended decks</h3>${s.result.recommendations.slice(0,6).map((x,i)=>`<div class="cc-rec"><strong>${(x.winRate*100).toFixed(2)}%</strong><div class="cc-rec-line">${x.loadout.cards.map(c=>`<span>${portrait(c.cardName)}<b>${esc(c.cardName)}</b></span>`).join("")}</div><small>${esc(x.loadout.abilityAura?.auraName||"No Aura")}${x.trusted===false?" · Unverified abilities":""}</small><button type="button" data-tr-use="${i}">Use deck</button></div>`).join("")}</div>`;
 else if(s.result?.wins!==undefined)result=`<div class="cc-results cc-single"><h3>Simulation</h3><strong>${(s.result.winRate*100).toFixed(2)}%</strong><small>${s.result.wins}/${s.result.runs} wins · ${fmt(s.result.averageTurns)} turns${s.result.trusted===false?" · Unverified abilities":""}</small></div>`;
 return `<div class="cc-page"><div class="cc-page-top"><h2>Trial Cheese</h2><small>Daily · Weekly · Monthly</small></div>
 <div class="cc-controls"><label>Trial<select id="tr-mode">${options(["Daily","Weekly","Monthly"],s.mode)}</select></label><label>Floor<input id="tr-floor" type="number" min="1" max="${d.max}" value="${f.f}"></label><label>Simulation runs<select id="tr-runs">${options(["100","200","500","1000"],String(s.runs))}</select></label></div>
 <div class="cc-stats"><b>${fmt(f.hp)} HP</b><b>${fmt(f.attack)} ATK</b><span>${f.fixed?"Fixed boss floor":"Random enemy floor"}</span><span>${(d.purple*100).toFixed(0)}% Purple Gem on completion</span>${f.fixed?.aura?`<span>Enemy Aura: ${esc(f.fixed.aura)}</span>`:""}</div>
 <div class="cc-heading"><h3>Enemy lineup</h3><small>${f.fixed?"Auto-loaded from game file":"Enter the four enemies shown in game"}</small></div>
 <div class="cc-enemies">${names.map((n,i)=>`<div class="cc-enemy">${portrait(n)}<div><label>#${i+1}<input ${f.fixed?"readonly":""} list="tr-cards" data-tr-enemy="${i}" value="${esc(n||"")}" placeholder="Enemy card"></label>${card(n)?`<span>${esc(card(n).ability||"")}</span>`:""}</div></div>`).join("")}</div>
 <div class="cc-heading"><h3>Your deck</h3></div><div class="cc-manual-grid">${team}</div>
 <details class="cc-options"><summary>Search options</summary><div class="cc-pool"><label>Ability Aura<input id="tr-aura" value="${esc(s.aura)}"></label><label>Red Gem PvE bonus %<input id="tr-gem" type="number" min="0" max="100" value="${Number(s.gem)||0}"></label><label>Additional search cards<textarea id="tr-extra" rows="2" placeholder="Card 1, Card 2">${esc(s.extraCards)}</textarea></label><label>Exclude cards<textarea id="tr-excluded" rows="2" placeholder="Card 1, Card 2">${esc(s.excludedCards)}</textarea></label><label>Cards owned<textarea id="tr-owned" rows="2" placeholder="Optional: only cards you own">${esc(s.owned)}</textarea></label><label class="cc-ownership"><input type="checkbox" id="tr-ownedonly" ${s.onlyOwned?"checked":""}> Search only owned cards</label></div></details>
 <datalist id="tr-cards">${cards.map(c=>`<option value="${esc(c.name)}"></option>`).join("")}</datalist>
 <div class="cc-actions"><button id="tr-search" type="button" ${s.running?"disabled":""}>Find Cheese</button><button id="tr-sim" type="button" ${s.running?"disabled":""}>Simulate deck</button><span id="tr-progress">${s.running?"Running…":esc(s.error)}</span></div>
 ${result}<p class="cc-foot">Enemy stat model uses the exported trial power formula. Card-specific HP and unverified abilities may change actual results.</p></div>`;
}
function bind(root,rerender){
 const el=id=>root.querySelector("#"+id);
 const update=(id,key,coerce=x=>x)=>el(id)?.addEventListener("change",e=>{s[key]=coerce(e.target.type==="checkbox"?e.target.checked:e.target.value);s.result=null;save();rerender()});
 update("tr-mode","mode",x=>{s.floor=configs[x].max;s.enemies=["","","",""];return x});
 update("tr-floor","floor",Number);update("tr-runs","runs",Number);
 update("tr-aura","aura");update("tr-gem","gem",Number);update("tr-extra","extraCards");update("tr-excluded","excludedCards");update("tr-owned","owned");update("tr-ownedonly","onlyOwned");
 for(const [name,key] of [["data-tr-team","team"],["data-tr-border","borders"],["data-tr-mutation","mutations"],["data-tr-enemy","enemies"]])
  root.querySelectorAll(`[${name}]`).forEach(x=>x.addEventListener("change",()=>{s[key][Number(x.getAttribute(name))]=x.value;s.result=null;save();rerender()}));
 el("tr-search")?.addEventListener("click",()=>run("new-tower-cheese",rerender));
 el("tr-sim")?.addEventListener("click",()=>run("new-tower-sim",rerender));
 root.querySelectorAll("[data-tr-use]").forEach(btn=>btn.addEventListener("click",()=>{const r=s.result?.recommendations?.[Number(btn.dataset.trUse)];if(!r)return;s.team=r.loadout.cards.map(x=>x.cardName);s.borders=r.loadout.cards.map(x=>x.borders?.[0]||"");s.mutations=r.loadout.cards.map(x=>x.mutationWeather||"");s.aura=r.loadout.abilityAura?.auraName||"";s.result=null;save();rerender()}));
}
function run(kind,rerender){
 const f=getFloor(),owned=parse(s.owned);
 if(f.enemyNames.length!==4||f.enemyNames.some(x=>!card(x))){s.error="Enter four valid enemies to simulate this floor";rerender();return;}
 if(s.onlyOwned&&owned.length<4){s.error="Enter at least four owned cards";rerender();return;}
 if(kind==="new-tower-sim"&&s.team.some(x=>!card(x))){s.error="Select four valid cards";rerender();return;}
 if(!worker)worker=new Worker("./browser/tower-worker.js?v="+(window.__CRX_SITE_VERSION||"2026"));
 const id=Date.now()+Math.random(),mode={enemyAura:f.fixed?.aura||null,enemyHpMult:true};
 s.result=null;s.running=true;s.error="";rerender();
 worker.onmessage=e=>{
  const r=e.data||{};if(r.id!==id)return;
  if(r.kind==="new-tower-progress"){const p=document.querySelector("#tr-progress");if(p)p.textContent=r.step?.phase?`${r.step.phase} ${r.step.completed||0}/${r.step.total||0}`:`${r.done||0}/${r.total||0}`;return;}
  s.running=false;r.ok?s.result=r.result:s.error=r.error||"Simulation failed";rerender();
 };
 worker.onerror=e=>{s.running=false;s.error=e.message||"Worker failed";rerender()};
 const payload={kind,id,enemyNames:f.enemyNames,attack:f.attack,hp:f.hp,floor:f.f,mode,gemPveBonus:s.gem,seed:23,runs:s.runs,excludedCards:parse(s.excludedCards),addedCards:[...new Set([...parse(s.extraCards),...(s.onlyOwned?owned:[])])],onlyOwned:s.onlyOwned,ownedCards:owned,hasEndTimes:true,hasGuardianAngel:true};
 if(kind==="new-tower-sim")payload.loadout={cards:s.team.map((name,i)=>({cardName:name,borders:s.borders[i]?[s.borders[i]]:[],mutationWeather:s.mutations[i]||null})),statAura:null,abilityAura:s.aura?{auraName:s.aura,border:null}:null};
 worker.postMessage(payload);
}
async function load(){
 loading=true;try{const v=window.__CRX_SITE_VERSION||"2026";const [lst,t]=await Promise.all([Promise.all(Array.from({length:7},(_,i)=>fetch(`./src/data/cards-${i+1}.json?v=${v}`).then(x=>x.json()))),fetch(`./src/data/thumbnails.json?v=${v}`).then(x=>x.json())]);cards=lst.flat();thumbs=t;loading=false;window.dispatchEvent(new CustomEvent("crx-trial-data-ready"))}catch(e){loading=false;console.warn("Trial card load failed",e)}
}
window.CRXTrialCheese={render,bind};
})();