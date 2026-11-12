(function CardRngSimpleHub(){
"use strict";
const tabs=["depths","towers","trials","bosses"];
const trial={
Daily:{floors:45,purple:.01,description:"Potions and first-clear rewards",packs:250000},
Weekly:{floors:80,purple:.05,description:"Double potion rewards",packs:2500000},
Monthly:{floors:200,purple:.20,description:"Materials at floors 50, 100 and 150",packs:null}
};

let state={trial:"Daily"};
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
function ready(){
 const root=document.getElementById("root");if(!root)return;
 const header=document.createElement("header");header.id="crx-mini-header";
 header.innerHTML=`<div class="crx-mini-inner"><a class="crx-mini-brand" href="?calc=depths">CardRng <b>Calculators</b></a><nav aria-label="Calculators">${tabs.map(t=>`<button type="button" data-tool="${t}">${t==="towers"?"Tower Cheese":t==="bosses"?"Boss Cheese":t==="trials"?"Trial Cheese":t.charAt(0).toUpperCase()+t.slice(1)}</button>`).join("")}</nav><span class="crx-testmark">TEST</span></div>`;
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
  }else if(page==="bosses"){
   view.innerHTML=window.CRXBossCheese?.render()||"<div class='crx-simple'><h2>Boss Cheese</h2><p>Loading...</p></div>";
   window.CRXBossCheese?.bind(view,render);
  }else{
   view.innerHTML=trialPage();
   view.querySelector("#crx-trial")?.addEventListener("change",e=>{state.trial=e.target.value;render()});
  }
 }
 header.querySelectorAll("[data-tool]").forEach(b=>b.addEventListener("click",()=>selectPage(b.dataset.tool)));
 window.addEventListener("crx-tower-cards-loaded",()=>{if(page==="towers")render()});
 window.addEventListener("crx-boss-data-ready",()=>{if(page==="bosses")render()});
 window.addEventListener("popstate",()=>{const p=new URLSearchParams(location.search).get("calc");if(p&&tabs.includes(p)){page=p;render()}});
 render();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ready);else ready();
})();