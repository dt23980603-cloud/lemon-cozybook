const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store'
};

async function ensureTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS guild_state (
      id TEXT PRIMARY KEY,
      state_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `).run();
}

export async function onRequestGet(context) {
  const { env } = context;
  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'D1 binding DB is not configured.' }), {
      status: 500,
      headers: JSON_HEADERS
    });
  }

  await ensureTable(env.DB);
  const row = await env.DB
    .prepare('SELECT state_json, updated_at FROM guild_state WHERE id = ?1')
    .bind('main')
    .first();

  if (!row) {
    return new Response(JSON.stringify({ exists: false, state: null, updatedAt: 0 }), {
      headers: JSON_HEADERS
    });
  }

  let state = null;
  try {
    state = JSON.parse(row.state_json);
  } catch (_) {
    state = null;
  }

  return new Response(JSON.stringify({
    exists: Boolean(state),
    state,
    updatedAt: Number(row.updated_at || 0)
  }), { headers: JSON_HEADERS });
}

export async function onRequestPut(context) {
  const { env, request } = context;
  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'D1 binding DB is not configured.' }), {
      status: 500,
      headers: JSON_HEADERS
    });
  }

  let body;
  try {
    body = await request.json();
  } catch (_) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body.' }), {
      status: 400,
      headers: JSON_HEADERS
    });
  }

  const state = body?.state;
  if (!state || !Array.isArray(state.members) || typeof state.checks !== 'object' || state.checks === null) {
    return new Response(JSON.stringify({ error: 'Invalid guild state.' }), {
      status: 400,
      headers: JSON_HEADERS
    });
  }

  await ensureTable(env.DB);
  const updatedAt = Date.now();
  const stateJson = JSON.stringify({
    members: state.members,
    checks: state.checks
  });

  await env.DB.prepare(`
    INSERT INTO guild_state (id, state_json, updated_at)
    VALUES (?1, ?2, ?3)
    ON CONFLICT(id) DO UPDATE SET
      state_json = excluded.state_json,
      updated_at = excluded.updated_at
  `).bind('main', stateJson, updatedAt).run();

  return new Response(JSON.stringify({ ok: true, updatedAt }), {
    headers: JSON_HEADERS
  });
}

export async function onRequest(context) {
  if (context.request.method === 'GET') return onRequestGet(context);
  if (context.request.method === 'PUT') return onRequestPut(context);

  return new Response(JSON.stringify({ error: 'Method not allowed.' }), {
    status: 405,
    headers: { ...JSON_HEADERS, allow: 'GET, PUT' }
  });
}
