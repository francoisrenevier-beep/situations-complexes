const TABLE = 'ressources';
const BUCKET = 'documents';

function base() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquant(s) sur le serveur.');
  return { url: url.replace(/\/+$/, ''), key };
}

function dbHeaders(key, extra) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

async function dbInsert(row) {
  const { url, key } = base();
  const res = await fetch(`${url}/rest/v1/${TABLE}`, {
    method: 'POST',
    headers: dbHeaders(key, { Prefer: 'return=representation' }),
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error(`Insertion Supabase échouée (${res.status}) : ${await res.text()}`);
  const rows = await res.json();
  return rows[0];
}

async function dbUpdate(id, row) {
  const { url, key } = base();
  const res = await fetch(`${url}/rest/v1/${TABLE}?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: dbHeaders(key, { Prefer: 'return=representation' }),
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error(`Mise à jour Supabase échouée (${res.status}) : ${await res.text()}`);
  const rows = await res.json();
  return rows[0] || null;
}

async function dbDelete(id) {
  const { url, key } = base();
  const res = await fetch(`${url}/rest/v1/${TABLE}?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: dbHeaders(key, { Prefer: 'return=representation' }),
  });
  if (!res.ok) throw new Error(`Suppression Supabase échouée (${res.status}) : ${await res.text()}`);
  const rows = await res.json();
  return rows.length > 0;
}

// contentBuffer : Buffer contenant les octets bruts du fichier.
async function storageUpload(path, contentBuffer, contentType) {
  const { url, key } = base();
  const res = await fetch(`${url}/storage/v1/object/${BUCKET}/${path}`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': contentType || 'application/octet-stream',
      'x-upsert': 'true',
    },
    body: contentBuffer,
  });
  if (!res.ok) throw new Error(`Envoi du fichier échoué (${res.status}) : ${await res.text()}`);
  return `${url}/storage/v1/object/public/${BUCKET}/${path}`;
}

module.exports = { dbInsert, dbUpdate, dbDelete, storageUpload };
