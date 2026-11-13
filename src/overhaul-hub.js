(function CardRngSimpleHub(){
"use strict";
const tabs=["depths","towers","trials","bosses"];
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
   view.innerHTML=window.CRXTrialCheese?.render()||"<div class='crx-simple'><h2>Trial Cheese</h2><p>Loading...</p></div>";
   window.CRXTrialCheese?.bind(view,render);
  }
 }
 header.querySelectorAll("[data-tool]").forEach(b=>b.addEventListener("click",()=>selectPage(b.dataset.tool)));
 window.addEventListener("crx-tower-cards-loaded",()=>{if(page==="towers")render()});
 window.addEventListener("crx-boss-data-ready",()=>{if(page==="bosses")render()});
 window.addEventListener("crx-trial-data-ready",()=>{if(page==="trials")render()});
 window.addEventListener("popstate",()=>{const p=new URLSearchParams(location.search).get("calc");if(p&&tabs.includes(p)){page=p;render()}});
 render();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ready);else ready();
})();