import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';

const worker=readFileSync('browser/depths-worker.js','utf8');
const source=readFileSync('src/engine/battle-v2.ts','utf8');
const ui=readFileSync('src/depths-ui.js','utf8');
const css=readFileSync('src/depths-ui.css','utf8');

// Prove the normal and simulator engines share the Noveau-specific overflow rule.
assert(source.includes("next.definition.name === 'Noveau Riche'"),
 'TypeScript engine must model the dummy-tested Noveau exception');
assert(worker.includes('u.definition.name==="Noveau Riche"'),
 'Customized browser combat engine must model the Noveau exception');
assert(worker.includes('a.state.fallen[s].filter(c=>c.definition.name==="Noveau Riche")'),
 'Two Noveaus must remain protected even after one was previously defeated');

// Test actual deployed worker combat, not a reimplementation of the formula.
const instrumented=worker.replace(/\}\)\(\);\s*$/, 'self.__combat={Ee,Be};})();');
assert.notEqual(instrumented,worker, 'Failed to load deployed combat engine');
const self={navigator:{hardwareConcurrency:2},location:{href:'mock'},postMessage(){}};
new Function('self','performance',instrumented)(self,performance);
const {Ee,Be}=self.__combat;
const tri={cards:[{cardName:'Triceratops',borders:['Platinum','Crystal','Ruby','Galaxy'],mutationWeather:null}],statAura:null,abilityAura:null};
function simulate(enemies) {
 return Ee(tri,enemies.map(([name,hp=100])=>({card:Be(name),power:hp,health:hp,attack:1})),7,1,true,true);
}
const internCounter=(card)=>card.counters.interns||0;
const lone=simulate([['Wizard',1],['Noveau Riche',100]]);
assert.equal(lone.state.teams.Enemies.length,0,'Single rear Noveau must be pierced through and eliminated');
const deadNoveau=lone.state.fallen.Enemies.find(c=>c.definition.name==='Noveau Riche');
assert(deadNoveau,'Single rear Noveau must die from overkill');
assert.equal(internCounter(deadNoveau),0,'Single rear Noveau ignores all three-life protection on overkill');

const doubled=simulate([['Wizard',1],['Noveau Riche',100],['Noveau Riche',100]]);
const survivors=doubled.state.teams.Enemies.filter(c=>c.definition.name==='Noveau Riche');
assert.equal(survivors.length,2,'Both duplicate rear Noveaus must survive Horned Attack overflow');
assert(internCounter(survivors[0])>=1,'First rear Noveau must use its normal extra lives');
assert.equal(internCounter(survivors[1]),0,'Untouched second Noveau must retain both extra lives');
assert.equal(doubled.state.fallen.Enemies.filter(c=>c.definition.name==='Noveau Riche').length,0,
 'The second Noveau must not protect only itself while the first dies');
assert(doubled.debug.events.some(e=>String(e.detail).includes('Unpaid Interns activated')),
 'Combat replay must show extra lives activating in the duplicate case');
const front=simulate([['Noveau Riche',100]]);
assert(front.state.teams.Enemies.some(c=>c.definition.name==='Noveau Riche'&&internCounter(c)>=1),
 'Noveau in the actual front slot still requires multiple defeats');

// Persistence contract: saved key must match restored key, and typing saves
// even if user reloads without blurring the number input.
const persistence=ui.slice(ui.indexOf('  function persist(){'),ui.indexOf('  function restore(){'));
const restore=ui.slice(ui.indexOf('  function restore(){'),ui.indexOf('  function speedComparisonHtml(){'));
const gemInput=ui.slice(ui.indexOf("root.querySelector('#depthGemPveBonus')?.addEventListener('input'"));
assert(persistence.includes('gemPveBonus:state.redGemPveBonus'),'Red Gem bonus must be written to localStorage');
assert(restore.includes('Number(s.gemPveBonus??s.redGemPveBonus)'),'Red Gem bonus must read saved key and support legacy');
assert(gemInput.startsWith("root.querySelector('#depthGemPveBonus')?.addEventListener('input'"),'Save on input, not just blur');
assert(gemInput.slice(0,300).includes('persist()'),'Red Gem edits must persist immediately');
assert(css.includes('scrollbar-color: #3e6168 #141d26'),'Dark-theme scrollbar colors missing');
assert(css.includes('::-webkit-scrollbar-thumb'),'Chromium scrollbar styling missing');
console.log('Depths v40: Horned Attack one vs two Noveaus, normal front lives, persisted Red Gems and themed scrollbars passed.');
