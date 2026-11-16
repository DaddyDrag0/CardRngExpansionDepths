/* Shared card autocomplete for Tower, Boss and Trial Cheese.
   Replaces the unstyled native datalist dropdown without changing combat state. */
(function CRXCheeseCardSearch(){
"use strict";
const selector='input[list="tc-cards"],input[list="bc-cardnames"],input[list="tr-cards"]';
let nextId=0;
const normalized=value=>String(value||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const rank=(name,q)=>{
  const n=normalized(name);
  if(n===q)return 0;
  if(n.startsWith(q))return 1;
  if(n.split(/[\s\-_']/).some(part=>part.startsWith(q)))return 2;
  return n.includes(q)?3:99;
};
function attach(root,cards,thumbnails={}){
  if(!root||!Array.isArray(cards))return;
  const catalog=[...new Map(cards.filter(c=>c&&typeof c.name==="string").map(c=>[c.name.toLowerCase(),c])).values()]
    .sort((a,b)=>a.name.localeCompare(b.name));
  root.querySelectorAll(selector).forEach(input=>{
    if(input.dataset.cheeseAutocomplete)return;
    input.dataset.cheeseAutocomplete="1";
    input.removeAttribute("list"); // Prevent the native white datalist popup.
    input.setAttribute("autocomplete","off");
    input.setAttribute("spellcheck","false");
    input.setAttribute("role","combobox");
    input.setAttribute("aria-autocomplete","list");
    input.setAttribute("aria-haspopup","listbox");
    input.setAttribute("aria-expanded","false");
    const wrapper=document.createElement("span");
    wrapper.className="cc-card-search-wrap";
    input.parentNode.insertBefore(wrapper,input);
    wrapper.appendChild(input);
    const popup=document.createElement("div");
    popup.className="cc-card-search-popup";
    popup.id="cc-card-results-"+(++nextId);
    popup.setAttribute("role","listbox");
    popup.hidden=true;
    wrapper.appendChild(popup);
    input.setAttribute("aria-controls",popup.id);
    let choices=[],active=-1;
    function close(){
      popup.hidden=true;
      popup.textContent="";
      choices=[];
      active=-1;
      input.setAttribute("aria-expanded","false");
      input.removeAttribute("aria-activedescendant");
    }
    function highlight(index){
      if(!choices.length)return;
      active=(index+choices.length)%choices.length;
      choices.forEach((item,i)=>{
        item.element.classList.toggle("active",i===active);
        item.element.setAttribute("aria-selected",String(i===active));
      });
      input.setAttribute("aria-activedescendant",choices[active].element.id);
      choices[active].element.scrollIntoView({block:"nearest"});
    }
    function choose(cardName){
      close();
      input.value=cardName;
      input.dispatchEvent(new Event("change",{bubbles:true}));
    }
    function show(){
      const q=normalized(input.value);
      const matches=catalog.map(c=>({card:c,score:q?rank(c.name,q):1}))
        .filter(x=>x.score<99)
        .sort((a,b)=>a.score-b.score||a.card.name.localeCompare(b.card.name))
        .slice(0,9);
      popup.textContent="";
      choices=[];
      active=-1;
      popup.classList.toggle("cc-search-right",input.getBoundingClientRect().right+100>window.innerWidth-16);
      if(!matches.length){
        const empty=document.createElement("div");
        empty.className="cc-card-search-empty";
        empty.textContent="No matching cards";
        popup.appendChild(empty);
      }
      for(const {card} of matches){
        const button=document.createElement("button");
        button.type="button";
        button.className="cc-card-search-option";
        button.id=popup.id+"-option-"+choices.length;
        button.setAttribute("role","option");
        button.setAttribute("aria-selected","false");
        button.tabIndex=-1;
        const imageUrl=thumbnails[String(card.imageAssetId)]||"";
        if(typeof imageUrl==="string"&&/^(https?:\/\/|\.\/|\/)/i.test(imageUrl)){
          const image=document.createElement("img");
          image.loading="lazy";
          image.alt="";
          image.src=imageUrl;
          button.appendChild(image);
        }else{
          const fallback=document.createElement("span");
          fallback.className="cc-card-search-image-fallback";
          fallback.textContent=card.name.charAt(0);
          button.appendChild(fallback);
        }
        const name=document.createElement("span");
        name.className="cc-card-search-name";
        name.textContent=card.name;
        button.appendChild(name);
        button.addEventListener("pointerdown",event=>{event.preventDefault();choose(card.name)});
        button.addEventListener("click",()=>choose(card.name));
        popup.appendChild(button);
        choices.push({card,element:button});
      }
      popup.hidden=false;
      input.setAttribute("aria-expanded","true");
    }
    input.addEventListener("focus",show);
    input.addEventListener("input",show);
    input.addEventListener("blur",close);
    input.addEventListener("keydown",event=>{
      if(event.key==="Escape"&&!popup.hidden){event.preventDefault();close();return;}
      if(event.key==="ArrowDown"||event.key==="ArrowUp"){
        event.preventDefault();
        if(popup.hidden)show();
        if(choices.length)highlight(active<0?(event.key==="ArrowDown"?0:choices.length-1):active+(event.key==="ArrowDown"?1:-1));
        return;
      }
      if(event.key==="Enter"&&!popup.hidden&&choices.length){
        event.preventDefault();
        choose(choices[Math.max(active,0)].card.name);
      }
    });
  });
}
window.CRXCheeseCardSearch={attach};
})();