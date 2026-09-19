const DEFAULT_ORIGIN = 'https://daddydrag0.github.io';
const DEFAULT_APP_URL = 'https://daddydrag0.github.io/CardRngExpansionDepths/';
const MAX_SNAPSHOT_JSON_BYTES = 32 * 1024 * 1024;
const MAX_SNAPSHOT_GZIP_BYTES = 8 * 1024 * 1024;

function cors(origin, allowedOrigin) {
  const allowed = allowedOrigin || DEFAULT_ORIGIN;
  const value = origin === allowed ? origin : allowed;
  return {
    'access-control-allow-origin': value,
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'vary': 'Origin',
  };
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'content-type': 'application/json; charset=utf-8' },
  });
}

function webhookBase(value) {
  const url = new URL(value);
  url.search = '';
  url.hash = '';
  return url.toString().replace(/\/+$/, '');
}

function webhookWaitUrl(value) {
  const url = new URL(value);
  url.searchParams.set('wait', 'true');
  return url.toString();
}

function safeAppUrl(value) {
  try {
    const url = new URL(value || DEFAULT_APP_URL);
    return url.toString();
  } catch {
    return DEFAULT_APP_URL;
  }
}

async function gzipSnapshot(snapshot) {
  const raw = new TextEncoder().encode(JSON.stringify(snapshot));
  if (raw.byteLength > MAX_SNAPSHOT_JSON_BYTES) {
    return { error: 'Snapshot exceeds the 32 MB raw limit' };
  }

  const compressed = new Blob([raw])
    .stream()
    .pipeThrough(new CompressionStream('gzip'));
  const bytes = await new Response(compressed).arrayBuffer();
  if (bytes.byteLength > MAX_SNAPSHOT_GZIP_BYTES) {
    return { error: 'Snapshot exceeds the 8 MB compressed limit' };
  }
  return {
    blob: new Blob([bytes], { type: 'application/gzip' }),
    rawBytes: raw.byteLength,
    compressedBytes: bytes.byteLength,
  };
}

async function fetchSnapshot(request, env, headers, snapshotKey) {
  if (!env.DISCORD_WEBHOOK_URL) return json({ error: 'Webhook is not configured' }, 503, headers);

  const match = /^([0-9]{10,30})\.([a-f0-9]{32})$/i.exec(snapshotKey);
  if (!match) return json({ error: 'Invalid snapshot link' }, 400, headers);
  const [, messageId, token] = match;

  const messageResponse = await fetch(`${webhookBase(env.DISCORD_WEBHOOK_URL)}/messages/${messageId}`, {
    method: 'GET',
  });
  if (!messageResponse.ok) return json({ error: 'Snapshot not found' }, 404, headers);

  const message = await messageResponse.json();
  const expectedName = `snapshot-${token}.json.gz`;
  const attachment = Array.isArray(message?.attachments)
    ? message.attachments.find((item) => item?.filename === expectedName)
    : null;
  if (!attachment?.url) return json({ error: 'Snapshot attachment not found' }, 404, headers);

  const attachmentResponse = await fetch(attachment.url, { cf: { cacheTtl: 0 } });
  if (!attachmentResponse.ok) return json({ error: 'Snapshot attachment unavailable' }, 502, headers);

  return new Response(attachmentResponse.body, {
    status: 200,
    headers: {
      ...headers,
      'content-type': 'application/json; charset=utf-8',
      'content-encoding': 'gzip',
      'cache-control': 'private, no-store, max-age=0',
      'x-content-type-options': 'nosniff',
    },
  });
}

export default {
  async fetch(request, env) {
    const requestUrl = new URL(request.url);
    const origin = request.headers.get('origin') || '';
    const allowedOrigin = env.ALLOWED_ORIGIN || DEFAULT_ORIGIN;
    const headers = cors(origin, allowedOrigin);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (origin && origin !== allowedOrigin) return json({ error: 'Origin not allowed' }, 403, headers);

    if (request.method === 'GET' && requestUrl.pathname.startsWith('/snapshot/')) {
      const key = decodeURIComponent(requestUrl.pathname.slice('/snapshot/'.length));
      return fetchSnapshot(request, env, headers, key);
    }

    if (request.method !== 'POST' || requestUrl.pathname !== '/') {
      return json({ error: 'Method not allowed' }, 405, headers);
    }
    if (!env.DISCORD_WEBHOOK_URL) return json({ error: 'Webhook is not configured' }, 503, headers);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON' }, 400, headers);
    }

    const category = String(body?.category || 'Other').trim().slice(0, 80);
    const message = String(body?.message || '').trim().slice(0, 1500);
    const page = String(body?.page || '').trim().slice(0, 500);
    const view = String(body?.view || '').trim().slice(0, 120);
    const version = String(body?.version || 'unknown').trim().slice(0, 80);
    if (!message) return json({ error: 'Message is required' }, 400, headers);

    const embed = {
      title: category,
      description: message,
      fields: [
        { name: 'View', value: view || 'Unknown', inline: true },
        { name: 'Version', value: version, inline: true },
        { name: 'Page', value: page || 'Unknown' },
      ],
      timestamp: new Date().toISOString(),
    };

    let snapshotToken = '';
    let snapshotUpload = null;
    if (body?.snapshot && typeof body.snapshot === 'object') {
      try {
        const compressed = await gzipSnapshot(body.snapshot);
        if (compressed.blob) {
          snapshotToken = crypto.randomUUID().replace(/-/g, '');
          snapshotUpload = compressed;
        } else if (compressed.error) {
          embed.fields.push({ name: 'Snapshot', value: compressed.error });
        }
      } catch (error) {
        embed.fields.push({ name: 'Snapshot', value: 'Snapshot capture failed before upload.' });
      }
    }

    const payload = {
      username: 'Depths Calculator Feedback',
      allowed_mentions: { parse: [] },
      embeds: [embed],
    };

    const form = new FormData();
    form.set('payload_json', JSON.stringify(payload));
    if (snapshotUpload && snapshotToken) {
      form.set(
        'files[0]',
        snapshotUpload.blob,
        `snapshot-${snapshotToken}.json.gz`,
      );
    }

    const discordResponse = await fetch(webhookWaitUrl(env.DISCORD_WEBHOOK_URL), {
      method: 'POST',
      body: form,
    });

    if (!discordResponse.ok) {
      return json({ error: 'Discord delivery failed' }, 502, headers);
    }

    let discordMessage = null;
    try {
      discordMessage = await discordResponse.json();
    } catch {}

    let snapshotUrl = '';
    if (snapshotToken && discordMessage?.id) {
      const snapshotKey = `${discordMessage.id}.${snapshotToken}`;
      const appUrl = new URL(safeAppUrl(env.APP_URL || DEFAULT_APP_URL));
      appUrl.searchParams.set('snapshot', snapshotKey);
      snapshotUrl = appUrl.toString();

      embed.fields.push({
        name: 'Snapshot',
        value: `[Open exact calculator snapshot](${snapshotUrl})`,
      });

      const patchResponse = await fetch(
        `${webhookBase(env.DISCORD_WEBHOOK_URL)}/messages/${discordMessage.id}`,
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ embeds: [embed] }),
        },
      );

      if (!patchResponse.ok) {
        await fetch(env.DISCORD_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            username: 'Depths Calculator Feedback',
            allowed_mentions: { parse: [] },
            content: `Snapshot for the report above: ${snapshotUrl}`,
          }),
        });
      }
    }

    return json({ ok: true, snapshotUrl: snapshotUrl || null }, 200, headers);
  },
};
