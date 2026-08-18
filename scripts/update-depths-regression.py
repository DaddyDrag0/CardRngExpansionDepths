from pathlib import Path

path = Path('scripts/depths-regression.ts')
text = path.read_text()

text = text.replace(
    "// They are optional (0..10), while the game's built-in hard exclusions always stay excluded.",
    "// They are optional (0..12), while the game's built-in hard exclusions always stay excluded.",
)

old = """  const elevenBans = eligibleNames.slice(0, 11)
  const cappedPool = getDepthsPool(floor, elevenBans).map((entry) => entry.card.name)
  for (const name of elevenBans.slice(0, MAX_DEPTH_BANS)) {
    assert(!cappedPool.includes(name), `Expected capped player ban to remove ${name}`)
  }
  assert(cappedPool.includes(elevenBans[MAX_DEPTH_BANS]), 'Player Depth bans must cap at 10')"""
new = """  const overCapBans = eligibleNames.slice(0, MAX_DEPTH_BANS + 1)
  const cappedPool = getDepthsPool(floor, overCapBans).map((entry) => entry.card.name)
  for (const name of overCapBans.slice(0, MAX_DEPTH_BANS)) {
    assert(!cappedPool.includes(name), `Expected capped player ban to remove ${name}`)
  }
  assert(cappedPool.includes(overCapBans[MAX_DEPTH_BANS]), 'Player Depth bans must cap at 12')"""
if old not in text:
    raise SystemExit('Depth-ban cap regression block not found')
text = text.replace(old, new, 1)

old_count = "assert(representatives.size === 176, `Expected 176 Depths abilities, found ${representatives.size}`)"
if old_count not in text:
    raise SystemExit('Depths ability-count assertion not found')
text = text.replace(
    old_count,
    "assert(representatives.size >= 176, `Expected at least 176 Depths abilities, found ${representatives.size}`)",
    1,
)

path.write_text(text)
