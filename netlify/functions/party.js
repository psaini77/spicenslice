const { getStore } = require('@netlify/blobs');

function getPartyStore(){
  // Netlify normally injects the Blobs context automatically, but that
  // occasionally fails on fresh sites (a known Netlify platform issue). If
  // we've been given an explicit site ID + token via environment variables,
  // use those instead - this always works regardless of the auto-injection bug.
  if (process.env.BLOBS_SITE_ID && process.env.BLOBS_TOKEN) {
    return getStore({
      name: 'pickle-party',
      siteID: process.env.BLOBS_SITE_ID,
      token: process.env.BLOBS_TOKEN
    });
  }
  return getStore('pickle-party');
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  const code = ((event.queryStringParameters && event.queryStringParameters.code) || '')
    .trim().toUpperCase();

  if (!code) {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Missing ?code=' }) };
  }

  try {
    const store = getPartyStore();

    if (event.httpMethod === 'GET') {
      const data = await store.get(code, { type: 'json' });
      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(data || null) };
    }

    if (event.httpMethod === 'POST') {
      let payload;
      try {
        payload = JSON.parse(event.body || '{}');
      } catch (e) {
        return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Invalid JSON body' }) };
      }
      await store.setJSON(code, payload);
      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err) {
    console.error('party function error:', err);
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Storage error: ' + err.message }) };
  }
};
