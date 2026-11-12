(function CardRngOverhaulHub(){
"use strict";
const pages=[
{id:"home",title:"Overview",icon:"◈",desc:"Choose a calculator"},
{id:"depths",title:"Depths",icon:"⌄",desc:"Normal & Hard simulations"},
{id:"towers",title:"Towers",icon:"▥",desc:"11 tower configurations"},
{id:"trials",title:"Trials",icon:"⏱",desc:"Daily, Weekly & Monthly"},
{id:"portals",title:"Portals",icon:"◎",desc:"F–S rank encounters"},
{id:"materials",title:"Materials",icon:"◆",desc:"Depths drop estimates"},
{id:"packs",title:"Instant Packs",icon:"◈",desc:"Upgrade point planner"},
{id:"gems",title:"Gems",icon:"◇",desc:"Charm socket planner"},
{id:"bosses",title:"Boss Progression",icon:"♜",desc:"Difficulty & unlock tracker"},
{id:"legacytower",title:"Legacy Tower Sim",icon:"⌁",desc:"Old engine—unverified"}
];
const cfg={
tower:{
Easy:[200,100,250000,125000,2000000],Normal:[1000,500,1250000,625000,4000000],
Hard:[5000,2500,6250000,3125000,8000000],Extreme:[20000,10000,25000000,12500000,16000000],
Hell:[80000,40000,100000000,50000000,32000000],Impossible:[300000,150000,375000000,187500000,62000000],
Mutation:[80000,40000,100000000,50000000,20000000],Auraloss:[80000,40000,100000000,50000000,20000000],
FrozenGlaze:[80000,40000,100000000,50000000,20000000],Oblivion:[80000,40000,100000000,50000000,20000000],
Eruption:[80000,40000,100000000,50000000,20000000]},
towerRules:{Mutation:"Mutated cards only",Auraloss:"Aura support disabled",FrozenGlaze:"25% freeze chance",Oblivion:"Healing disabled; 15% bleeding",Eruption:"15% stun; 20% burn",Impossible:"Special activity bans"},
trials:{Daily:{max:45,gem:0.01,reset:"Every day at 00:00 Stockholm",packs:250000,notes:"Potion rewards and checkpoint milestones; final floor awards 250,000 Normal Instant Packs."},Weekly:{max:80,gem:0.05,reset:"Every Monday at 00:00 Stockholm",packs:2500000,notes:"Double potion rewards; largest checkpoint reward is 2,500,000 Normal Instant Packs."},Monthly:{max:200,gem:0.2,reset:"First day of the month at 00:00 Stockholm",packs:null,notes:"Materials at floors 50/100/150; completion rewards include Primordial Essence."}},
portal:{F:{weight:35,gem:0,index:0},E:{weight:25,gem:0,index:1},D:{weight:17,gem:0,index:2},C:{weight:10,gem:0.001,index:3},B:{weight:7,gem:0.005,index:4},A:{weight:5,gem:0.01,index:5},S:{weight:1,gem:0.05,index:6}},
mats:[
["Stone Fragment","Common",.04,1,.14,3],["Iron Ore","Common",.035,1,.12,3],["Ancient Bark","Common",.025,1,.10,3],
["Bone Shard","Common",.02,1,.08,3],["Arcane Dust","Common",.015,1,.06,3],["Abyssal Crystal","Rare",.006,1,.05,2],
["Soul Ember","Rare",.0025,1,.03,2],["Celestial Fragment","Rare",.001,1,.015,2],["Primordial Essence","Legendary",0,0,.01,1]],
packUpgrades:[["Luck",25,1,40],["Platinum",25,1,1.25],["Crystal",25,2,3],["Ruby",25,3,4],["Galaxy",25,4,5],["Mutation",25,2,7.5],["MultiCardChance",20,3,0]],
charmSlots:{
"Old Tome":["Green"],"Holy Cross":["Green"],"Bloodstone":["Green"],"Lunar Charm":["Green","Blue"],"Blood Moon":["Green","Blue"],"Ice Crystal":["Blue","Green"],
"Victor's Trophy":["Green","Blue","Red"],"Phoenix Feather":["Green","Blue","Red"],Durandal:["Green","Blue","Red"],
"Hell Charm":["Green","Blue","Red","Yellow"],"Emperor's Hand":["Green","Blue","Red","Yellow"],
"Platinum Gem":["Green","Blue","Yellow","Purple"],"Heavenly Crown":["Green","Blue","Yellow","Purple"],"Crystal Gem":["Green","Blue","Yellow","Purple"],
"Dark Star":["Green","Blue","Red","Purple"],"Infinity Gem":["Green","Blue","Blue","Red"],
"Lucky Crown":["Red","Red","Yellow","Yellow"],"Forbidden Book":["Green","Blue","Red","Yellow","Purple"],
"Angel's Halo":["Red","Red","Yellow","Purple","Purple"],"Forbidden Fruit":["Green","Blue","Yellow","Yellow","Purple"],
"Sacred Heart":["Red","Red","Red","Blue","Blue","Green"],
"Book of Life and Death":["Green","Green","Blue","Blue","Red","Red","Yellow"],
"Astral Hourglass":["Green","Green","Blue","Blue","Yellow","Yellow","Purple","Purple"]},
gemGrades:{None:0,Common:2.5,Uncommon:5,Rare:7.5,Epic:10,Legendary:15}
};
const state={tower:"Easy",towerFloor:105,trial:"Daily",trialFloor:45,portal:"F",portalFloor:25,portalCompletes:50,matMode:"Hard",matStart:1,matEnd:1000,matBountiful:0,matRuns:1,packEntries:250,packLevels:{},charm:"Forbidden Book",gemGrades:[],bossClears:0};
const fmt=n=>new Intl.NumberFormat("en-US",{maximumFractionDigits:2}).format(Number(n)||0);
const pct=n=>`${(100*n).toFixed(n<.01?2:1)}%`;
const safe=s=>String(s).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const sel=(items,value)=>items.map(x=>`<option ${String(x)===String(value)?"selected":""}>${safe(x)}</option>`).join("");
const wrap=(title,sub,content)=>`<div class="oh-hero"><div><div class="oh-eyebrow">CARD RNG · 2026 OVERHAUL</div><h2>${title}</h2><p>${sub}</p></div><span class="oh-tag">TEST BUILD</span></div>${content}`;
const panel=(title,body,extra="")=>`<section class="oh-section"><div class="oh-section-h"><h3>${title}</h3>${extra}</div>${body}</section>`;
const field=(id,label,value,min=0,max=300000,step=1)=>`<label class="oh-field"><span>${label}</span><input id="${id}" type="number" inputmode="numeric" min="${min}" max="${max}" step="${step}" value="${safe(value)}"></label>`;
const metric=(title,value,sub="")=>`<div class="oh-metric"><small>${title}</small><strong>${value}</strong>${sub?`<small>${sub}</small>`:""}</div>`;
const note=t=>`<p class="oh-note">${t}</p>`;
const table=(head,rows)=>`<div class="oh-scroll"><table class="oh-table"><thead><tr>${head.map(v=>`<th>${v}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`;
function home(){
const shown=pages.filter(p=>!["home","legacytower"].includes(p.id));
return wrap("All your calculators. One place.","Depths, new Towers, Trials, Portals and progression tools. Your existing team simulator is preserved; new mechanics are separated into dedicated tools.",
`<div class="oh-home-grid">${shown.map(p=>`<button class="oh-launch" data-page="${p.id}"><span class="oh-launch-symbol">${p.icon}</span><strong>${p.title}</strong><small>${p.desc}</small><em>Open calculator →</em></button>`).join("")}</div>`+
note("Data sourced from the November 2026 exported game configurations. Server-only battle behavior and some reward triggers are not yet verified."));
}
function towers(){
const entries=Object.keys(cfg.tower),a=cfg.tower[state.tower],f=Math.max(1,Math.min(105,Math.floor(Number(state.towerFloor)||1)));
state.towerFloor=f;
const end=f===105,begin=f===1,boss=f%5===0;
function stat(s,e){return Math.floor(begin?s:end?e:s*Math.pow((e/1.25)/s,(f-1)/104)*(boss?1.25:1));}
const hp=stat(a[0],a[2]),damage=stat(a[1],a[3]);
return wrap("Tower Calculator","Select one of the 11 reworked Towers and inspect the actual configured enemy scaling, restrictions and total listed pack rewards.",
panel("Tower settings",`<div class="oh-fields"><label class="oh-field"><span>Tower</span><select id="oh-tower">${sel(entries,state.tower)}</select></label>${field("oh-tower-floor","Floor (1–105)",f,1,105)}</div>`)+
`<div class="oh-metrics">${metric("Enemy HP",fmt(hp))}${metric("Enemy damage",fmt(damage))}${metric("Total listed packs",fmt(a[4]))}${metric("Floor type",boss?"Boss":"Regular")}</div>`+
panel("Rules and progression",`<p class="oh-copy">${safe(cfg.towerRules[state.tower]||"Standard Tower difficulty, 105 floors. Standard difficulties unlock in order.")}</p>`+
`<div class="oh-pillstrip"><span>6 standard Towers</span><span>5 special Towers</span><span>105 floors each</span><span>Boss floors every 5</span></div>`+
note("These are configured per-enemy stats, not a full team win-rate simulation. Legacy Tower Cheese Maker is still available separately, but its old battle model has not been recalibrated for this overhaul.")));
}
function trials(){
const c=cfg.trials[state.trial],f=Math.max(1,Math.min(c.max,Number(state.trialFloor)||1));state.trialFloor=f;
return wrap("Trials","Review trial milestones, reset schedules and Legendary Purple Gem completion chances.",
panel("Trial settings",`<div class="oh-fields"><label class="oh-field"><span>Trial</span><select id="oh-trial">${sel(Object.keys(cfg.trials),state.trial)}</select></label>${field("oh-trial-floor","Floor",f,1,c.max)}</div>`)+
`<div class="oh-metrics">${metric("Floors",fmt(c.max))}${metric("Selected floor",fmt(f))}${metric("Legendary Purple Gem",pct(c.gem),"On completed Trial")}${metric("Pack milestone",c.packs===null?"Variable":fmt(c.packs))}</div>`+
panel("Rewards & resets",`<p class="oh-copy">${safe(c.notes)}</p><p class="oh-copy">Reset: <strong>${safe(c.reset)}</strong></p>`+
note("Gem odds are configured completion chances, not chances on every floor. Exact enemy teams and combat results still require game-server testing.")));
}
function portals(){
const c=cfg.portal[state.portal],f=Math.max(1,Math.min(25,Number(state.portalFloor)||1));state.portalFloor=f;
let dmg=Math.floor(10000*Math.pow(2.75,c.index)*(1+1.75*(f-1)/24));
if(state.portal==="A"||state.portal==="S")dmg=Math.floor(dmg*.75);
const hp=dmg*2,win=Math.max(0,Number(state.portalCompletes)||0),prob=1-Math.pow(1-c.gem,win);
const packsBase={F:25000,E:50000,D:100000,C:200000,B:400000,A:800000,S:1600000}[state.portal];
const floorWeight=f%5===0?({5:2,10:3,15:4,20:6,25:10}[f]):1;
const packs=Math.floor(packsBase/45*floorWeight*1.3*1.25);
return wrap("Normal Portals","Calculate rank-specific enemy stats, Normal Instant Pack rewards and expected Legendary Red Gem outcomes.",
panel("Portal settings",`<div class="oh-fields"><label class="oh-field"><span>Rank</span><select id="oh-portal">${sel(Object.keys(cfg.portal),state.portal)}</select></label>${field("oh-portal-floor","Stage (1–25)",f,1,25)}${field("oh-portal-completes","Completions for probability",win,0,100000)}</div>`)+
`<div class="oh-metrics">${metric("Enemy HP",fmt(hp))}${metric("Enemy damage",fmt(dmg))}${metric("Normal packs / stage",fmt(packs))}${metric("Legendary Red Gem",pct(c.gem),"On floor 25 completion")}</div>`+
panel("Drop probability",`<div class="oh-metrics">${metric("Rank spawn chance",pct(c.weight/100))}${metric("Expected gems",fmt(win*c.gem),`${fmt(win)} completions`)}${metric("Chance of ≥1",pct(prob),`${fmt(win)} completions`)}</div>`+
note("Portals are globally synchronized: one spawn every 60 minutes, active for 30 minutes. C+ has stricter activity bans. Drop rates are from client configs; server reward triggers require confirmation.")));
}
function materials(){
const normal=state.matMode==="Normal",st=Math.max(1,Math.floor(Number(state.matStart)||1)),en=Math.max(st,Math.min(300000,Math.floor(Number(state.matEnd)||st))),b=Math.max(0,Math.min(1000,Number(state.matBountiful)||0)),runs=Math.max(0,Number(state.matRuns)||0);
const floors=[];for(let i=Math.ceil(st/100)*100;i<=en;i+=100)floors.push(i);
const totals=cfg.mats.map((v)=>{
let exp=0,chanceNone=1;
for(const f of floors){const step=normal?2000:200;const mult=Math.min(1.5,1+Math.floor((f-1)/step)*.05);const base=normal?v[2]:v[4],amt=normal?v[3]:v[5],boost=v[1]==="Common"?1:1+b/100;const p=Math.min(1,base*mult*boost);
exp+=p*amt;chanceNone*=1-p;
}
return {name:v[0],rarity:v[1],exp,any:1-chanceNone,perHr:exp*runs}});
const total=totals.reduce((a,b)=>a+b.exp,0);
return wrap("Material Farming","Expected checkpoint drops from Normal or Hard Depths. Use your actual run results to estimate materials earned per hour.",
panel("Farming run",`<div class="oh-fields"><label class="oh-field"><span>Difficulty</span><select id="oh-mat-mode">${sel(["Normal","Hard"],state.matMode)}</select></label>${field("oh-mat-start","Start floor",st,1,300000)}${field("oh-mat-end","Floor reached",en,1,300000)}${field("oh-mat-bountiful","Bountiful Delve bonus %",b,0,1000,.1)}${field("oh-mat-runs","Completed runs per hour",runs,0,100,0.1)}</div>`)+
`<div class="oh-metrics">${metric("Checkpoints",fmt(floors.length))}${metric("Expected materials / run",fmt(total))}${metric("Expected materials / hour",fmt(total*runs))}</div>`+
panel("Expected materials",table(["Material","Rarity","Per run","Chance ≥1","Per hour"],totals.map(v=>`<tr><td><strong>${v.name}</strong></td><td>${v.rarity}</td><td>${fmt(v.exp)}</td><td>${pct(v.any)}</td><td>${fmt(v.perHr)}</td></tr>`))+
note("Calculated from MaterialConfig.CheckpointDistribution. Checks occur every 100 floors; depth cap is 1.5×, and rare/legendary materials receive Bountiful Delve. Expected amounts assume each configured probability is applied as listed; the server may enforce a single reward selection.")));
}
function packs(){
const upgrades=cfg.packUpgrades;
let spent=0;
for(const [name,max,cost] of upgrades){const val=Math.max(0,Math.min(max,Math.floor(Number(state.packLevels[name])||0)));state.packLevels[name]=val;spent+=val*cost;}
const level=state.packLevels.MultiCardChance||0,two=.15*level/20,three=.05*level/20,expected=1+two+2*three;
const entry=Math.max(0,Math.floor(Number(state.packEntries)||0));
return wrap("Instant Pack Upgrades","Plan your Pack Upgrade Points separately from ordinary rolling Luck and compare expected independent card pulls.",
panel("Upgrade levels",`<div class="oh-fields">${field("oh-pack-entries","Unique Normal Index entries",entry,0,1000000)}${upgrades.map(([name,max,cost,effect])=>field(`oh-pack-${name}`,`${name} · ${cost} point${cost>1?"s":""}/lvl`,state.packLevels[name]||0,0,max)).join("")}</div>`)+
`<div class="oh-metrics">${metric("Points spent",fmt(spent))}${metric("Estimated points",`${fmt(Math.floor(entry/50))} or ${fmt(Math.floor(entry/5))}`,"Announcement 50 vs config 5")}${metric("Cards per pack",expected.toFixed(3))}${metric("3-card chance",pct(three))}</div>`+
panel("Effective bonuses",table(["Upgrade","Level","Configured bonus"],upgrades.map(([name,max,cost,effect])=>`<tr><td>${name}</td><td>${state.packLevels[name]}</td><td>${name==="MultiCardChance"?`2-card ${pct(two)} · 3-card ${pct(three)}`:`+${fmt(state.packLevels[name]*effect)}${name==="Luck"?" Luck":"%"}`}</td></tr>`))+
note("The announcement says 50 discoveries per point, but NormalPackUpgrades.lua says 5. Both values are shown until verified live. Pack Luck is not ordinary roll Luck. Mutation is an available configured Pack upgrade.")));
}
function gems(){
const names=Object.keys(cfg.charmSlots),slots=cfg.charmSlots[state.charm]||["Green"];let sum={Green:0,Blue:0,Red:0,Yellow:0,Purple:0};
const controls=slots.map((color,i)=>{const grade=state.gemGrades[i]||"None";sum[color]+=cfg.gemGrades[grade]||0;return `<label class="oh-field"><span>${color} socket ${i+1}</span><select data-gem-index="${i}">${sel(Object.keys(cfg.gemGrades),grade)}</select></label>`}).join("");
return wrap("Gem Optimizer","See the exact Gem socket layout of a Charm and the combined percentage bonuses of your equipped Gem grades.",
panel("Charm & sockets",`<div class="oh-fields"><label class="oh-field"><span>Equipped Charm</span><select id="oh-charm">${sel(names,state.charm)}</select></label>${controls}</div>`)+
`<div class="oh-metrics">${metric("Luck",`+${fmt(sum.Green)}%`)}${metric("Roll speed",`+${fmt(sum.Blue)}%`)}${metric("PvE HP & damage",`+${fmt(sum.Red)}%`)}${metric("Extra roll chance",`${fmt(Math.min(100,sum.Yellow))}%`)}${metric("Border odds",`+${fmt(sum.Purple)}%`)}</div>`+
panel("Gem rules",`<p class="oh-copy">Gem tiers: Common 2.5%, Uncommon 5%, Rare 7.5%, Epic 10%, Legendary 15% per socket. Red gems only affect PvE combat; they do not increase ordinary rolling Luck.</p>`+
note("The socket colors are locked by each Charm. Bonuses of the same color add before becoming a 1 + total/100 multiplier. Crafting reaches Epic; Legendary Gems have separate acquisition sources.")));
}
function bosses(){
const difficulty=["Easy","Normal","Hard","Extreme","Impossible"],clears=Math.max(0,Math.min(5,Number(state.bossClears)||0));
return wrap("Boss Progression","Track your boss-specific Luck without assuming which Boss cards or battle cards you own.",
panel("Difficulty clears",`<div class="oh-fields">${field("oh-boss-clears","Difficulties cleared for a boss",clears,0,5)}</div>`)+
`<div class="oh-metrics">${metric("Permanent boss-card Luck",`${clears}× bonus`)}${metric("Next difficulty",clears>=5?"Complete":difficulty[clears])}${metric("Mutation unlock",clears>=5?"Unlocked":"Requires Impossible")}${metric("Repeat rewards","24h cooldown")}</div>`+
panel("Unlock route",`<p class="oh-copy">Clear all Seven Sins on Easy to unlock Time Lords; Normal to unlock Mother of Beasts; Hard to unlock the Cathedral. Kaelis the Absolute requires all Seven Virtues cleared on Hard.</p>`+
note("This is a progression tracker, not an unverified boss win-rate prediction.")));
}
function findTab(){
const params=new URLSearchParams(location.search),test=params.get("calc"),v=params.get("view");
if(test&&pages.some(p=>p.id===test))return test;
if(v==="tower")return "legacytower";
if(v==="halloween")return "home";
return "home";
}
function ready(){
const root=document.getElementById("root");if(!root)return;
const nav=document.createElement("div");nav.id="oh-shell";
const main=document.createElement("div");main.id="oh-body";
const panelHost=document.createElement("div");panelHost.id="oh-panel";
main.append(root,panelHost);
document.body.insertBefore(nav,document.body.firstChild);
nav.innerHTML=`<div class="oh-top"><div class="oh-brand"><span class="oh-brand-icon">C<span>R</span></span><div><strong>CardRng <span>Calculators</span></strong><small>EXPANSION · BIGGEST UPDATE</small></div></div><div class="oh-top-right"><span class="oh-preview">PREVIEW / TEST BRANCH</span><span class="oh-nav-status">GAME DATA NOV '26</span></div></div><div class="oh-nav" id="oh-navigation">${pages.map(p=>`<button type="button" data-page="${p.id}"><span>${p.icon}</span>${p.title}</button>`).join("")}</div>`;
nav.after(main);
let tab=findTab();const loadedLegacyView=new URLSearchParams(location.search).get("view")==="tower"?"tower":"depths";
function switchTo(next){
 if(next==="depths"||next==="legacytower"){
 const desired=next==="legacytower"?"tower":null, current=new URLSearchParams(location.search).get("view");
 if((desired||"depths")!==loadedLegacyView){
 const p=new URL(location.href);p.searchParams.delete("calc");p.searchParams.delete("view");if(desired)p.searchParams.set("view",desired);else p.searchParams.set("calc","depths");location.href=p.href;return;
 }
 }
 tab=next;const url=new URL(location.href);url.searchParams.set("calc",next);if(next==="legacytower")url.searchParams.set("view","tower");else if(next!=="depths")url.searchParams.delete("view");
 history.replaceState(history.state,"",url.pathname+url.search+url.hash);
 render();
}
function render(){
 nav.querySelectorAll("[data-page]").forEach(el=>{el.classList.toggle("active",el.dataset.page===tab);el.setAttribute("aria-pressed",String(el.dataset.page===tab));});
 const legacy=tab==="depths"||tab==="legacytower";root.hidden=!legacy;panelHost.hidden=legacy;
 if(legacy)return;
 panelHost.innerHTML=({home,towers,trials,portals,materials,packs,gems,bosses}[tab]||home)();
 panelHost.querySelectorAll("[data-page]").forEach(el=>el.addEventListener("click",()=>switchTo(el.dataset.page)));
 const on=(id,fn)=>{const el=panelHost.querySelector("#"+id);if(el)el.addEventListener("change",()=>{fn(el.value);render()})};
 on("oh-tower",x=>{state.tower=x});on("oh-tower-floor",x=>{state.towerFloor=x});
 on("oh-trial",x=>{state.trial=x;state.trialFloor=cfg.trials[x].max});on("oh-trial-floor",x=>state.trialFloor=x);
 on("oh-portal",x=>state.portal=x);on("oh-portal-floor",x=>state.portalFloor=x);on("oh-portal-completes",x=>state.portalCompletes=x);
 on("oh-mat-mode",x=>state.matMode=x);on("oh-mat-start",x=>state.matStart=x);on("oh-mat-end",x=>state.matEnd=x);on("oh-mat-bountiful",x=>state.matBountiful=x);on("oh-mat-runs",x=>state.matRuns=x);
 on("oh-pack-entries",x=>state.packEntries=x);
 for(const [name] of cfg.packUpgrades)on("oh-pack-"+name,x=>state.packLevels[name]=x);
 on("oh-charm",x=>{state.charm=x;state.gemGrades=[]});
 panelHost.querySelectorAll("[data-gem-index]").forEach(el=>el.addEventListener("change",()=>{state.gemGrades[Number(el.dataset.gemIndex)]=el.value;render()}));
 on("oh-boss-clears",x=>state.bossClears=x);
}
nav.querySelectorAll(".oh-nav [data-page]").forEach(el=>el.addEventListener("click",()=>switchTo(el.dataset.page)));
render();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ready);else ready();
})();