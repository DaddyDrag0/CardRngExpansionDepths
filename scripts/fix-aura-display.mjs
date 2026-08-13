import fs from 'node:fs'

let css = fs.readFileSync('src/styles.css', 'utf8')
const staleCss = '/* Aura display cleanup: hide the raw STAT% placeholder copy and the separate value label. */\n.aura-desc{display:none!important}.aura-exact b{display:none!important}.aura-exact{margin-top:9px;padding-top:8px}.aura-exact br:first-of-type{display:none}'
const fixedCss = '/* Keep the obsolete raw aura description hidden, but allow the resolved values to render. */\n.aura-desc{display:none!important}.aura-exact{margin-top:9px;padding-top:8px}.aura-exact br:first-of-type{display:none}'
if (!css.includes(staleCss)) throw new Error('stale aura CSS rule not found')
fs.writeFileSync('src/styles.css', css.replace(staleCss, fixedCss))

let html = fs.readFileSync('index.html', 'utf8')
const oldScope = `  const boost=Number(aura.boostMult)||0,pack=AURA_PACK[aura.name],weather=AURA_WEATHER[aura.name],listed=(aura.boostedCards||[]).filter(Boolean),scopes=[];
  if(pack)scopes.push(\`${'${pack}'} Pack cards\`);
  if(weather)scopes.push(\`${'${weather}'} cards\`);
  for(const name of listed)if(!scopes.includes(name))scopes.push(name);
`
const newScope = `  const boost=Number(aura.boostMult)||0,pack=AURA_PACK[aura.name],weather=AURA_WEATHER[aura.name],listed=(aura.boostedCards||[]).filter(Boolean),scopes=[];
  if(pack)scopes.push(\`${'${pack}'} Pack\`);
  if(weather){
    const weatherCards=state.cards.filter(card=>!card.unobtainable&&card.weather===weather).map(card=>card.name).sort((a,b)=>a.localeCompare(b));
    if(weatherCards.length)scopes.push(...weatherCards);
    else scopes.push(\`${'${weather}'} cards\`);
  }
  for(const name of listed)if(!scopes.includes(name))scopes.push(name);
`
if (!html.includes(oldScope)) throw new Error('aura scope block not found')
html = html.replace(oldScope, newScope)
fs.writeFileSync('index.html', html)

console.log('Patched Stat Aura value visibility and weather card scopes.')
