import assert from 'node:assert/strict'
import worker from '../server/feedback-worker.mjs'

const allowedOrigin = 'https://daddydrag0.github.io'
const webhookUrl = 'https://discord.com/api/webhooks/123456789012345678/test-token'
const appUrl = 'https://daddydrag0.github.io/CardRngExpansionDepths/'
const env = {
  ALLOWED_ORIGIN: allowedOrigin,
  DISCORD_WEBHOOK_URL: webhookUrl,
  APP_URL: appUrl,
}

let uploadedFile = null
let uploadedFilename = ''
let patchedEmbed = null

const originalFetch = globalThis.fetch
globalThis.fetch = async (input, init = {}) => {
  const url = String(input)

  if (url.startsWith(webhookUrl) && init.method === 'POST' && init.body instanceof FormData) {
    const payload = JSON.parse(String(init.body.get('payload_json')))
    assert.equal(payload.username, 'Depths Calculator Feedback')
    uploadedFile = init.body.get('files[0]')
    assert(uploadedFile)
    uploadedFilename = uploadedFile.name
    assert.match(uploadedFilename, /^snapshot-[a-f0-9]{32}\.json\.gz$/)
    return Response.json({
      id: '1550000000000000000',
      attachments: [{ filename: uploadedFilename, url: 'https://cdn.example/snapshot.gz' }],
    })
  }

  if (url === webhookUrl + '/messages/1550000000000000000' && init.method === 'PATCH') {
    const payload = JSON.parse(String(init.body))
    patchedEmbed = payload.embeds?.[0] || null
    return Response.json({ ok: true })
  }

  if (url === webhookUrl + '/messages/1550000000000000000' && (!init.method || init.method === 'GET')) {
    return Response.json({
      id: '1550000000000000000',
      attachments: [{ filename: uploadedFilename, url: 'https://cdn.example/snapshot.gz' }],
    })
  }

  if (url === 'https://cdn.example/snapshot.gz') {
    assert(uploadedFile)
    return new Response(await uploadedFile.arrayBuffer(), {
      status: 200,
      headers: { 'content-type': 'application/gzip' },
    })
  }

  throw new Error('Unexpected fetch in snapshot test: ' + url)
}

try {
  const snapshot = {
    v: 1,
    capturedAt: '2026-09-19T12:00:00.000Z',
    appVersion: 'test-version',
    theme: 'scarlet',
    viewport: { scrollX: 0, scrollY: 456, width: 1920, height: 1080 },
    state: {
      activeTeam: 2,
      startFloor: 1234,
      teams: [{
        cards: [{ cardName: 'Julius', borders: ['Galaxy'], mutationWeather: '' }],
        result: {
          estimatedFloorLow: 1200,
          estimatedFloorHigh: 1400,
          runs: [{
            deathFloor: 1327,
            debug: {
              initialAllies: [],
              initialEnemies: [],
              finalAllies: [],
              finalEnemies: [],
              events: [{ turn: 1, type: 'ability', team: 'Allies', card: 'Julius', detail: 'test log' }],
              forcedStallResolutions: 0,
            },
          }],
        },
      }],
    },
  }

  const submit = await worker.fetch(new Request('https://worker.example/', {
    method: 'POST',
    headers: {
      origin: allowedOrigin,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      category: 'Does not work',
      message: 'Julius leader is not working',
      page: appUrl,
      view: 'Depths Calculator',
      version: 'test-version',
      snapshot,
    }),
  }), env)

  assert.equal(submit.status, 200)
  const submitBody = await submit.json()
  assert.equal(submitBody.ok, true)
  assert(submitBody.snapshotUrl)
  assert(patchedEmbed)
  const snapshotField = patchedEmbed.fields.find((field) => field.name === 'Snapshot')
  assert(snapshotField?.value.includes('Open exact calculator snapshot'))

  const snapshotKey = new URL(submitBody.snapshotUrl).searchParams.get('snapshot')
  assert(snapshotKey)
  assert.match(snapshotKey, /^1550000000000000000\.[a-f0-9]{32}$/)

  const restored = await worker.fetch(new Request(
    'https://worker.example/snapshot/' + encodeURIComponent(snapshotKey),
    { headers: { origin: allowedOrigin } },
  ), env)
  assert.equal(restored.status, 200)

  const compressedBytes = await restored.arrayBuffer()
  const decompressed = new Blob([compressedBytes])
    .stream()
    .pipeThrough(new DecompressionStream('gzip'))
  const restoredSnapshot = JSON.parse(await new Response(decompressed).text())
  assert.deepEqual(restoredSnapshot, snapshot)

  const badKey = '1550000000000000000.' + '0'.repeat(32)
  const rejected = await worker.fetch(new Request(
    'https://worker.example/snapshot/' + badKey,
    { headers: { origin: allowedOrigin } },
  ), env)
  assert.equal(rejected.status, 404)

  console.log('Feedback snapshot round-trip regression passed.')
} finally {
  globalThis.fetch = originalFetch
}
