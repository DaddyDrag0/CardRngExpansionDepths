from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

old = """    const fmt=n=>Number.isFinite(Number(n))?Math.round(Number(n)).toLocaleString('en-US'):'?';
    const compactDbg=n=>Number.isFinite(Number(n))?Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:2}).format(Number(n)):'?';
    const side=t=>t==='Allies'?'PLAYER':'ENEMY';
"""
new = """    const fmt=n=>Number.isFinite(Number(n))?Math.round(Number(n)).toLocaleString('en-US'):'?';
    const compactDbg=n=>Number.isFinite(Number(n))?Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:2}).format(Number(n)).replace(/\\s/g,'').toLowerCase():'?';
    const compactText=value=>String(value??'').replace(/-?\\b\\d{4,}(?:\\.\\d+)?\\b/g,raw=>compactDbg(Number(raw)));
    const side=t=>t==='Allies'?'PLAYER':'ENEMY';
"""
if old not in s:
    raise SystemExit('compact debug formatter anchor missing')
s = s.replace(old, new, 1)

old = """    const turnParts=e=>{const m=String(e.detail||'').match(/^vs (.*?) \\| attacker (.*?) \\| defender (.*)$/);return m?{target:m[1],attacker:m[2],defender:m[3]}:null};
"""
new = """    const turnParts=e=>{const m=String(e.detail||'').match(/^vs (.*?) \\| attacker (.*?) \\| defender (.*)$/);return m?{target:m[1],attacker:compactText(m[2]),defender:compactText(m[3])}:null};
"""
if old not in s:
    raise SystemExit('turnParts anchor missing')
s = s.replace(old, new, 1)

old = """      return `<div class=\"dbg-event ${esc(e.type)}\"><div class=\"dbg-event-top\"><span class=\"dbg-type\">${esc(e.type.toUpperCase())}</span><span>${side(e.team)}</span></div><div class=\"dbg-event-title\"><b>${esc(e.card)}</b></div><div class=\"dbg-event-detail\">${esc(e.detail||'')}</div></div>`;
"""
new = """      return `<div class=\"dbg-event ${esc(e.type)}\"><div class=\"dbg-event-top\"><span class=\"dbg-type\">${esc(e.type.toUpperCase())}</span><span>${side(e.team)}</span></div><div class=\"dbg-event-title\"><b>${esc(e.card)}</b></div><div class=\"dbg-event-detail\">${esc(compactText(e.detail||''))}</div></div>`;
"""
if old not in s:
    raise SystemExit('event detail anchor missing')
s = s.replace(old, new, 1)

old = """      const addCards=(title,cards)=>{lines.push('',title);if(!cards?.length)lines.push('  None');else for(const c of cards)lines.push(`  ${c.name} [${c.ability||'No ability'}]`, `    HP ${fmt(c.hp)} / ${fmt(c.maxHp)} · ATK ${fmt(c.damage)} · Power ${fmt(c.power)}`)};
"""
new = """      const addCards=(title,cards)=>{lines.push('',title);if(!cards?.length)lines.push('  None');else for(const c of cards)lines.push(`  ${c.name} [${c.ability||'No ability'}]`, `    HP ${compactDbg(c.hp)} / ${compactDbg(c.maxHp)} · ATK ${compactDbg(c.damage)} · Power ${compactDbg(c.power)}`)};
"""
if old not in s:
    raise SystemExit('plain card stats anchor missing')
s = s.replace(old, new, 1)

old = """        else lines.push(`  [${e.type.toUpperCase()}] ${side(e.team)} · ${e.card}`,`    ${e.detail}`);
"""
new = """        else lines.push(`  [${e.type.toUpperCase()}] ${side(e.team)} · ${e.card}`,`    ${compactText(e.detail)}`);
"""
if old not in s:
    raise SystemExit('plain event detail anchor missing')
s = s.replace(old, new, 1)

p.write_text(s, encoding='utf-8')
print('Debug stat numbers now use compact lowercase notation.')
