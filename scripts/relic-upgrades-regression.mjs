import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const data=JSON.parse(readFileSync('src/data/relic-upgrades.json','utf8'))
assert.deepEqual(data.grades,['Base','Platinum','Crystal','Ruby','Galaxy'])
assert.equal(data.maxLevel,4)
assert.equal(data.relics.length,8)
assert.equal(new Set(data.relics.map(r=>r.key)).size,8)
const expected={
  ChronoShard:[1,1.25,1.5,1.75,2],
  BountifulDelve:[25,30,35,40,50],
  LuckySurge:[25,30,35,40,50],
  TheDice:[100,125,175,225,300],
  PotionMaster:[50,60,70,80,100],
  Vicissitudes:[10,15,20,25,30],
  Quickdraw:[10,15,20,25,30],
  HeavyHand:[20,25,30,35,40],
}
for(const relic of data.relics){
  assert.deepEqual(relic.values,expected[relic.key],relic.key+' values mismatch')
  assert.equal(relic.recipes.length,4)
  for(const recipe of relic.recipes){
    assert.ok(Object.keys(recipe).length>0)
    for(const [material,amount] of Object.entries(recipe)){
      assert.ok(material.length>1)
      assert.ok(Number.isInteger(amount)&&amount>0)
    }
  }
}
const relic=id=>data.relics.find(r=>r.key===id)
assert.deepEqual(relic('ChronoShard').recipes[0],{'Speed Potion III':25,'Structure Coin':15})
assert.deepEqual(relic('ChronoShard').recipes[3],{'Divine Potion':50,'Gold Structure Coin':20})
assert.deepEqual(relic('BountifulDelve').recipes[3],{'Jackpot Potion':1000,'Rare Weather Potion':50,'Weather Token':20})
assert.deepEqual(relic('LuckySurge').recipes[3],{'Divine Potion':75,'Jackpot Potion':750})
assert.deepEqual(relic('TheDice').recipes[3],{'Jackpot Potion':700,'Gold Structure Coin':25})
assert.deepEqual(relic('PotionMaster').recipes[3],{'Divine Potion':225,'Mutation Potion':125,'Gold Structure Coin':50})
assert.deepEqual(relic('Vicissitudes').recipes[3],{'Rare Weather Potion':30,'Weather Token':25})
assert.deepEqual(relic('Quickdraw').recipes[3],{'Gold Structure Coin':15,'Legendary Speed Potion':300})
assert.deepEqual(relic('HeavyHand').recipes[3],{'Divine Potion':25,'Gold Structure Coin':10,'Elixir':300})
const costs=(relic,start,target)=>relic.recipes.slice(start,target).reduce((out,recipe)=>{
  for(const [k,v] of Object.entries(recipe))out[k]=(out[k]||0)+v
  return out
},{})
assert.deepEqual(costs(relic('ChronoShard'),0,2),{
  'Speed Potion III':25,'Structure Coin':15,'Legendary Speed Potion':50,'Divine Potion':25,
})
assert.deepEqual(costs(relic('TheDice'),4,4),{})
const page=readFileSync('relics.html','utf8')
const ui=readFileSync('src/relic-planner.js','utf8')
const css=readFileSync('src/relic-planner.css','utf8')
const depths=readFileSync('src/depths-ui.js','utf8')
const halloween=readFileSync('src/halloween-ui.js','utf8')
assert.match(page,/src\/data\/relic-upgrades.json|src\/relic-planner.js/)
assert.match(ui,/src\/data\/relic-upgrades.json/)
assert.match(ui,/localStorage/)
assert.match(ui,/relicCopy/)
assert.match(depths,/href="\.\/relics.html"/)
assert.match(halloween,/href="\.\/relics.html"/)
assert.match(css,/relic-grid/)
console.log('Relic planner regression passed: eight relics, 40 tier values, 32 recipes, total costs and UI links.')
