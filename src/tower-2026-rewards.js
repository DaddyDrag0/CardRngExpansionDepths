/* Tower pack reward calculator. Unverified source values intentionally remain blank. */
(function TowerPackPlanner2026(){
"use strict";
const KEY="crx-tower-instant-packs-v1";
const read=()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||"{}");return x&&typeof x==="object"?x:{}}catch(_){return {}}};
let state={totals:{},multiplier:2,open:false,...read()};
if(!state.totals||typeof state.totals!=="object")state.totals={};
const escapeHtml=v=>String(v??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const UNITS={"":1n,K:1000n,M:1000000n,B:1000000000n,T:1000000000000n,QD:1000000000000000n};
function parseAmount(value){
 const raw=String(value??"").replace(/,/g,"").trim();
 if(!raw)return null;
 const match=/^(\d+)(?:\.(\d+))?\s*(K|M|B|T|QD)?$/i.exec(raw);
 if(!match)return undefined;
 const decimal=match[2]||"",factor=10n**BigInt(decimal.length);
 const numerator=BigInt(match[1]+decimal)*UNITS[(match[3]||"").toUpperCase()];
 if(numerator%factor!==0n)return undefined;
 return numerator/factor;
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(_){}}
function totals(order){
 const values=order.map(name=>parseAmount(state.totals[name]||""));
 const known=values.filter(value=>typeof value==="bigint");
 const invalid=values.filter(value=>value===undefined).length;
 const base=known.reduce((sum,value)=>sum+value,0n);
 const result=base*BigInt(state.multiplier===2?2:1);
 return {entered:known.length,invalid,complete:known.length===order.length&&!invalid,result,base};
}
function summary(order){
 const r=totals(order);
 const value=r.result.toLocaleString("en-US");
 if(r.invalid)return '<b>Check the invalid amounts</b><span>Use whole numbers or K, M, B, T and QD suffixes.</span>';
 if(r.complete)return '<b>'+value+' Instant Packs</b><span>All '+order.length+' tower totals included · '+state.multiplier+'× reward multiplier</span>';
 return '<b>'+r.entered+' / '+order.length+' towers entered</b><span>'+ (r.entered?'Known subtotal: '+value+' Instant Packs · ':'')+'Final total unavailable until every tower reward is entered.</span>';
}
function render(order){
 if(!Array.isArray(order)||!order.length)return "";
 return '<details class="tc-pack-planner" '+(state.open?'open':'')+'><summary>Instant Pack rewards <small>2× calculator</small></summary>'+
  '<p>The game reward amounts are not in the available tower data. Enter each tower’s unboosted total; unknown rewards are never treated as zero.</p>'+
  '<div class="tc-pack-mult"><label><input type="checkbox" data-pack-double '+(state.multiplier===2?'checked':'')+'> Apply 2× Instant Pack rewards</label></div>'+
  '<div class="tc-pack-grid">'+order.map(name=>'<label>'+escapeHtml(name)+'<input type="text" inputmode="decimal" autocomplete="off" data-tower-pack="'+escapeHtml(name)+'" value="'+escapeHtml(state.totals[name]||"")+'" placeholder="Not yet verified"></label>').join('')+'</div>'+
  '<div class="tc-packs-total" aria-live="polite">'+summary(order)+'</div></details>';
}
function bind(root,order){
 const panel=root.querySelector('.tc-pack-planner');
 if(!panel)return;
 panel.addEventListener('toggle',()=>{state.open=panel.open;save()});
 const output=panel.querySelector('.tc-packs-total');
 const update=()=>{if(output)output.innerHTML=summary(order);save()};
 panel.querySelector('[data-pack-double]')?.addEventListener('change',event=>{state.multiplier=event.target.checked?2:1;update()});
 panel.querySelectorAll('[data-tower-pack]').forEach(input=>input.addEventListener('input',()=>{
   state.totals[input.getAttribute('data-tower-pack')]=input.value;update();
 }));
}
window.CRXTowerPackPlanner={render,bind,parseAmount};
})();