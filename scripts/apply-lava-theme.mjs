import fs from 'node:fs'

function replaceOnce(text, from, to, label) {
  const count = text.split(from).length - 1
  if (count !== 1) throw new Error(`${label}: expected one anchor, found ${count}`)
  return text.replace(from, to)
}

{
  const path = 'index-base.html'
  let text = fs.readFileSync(path, 'utf8')
  text = replaceOnce(
    text,
    "const valid=new Set(['default','scarlet','slate']);",
    "const valid=new Set(['default','scarlet','slate','lava']);",
    'theme registry',
  )
  text = replaceOnce(
    text,
    "const colors={default:'#080b10',scarlet:'#080406',slate:'#14191f'};",
    "const colors={default:'#080b10',scarlet:'#080406',slate:'#14191f',lava:'#090202'};",
    'theme meta colors',
  )
  text = replaceOnce(
    text,
    '    <button class="theme-choice" type="button" data-theme-choice="slate" aria-pressed="false"><i></i>Slate</button>',
    '    <button class="theme-choice" type="button" data-theme-choice="slate" aria-pressed="false"><i></i>Slate</button>\n    <button class="theme-choice" type="button" data-theme-choice="lava" aria-pressed="false"><i></i>Lava</button>',
    'Lava theme button',
  )
  fs.writeFileSync(path, text)
}

{
  const path = 'index.html'
  let text = fs.readFileSync(path, 'utf8')
  text = replaceOnce(
    text,
    `      const rainTag='  <script defer src="./src/blood-rain.js?rev=5"></'+'script>\\n';\n      html=html.replace('</head>',rainTag+'</head>');`,
    `      const ambienceTags='  <script defer src="./src/blood-rain.js?rev=5"></'+'script>\\n'+'  <script defer src="./src/lava-ambience.js?rev=1"></'+'script>\\n';\n      html=html.replace('</head>',ambienceTags+'</head>');`,
    'ambient theme scripts',
  )
  fs.writeFileSync(path, text)
}

{
  const path = 'src/styles.css'
  let text = fs.readFileSync(path, 'utf8')
  text = replaceOnce(text, 'rotate(calc(var(--lava-rot) * .45))', 'rotate(var(--lava-rot1))', 'lava rotation 1')
  text = replaceOnce(text, 'rotate(var(--lava-rot))', 'rotate(var(--lava-rot2))', 'lava rotation 2')
  text = replaceOnce(text, 'rotate(calc(var(--lava-rot) * -.4))', 'rotate(var(--lava-rot3))', 'lava rotation 3')
  text = replaceOnce(text, 'calc(var(--bubble-travel) * .38)', 'var(--bubble-travel-38)', 'bubble travel 38')
  text = replaceOnce(text, 'calc(var(--bubble-travel) * .72)', 'var(--bubble-travel-72)', 'bubble travel 72')
  text = replaceOnce(text, 'calc(var(--bubble-drift) * .65)', 'var(--bubble-drift-mid)', 'bubble drift mid')
  fs.writeFileSync(path, text)
}

console.log('Integrated Lava into the selector, loader, and compatible animation variables.')
