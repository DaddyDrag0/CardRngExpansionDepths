/* Shared, accessible Cheese deck controls. UI only: no combat/search changes. */
(function CheeseDeckUX(){
"use strict";
const fields=["team","borders","mutations"];
function swapDeck(state,from,to){
 if(!state||!Number.isInteger(from)||!Number.isInteger(to)||from===to||from<0||to<0)return false;
 if(!Array.isArray(state.team)||from>=state.team.length||to>=state.team.length)return false;
 for(const key of fields){
  const values=state[key];
  if(!Array.isArray(values))continue;
  [values[from],values[to]]=[values[to],values[from]];
 }
 return true;
}
function attach(root,state,onSwap){
 if(!root||!state||typeof onSwap!=="function")return;
 const page=root.querySelector(".cc-page,.tc");
 if(!page)return;
 const title=page.querySelector(".cc-page-top,.tc-page-top");
 if(title&&!page.querySelector(".cc-mini-guide")){
  const guide=document.createElement("div");
  guide.className="cc-mini-guide";
  guide.setAttribute("aria-label","How to use Cheese Maker");
  for(const [number,label] of [["01","Choose fight"],["02","Find or build"],["03","Test your deck"]]){
   const item=document.createElement("span");
   const count=document.createElement("b");
   count.textContent=number;
   item.append(count,document.createTextNode(" "+label));
   guide.appendChild(item);
  }
  title.insertAdjacentElement("afterend",guide);
 }
 // Run count is an advanced performance setting, not a requirement to find Cheese.
 const runs=page.querySelector("#tc-runs,#bc-runs,#tr-runs");
 const advanced=page.querySelector(".tc-extra-grid,.cc-options .cc-pool");
 const runLabel=runs?.closest("label");
 if(runs&&advanced&&runLabel)advanced.prepend(runLabel);

 const deck=page.querySelector(".tc-team,.cc-manual-grid");
 if(!deck)return;
 const slots=Array.from(deck.children).filter(node=>node.classList?.contains("tc-member")||node.classList?.contains("cc-manual-slot"));
 if(slots.length<2)return;
 deck.classList.add("cc-deck-interactive");
 let chosen=-1,dragging=-1;
 function clear(){
  chosen=-1;dragging=-1;
  for(const slot of slots)slot.classList.remove("cc-swap-selected","cc-swap-target","cc-swap-dragging");
  for(const button of deck.querySelectorAll(".cc-swap-handle"))button.setAttribute("aria-pressed","false");
 }
 function commit(a,b){
  if(a===b){clear();return}
  clear();
  if(swapDeck(state,a,b)){
   onSwap(a,b);
   // Keep keyboard navigation useful even though rerender replaces the slots.
   root.querySelectorAll(".cc-swap-handle")[b]?.focus({preventScroll:true});
  }
 }
 function select(index){
  if(chosen===index){clear();return}
  if(chosen>=0){commit(chosen,index);return}
  chosen=index;
  slots[index].classList.add("cc-swap-selected");
  const handle=slots[index].querySelector(".cc-swap-handle");
  if(handle)handle.setAttribute("aria-pressed","true");
 }
 slots.forEach((slot,index)=>{
  slot.classList.add("cc-draggable-slot");
  slot.dataset.deckIndex=String(index);
  const grip=document.createElement("button");
  grip.type="button";
  grip.className="cc-swap-handle";
  grip.draggable=true;
  grip.setAttribute("aria-label","Move card "+(index+1)+". Drag or select a second card to swap.");
  grip.setAttribute("aria-pressed","false");
  grip.setAttribute("title","Drag to swap · Tap to select · Arrow keys to move");
  grip.textContent="⠿";
  slot.appendChild(grip);
  grip.addEventListener("click",event=>{event.preventDefault();select(index)});
  grip.addEventListener("keydown",event=>{
   if(event.key==="Escape"){clear();return}
   if(event.key==="ArrowLeft"||event.key==="ArrowUp"||event.key==="ArrowRight"||event.key==="ArrowDown"){
    event.preventDefault();
    const delta=event.key==="ArrowLeft"||event.key==="ArrowUp"?-1:1;
    commit(index,Math.max(0,Math.min(slots.length-1,index+delta)));
   }
  });
  grip.addEventListener("dragstart",event=>{
   clear();dragging=index;
   slots[index].classList.add("cc-swap-dragging");
   if(event.dataTransfer){
    event.dataTransfer.effectAllowed="move";
    event.dataTransfer.setData("text/plain","crx-deck:"+index);
   }
  });
  grip.addEventListener("dragend",clear);
  slot.addEventListener("dragover",event=>{
   if(dragging<0)return;
   event.preventDefault();
   if(event.dataTransfer)event.dataTransfer.dropEffect="move";
   slots.forEach(node=>node.classList.remove("cc-swap-target"));
   if(index!==dragging)slot.classList.add("cc-swap-target");
  });
  slot.addEventListener("dragleave",event=>{
   if(event.relatedTarget&&slot.contains(event.relatedTarget))return;
   slot.classList.remove("cc-swap-target");
  });
  slot.addEventListener("drop",event=>{
   if(dragging<0)return;
   event.preventDefault();
   commit(dragging,index);
  });
  // Clicking artwork opens the existing searchable card input.
  const portrait=slot.querySelector(".cc-portrait");
  const input=slot.querySelector('input[data-team],input[data-bc-card],input[data-tr-team]');
  if(portrait&&input){
   portrait.classList.add("cc-portrait-edit");
   portrait.setAttribute("title","Choose card");
   portrait.addEventListener("click",()=>input.focus());
  }
 });
 // A screen-reader hint also explains the interaction when the user tabs to a handle.
 const help=document.createElement("span");
 help.className="cc-deck-hint";
 help.textContent="Drag to swap · Tap two handles · Arrow keys";
 deck.insertAdjacentElement("beforebegin",help);
}
window.CRXCheeseDeckUX={attach,swapDeck};
})();