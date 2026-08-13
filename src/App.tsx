import { useMemo, useState } from 'react'
import cards from './data/cards'
import abilities from './data/abilities'
import auras from './data/auras'
import type { BorderName, TeamCard } from './types'
import { generateDepthsTeam, getDepthsPool } from './engine/depths'
import { getTeamCardStats } from './engine/stats'

const borders: BorderName[] = ['Platinum', 'Crystal', 'Ruby', 'Galaxy']
const preferred = ['Mastermind', 'Piccolo', 'Yamato no Orochi', 'Kuchisake-onna']

function compact(value: number) {
  return Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(value)
}

function full(value: number) {
  return Math.round(value).toLocaleString('en-US')
}

function assetUrl(assetId: number | null) {
  return assetId ? `https://www.roblox.com/asset-thumbnail/image?assetId=${assetId}&width=180&height=180&format=png` : ''
}

const initialTeam: TeamCard[] = preferred.map((cardName) => ({ cardName, borders: [] }))

export default function App() {
  const [team, setTeam] = useState<TeamCard[]>(initialTeam)
  const [activeSlot, setActiveSlot] = useState(0)
  const [query, setQuery] = useState('')
  const [floor, setFloor] = useState(1000)
  const [seed, setSeed] = useState(1000)
  const [aura, setAura] = useState('')

  const shownCards = useMemo(() => {
    const q = query.trim().toLowerCase()
    return cards
      .filter((card) => !card.unobtainable)
      .filter((card) => !q || card.name.toLowerCase().includes(q) || card.ability?.toLowerCase().includes(q))
      .sort((a, b) => b.rarity - a.rarity)
      .slice(0, 90)
  }, [query])

  const enemyTeam = useMemo(() => generateDepthsTeam(Math.max(1, floor), seed), [floor, seed])
  const poolSize = useMemo(() => getDepthsPool(Math.max(1, floor)).length, [floor])
  const selectedAura = auras.find((item) => item.name === aura)

  function chooseCard(cardName: string) {
    setTeam((old) => old.map((slot, index) => index === activeSlot ? { ...slot, cardName } : slot))
  }

  function toggleBorder(slotIndex: number, border: BorderName) {
    setTeam((old) => old.map((slot, index) => {
      if (index !== slotIndex) return slot
      const enabled = slot.borders.includes(border)
      return { ...slot, borders: enabled ? slot.borders.filter((item) => item !== border) : [...slot.borders, border] }
    }))
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="kicker">CARD RNG EXPANSION</p>
          <h1>Depths Observatory</h1>
        </div>
        <div className="build-state"><i /> Combat reconstruction in progress</div>
      </header>

      <section className="intro">
        <div>
          <span className="kicker">BUILD 0.1 · GAME-DERIVED FOUNDATION</span>
          <h2>Build an expedition. Inspect the Depths. Simulate it only when the combat engine is trustworthy.</h2>
          <p>This UI is intentionally its own design. The card database, base stats, borders, Depths scaling, eligibility rules and enemy weighting come from the Expansion place you provided.</p>
        </div>
        <div className="facts">
          <div><b>{cards.length}</b><span>cards</span></div>
          <div><b>{Object.keys(abilities).length}</b><span>abilities</span></div>
          <div><b>{auras.length}</b><span>auras</span></div>
        </div>
      </section>

      <section className="workspace">
        <article className="panel loadout">
          <div className="panel-head">
            <div><span className="kicker">EXPEDITION</span><h3>Four-card loadout</h3></div>
            <small>Select a slot, then a card</small>
          </div>
          <div className="team-list">
            {team.map((slot, index) => {
              const card = cards.find((item) => item.name === slot.cardName)!
              const stats = getTeamCardStats(card, slot)
              return (
                <button className={`team-row ${activeSlot === index ? 'active' : ''}`} onClick={() => setActiveSlot(index)} key={index}>
                  <span className="slot">0{index + 1}</span>
                  <span className="portrait">{card.imageAssetId ? <img src={assetUrl(card.imageAssetId)} alt="" /> : card.name[0]}</span>
                  <span className="card-copy">
                    <span className="name-line"><b>{card.name}</b><em>{card.ability || 'No ability'}</em></span>
                    <span className="numbers"><i><b>{compact(stats.health)}</b> HP</i><i><b>{compact(stats.attack)}</b> ATK</i></span>
                    <span className="border-pills" onClick={(event) => event.stopPropagation()}>
                      {borders.map((border) => <label className={slot.borders.includes(border) ? 'on' : ''} key={border}><input type="checkbox" checked={slot.borders.includes(border)} onChange={() => toggleBorder(index, border)} />{border}</label>)}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
          <div className="aura-select">
            <label>Aura card</label>
            <select value={aura} onChange={(event) => setAura(event.target.value)}>
              <option value="">No aura selected</option>
              {auras.filter((item) => !item.unobtainable).map((item) => <option key={item.name} value={item.name}>{item.name} · {item.skillName}</option>)}
            </select>
            <p>{selectedAura ? selectedAura.description : 'Aura data is extracted; its combat effect will be enabled as each aura hook is verified.'}</p>
          </div>
        </article>

        <article className="panel library">
          <div className="panel-head"><div><span className="kicker">LIBRARY</span><h3>Choose slot {activeSlot + 1}</h3></div></div>
          <input className="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search card or ability…" />
          <div className="library-list">
            {shownCards.map((card) => (
              <button className={team[activeSlot].cardName === card.name ? 'selected' : ''} key={card.name} onClick={() => chooseCard(card.name)}>
                <span className="mini-portrait">{card.imageAssetId ? <img src={assetUrl(card.imageAssetId)} alt="" /> : card.name[0]}</span>
                <span><b>{card.name}</b><small>{card.ability || 'No ability'}</small></span>
                <em>1 / {compact(card.rarity)}</em>
              </button>
            ))}
          </div>
        </article>

        <article className="panel depths">
          <div className="panel-head">
            <div><span className="kicker">DEPTHS LAB</span><h3>Enemy generator</h3></div>
            <strong className="verified">GAME-DERIVED</strong>
          </div>
          <div className="controls">
            <label><span>Floor</span><input type="number" min="1" value={floor} onChange={(event) => setFloor(Number(event.target.value) || 1)} /></label>
            <label><span>Preview seed</span><input type="number" value={seed} onChange={(event) => setSeed(Number(event.target.value) || 1)} /></label>
          </div>
          <div className="pool"><b>{poolSize}</b><span>eligible cards in the weighted pool</span></div>
          <div className="enemy-list">
            {enemyTeam.map((enemy, index) => (
              <div key={`${seed}-${index}`}>
                <span className="enemy-num">{index + 1}</span>
                <span className="mini-portrait">{enemy.card.imageAssetId ? <img src={assetUrl(enemy.card.imageAssetId)} alt="" /> : enemy.card.name[0]}</span>
                <span className="enemy-copy"><b>{enemy.card.name}</b><small>{enemy.card.ability || 'No ability'}</small></span>
                <span className="enemy-stats"><b>{full(enemy.health)} HP</b><small>{full(enemy.attack)} ATK</small></span>
              </div>
            ))}
          </div>
          <button className="reroll" onClick={() => setSeed((value) => value + 1)}>Generate another enemy team</button>
          <div className="locked">
            <div><strong>◆ Full-run results are locked for now</strong><p>The original server battle engine is being ported and checked against Expansion's abilities. I won't show fake average/median/peak floors while important combat hooks are still missing.</p></div>
            <button disabled>Run Depths simulation</button>
          </div>
        </article>
      </section>

      <footer><span>Expansion Skill Tree snapshot</span><span>Great · Mighty · Almighty intentionally excluded</span></footer>
    </main>
  )
}
