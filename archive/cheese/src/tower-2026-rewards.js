/* Source-derived rewards: CYBERPUNK Card RNG Expansion.rbxl / TowerConfig.lua
   Floors 1–105, weights 20+floor; +250 per 15-floor milestone; +1000 at 105.
   Largest-remainder apportionment with the game tie rule (later floors first).
   Hardcore rewards use floor(regular floor total * 1.5), no replay packs.
   2X Instant Packs doubles the awarded packs once. */
(function TowerPackPlanner2026(){
"use strict";
const cfg=window.CRXTowerConfig2026;
if(!cfg)return;
const KEY="crx-tower-pack-rewards-v2";
let state={double:true,hardcore:true,upto:105,open:false};
try{state={...state,...JSON.parse(localStorage.getItem(KEY)||"{}")}}catch(_){}
const totalFor=name=>Math.floor(Math.max(0,Number(cfg.towers[name]?.packs)||0));
const clampFloor=v=>Math.max(1,Math.min(105,Math.floor(Number(v)||105)));
const fmt=v=>new Intl.NumberFormat("en-US").format(v);
const esc=x=>String(x).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const cache=new Map();
function allocate(name){
 if(cache.has(name))return cache.get(name);
 const total=totalFor(name);
 const entries=[];
 let weightTotal=0;
 for(let floor=1;floor<=105;floor++){
  for(const [kind,weight] of [["first",20+floor],["milestone",floor%15===0?250:0],["final",floor===105?1000:0]]){
   if(!weight)continue;
   entries.push({floor,kind,weight,amount:0,remainder:0});
   weightTotal+=weight;
  }
 }
 let assigned=0;
 for(const e of entries){
  const weighted=total*e.weight;
  e.amount=Math.floor(weighted/weightTotal);
  e.remainder=weighted%weightTotal;
  assigned+=e.amount;
 }
 const ranked=[...entries].sort((a,b)=>b.remainder-a.remainder||b.floor-a.floor);
 for(let i=0;i<total-assigned;i++)ranked[i].amount++;
 const result=Array.from({length:105},()=>({regular:0,hardcore:0}));
 for(const e of entries)result[e.floor-1].regular+=e.amount;
 for(const item of result)item.hardcore=Math.floor(item.regular*1.5);
 cache.set(name,result);
 return result;
}
function getTotals(order=cfg.order,upto=105,hardcore=true,double=true){
 const last=clampFloor(upto);
 const rows=order.map(name=>{
  const floors=allocate(name).slice(0,last);
  const regular=floors.reduce((s,x)=>s+x.regular,0);
  const hardcorePacks=hardcore?floors.reduce((s,x)=>s+x.hardcore,0):0;
  return {name,regular,hardcore:hardcorePacks,combined:(regular+hardcorePacks)*(double?2:1)};
 });
 return {rows,regular:rows.reduce((s,r)=>s+r.regular,0),hardcore:rows.reduce((s,r)=>s+r.hardcore,0),total:rows.reduce((s,r)=>s+r.combined,0)};
}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(_){}}
function tableHtml(order){
 const {rows,regular,hardcore,total}=getTotals(order,state.upto,state.hardcore,state.double);
 const factor=state.double?2:1;
 return '<div class="tc-pack-table-wrap"><table class="tc-pack-table"><thead><tr><th>Tower</th><th>Regular</th>'+
 (state.hardcore?'<th>Hardcore</th>':'')+'<th>With '+factor+'×</th></tr></thead><tbody>'+
 rows.map(r=>'<tr><td>'+esc(cfg.towers[r.name]?.name||r.name)+'</td><td>'+fmt(r.regular)+'</td>'+
 (state.hardcore?'<td>'+fmt(r.hardcore)+'</td>':'')+'<td>'+fmt(r.combined)+'</td></tr>').join('')+
 '</tbody></table></div><div class="tc-packs-total"><b>'+fmt(total)+' packs</b><span>'+fmt(regular)+' regular'+(state.hardcore?' + '+fmt(hardcore)+' Hardcore':'')+' · '+factor+'× pass · Floors 1–'+state.upto+'</span></div>';
}
function render(order=cfg.order){
 if(!Array.isArray(order)||!order.length)return "";
 return '<details class="tc-pack-planner" '+(state.open?'open':'')+'><summary>Normal Instant Pack rewards <small>Exact game formula</small></summary>'+
 '<p>First-clear rewards, including milestones. Hardcore totals are calculated with each floor rounded down separately. Replays award 0 packs.</p>'+
 '<div class="tc-pack-filters"><label><input type="checkbox" data-pack-double '+(state.double?'checked':'')+'> 2× Instant Packs</label>'+
 '<label><input type="checkbox" data-pack-hardcore '+(state.hardcore?'checked':'')+'> Include Hardcore</label>'+
 '<label class="tc-pack-floor-label">Up to floor <input type="number" min="1" max="105" data-pack-floor value="'+state.upto+'"></label></div>'+
 '<div data-pack-result>'+tableHtml(order)+'</div></details>';
}
function bind(root,order=cfg.order){
 const panel=root.querySelector('.tc-pack-planner');
 if(!panel)return;
 panel.addEventListener('toggle',()=>{state.open=panel.open;persist()});
 const update=()=>{state.upto=clampFloor(state.upto);const out=panel.querySelector('[data-pack-result]');if(out)out.innerHTML=tableHtml(order);persist()};
 panel.querySelector('[data-pack-double]')?.addEventListener('change',e=>{state.double=e.target.checked;update()});
 panel.querySelector('[data-pack-hardcore]')?.addEventListener('change',e=>{state.hardcore=e.target.checked;update()});
 panel.querySelector('[data-pack-floor]')?.addEventListener('change',e=>{state.upto=e.target.value;update()});
}
window.CRXTowerPackPlanner={render,bind,allocate,getTotals};
})();