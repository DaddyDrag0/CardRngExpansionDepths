const DEFAULT_ORIGIN = 'https://daddydrag0.github.io';

function cors(origin, allowedOrigin) {
  const allowed = allowedOrigin || DEFAULT_ORIGIN;
  const value = origin === allowed ? origin : allowed;
  return {
    'access-control-allow-origin': value,
    'access-control-allow-methods': 'POST, OPTIONS',
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

export default {
  async fetch(request, env) {
    const origin = request.headers.get('origin') || '';
    const allowedOrigin = env.ALLOWED_ORIGIN || DEFAULT_ORIGIN;
    const headers = cors(origin, allowedOrigin);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, headers);
    if (origin && origin !== allowedOrigin) return json({ error: 'Origin not allowed' }, 403, headers);
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

    const discordResponse = await fetch(env.DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        username: 'Depths Calculator Feedback',
        allowed_mentions: { parse: [] },
        embeds: [{
          title: category,
          description: message,
          fields: [
            { name: 'View', value: view || 'Unknown', inline: true },
            { name: 'Version', value: version, inline: true },
            { name: 'Page', value: page || 'Unknown' },
          ],
          timestamp: new Date().toISOString(),
        }],
      }),
    });

    if (!discordResponse.ok) {
      return json({ error: 'Discord delivery failed' }, 502, headers);
    }
    return json({ ok: true }, 200, headers);
  },
};
