(function CardRngSimpleHub(){
"use strict";
const tabs=["depths","towers","trials","portals"];
const trial={
Daily:{floors:45,purple:.01,description:"Potions and first-clear rewards",packs:250000},
Weekly:{floors:80,purple:.05,description:"Double potion rewards",packs:2500000},
Monthly:{floors:200,purple:.20,description:"Materials at floors 50, 100 and 150",packs:null}
};
const portal={
F:{weight:35,red:0},E:{weight:25,red:0},D:{weight:17,red:0},C:{weight:10,red:.001},
B:{weight:7,red:.005},A:{weight:5,red:.01},S:{weight:1,red:.05}
};
let state={trial:"Daily",portal:"C",completed:50};
const esc=s=>String(s).replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]));
const fmt=n=>new Intl.NumberFormat("en-US",{maximumFractionDigits:2}).format(n);
const percent=x=>(x*100).toFixed(x<.01?2:1)+"%";
function options(values,value){return values.map(x=>`<option ${x===value?"selected":""}>${esc(x)}</option>`).join("")}
function trialPage(){
 const t=trial[state.trial];
 return `<div class="crx-simple"><div class="crx-title"><h2>Trials</h2></div>
 <div class="crx-filter"><label>Trial<select id="crx-trial">${options(Object.keys(trial),state.trial)}</select></label></div>
 <div class="crx-quick-stats"><div><small>Floors</small><strong>${fmt(t.floors)}</strong></div><div><small>Legendary Purple Gem</small><strong>${percent(t.purple)}</strong></div><div><small>Max listed pack reward</small><strong>${t.packs===null?"Milestones":fmt(t.packs)}</strong></div></div>
 <p class="crx-muted">${esc(t.description)} · Reset: ${state.trial==="Daily"?"Daily":state.trial==="Weekly"?"Monday":"First of month"}, 00:00 Stockholm time</p>
 </div>`;
}
function portalPage(){
 const p=portal[state.portal],n=Math.max(0,Math.floor(Number(state.completed)||0)),prob=1-Math.pow(1-p.red,n);
 return `<div class="crx-simple"><div class="crx-title"><h2>Portals</h2></div>
 <div class="crx-filter"><label>Rank<select id="crx-portal">${options(Object.keys(portal),state.portal)}</select></label><label>Completed portals<input type="number" min="0" max="100000" value="${n}" id="crx-completed"></label></div>
 <div class="crx-quick-stats"><div><small>Spawn chance</small><strong>${percent(p.weight/100)}</strong></div><div><small>Legendary Red Gem / clear</small><strong>${percent(p.red)}</strong></div><div><small>Expected gems</small><strong>${fmt(n*p.red)}</strong></div><div><small>Chance of ≥1</small><strong>${percent(prob)}</strong></div></div>
 <p class="crx-muted">25 floors · Spawns hourly · Available for 30 minutes${["C","B","A","S"].includes(state.portal)?" · 2 activity-restricted cards":""}</p>
 </div>`;
}
function ready(){
 const root=document.getElementById("root");if(!root)return;
 const header=document.createElement("header");header.id="crx-mini-header";
 header.innerHTML=`<div class="crx-mini-inner"><a class="crx-mini-brand" href="?calc=depths">CardRng <b>Calculators</b></a><nav aria-label="Calculators">${tabs.map(t=>`<button type="button" data-tool="${t}">${t==="towers"?"Tower Cheese":t.charAt(0).toUpperCase()+t.slice(1)}</button>`).join("")}</nav><span class="crx-testmark">TEST</span></div>`;
 document.body.prepend(header);
 const container=document.createElement("div");container.id="crx-simple-body";
 const view=document.createElement("div");view.id="crx-simple-view";
 root.before(container);container.append(root,view);
 let page=new URLSearchParams(location.search).get("calc")||"depths";
 if(!tabs.includes(page))page="depths";
 if(new URLSearchParams(location.search).get("view")==="tower")page="towers";
 if(new URLSearchParams(location.search).get("view")==="halloween")page="depths";
 function selectPage(to){
  if(!tabs.includes(to))return;
  page=to;const url=new URL(location.href);url.searchParams.set("calc",to);url.searchParams.delete("view");
  history.replaceState(null,"",url.pathname+url.search+url.hash);
  render();
 }
 function render(){
  header.querySelectorAll("[data-tool]").forEach(b=>{const chosen=b.dataset.tool===page;b.classList.toggle("selected",chosen);b.setAttribute("aria-current",chosen?"page":"false")});
  root.hidden=page!=="depths";view.hidden=page==="depths";
  if(page==="depths")return;
  if(page==="towers"){
   view.innerHTML=window.CRXNewTowerCheese?.render()||"<div class='crx-simple'><h2>Tower Cheese</h2><p>Loading...</p></div>";
   window.CRXNewTowerCheese?.bind(view,render);
  }else{
   view.innerHTML=page==="trials"?trialPage():portalPage();
   view.querySelector("#crx-trial")?.addEventListener("change",e=>{state.trial=e.target.value;render()});
   view.querySelector("#crx-portal")?.addEventListener("change",e=>{state.portal=e.target.value;render()});
   view.querySelector("#crx-completed")?.addEventListener("change",e=>{state.completed=Math.max(0,Number(e.target.value)||0);render()});
  }
 }
 header.querySelectorAll("[data-tool]").forEach(b=>b.addEventListener("click",()=>selectPage(b.dataset.tool)));
 window.addEventListener("crx-tower-cards-loaded",()=>{if(page==="towers")render()});
 window.addEventListener("popstate",()=>{const p=new URLSearchParams(location.search).get("calc");if(p&&tabs.includes(p)){page=p;render()}});
 render();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ready);else ready();
})();