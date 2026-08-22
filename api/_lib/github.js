const REPO = 'francoisrenevier-beep/situations-complexes';
const BRANCH = 'main';
const API = 'https://api.github.com';

function headers() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN manquant.');
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

// Lit un fichier du dépôt. Retourne { text, sha } ou null si absent.
async function getFile(path) {
  const res = await fetch(`${API}/repos/${REPO}/contents/${path}?ref=${BRANCH}`, {
    headers: headers(),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Lecture GitHub échouée (${res.status}) pour ${path}`);
  const json = await res.json();
  const text = Buffer.from(json.content, 'base64').toString('utf8');
  return { text, sha: json.sha };
}

// Écrit (crée ou met à jour) un fichier du dépôt.
// contentBase64: contenu déjà encodé en base64.
async function putFile(path, contentBase64, message, sha) {
  const res = await fetch(`${API}/repos/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      content: contentBase64,
      branch: BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Écriture GitHub échouée (${res.status}) pour ${path} : ${body}`);
  }
  return res.json();
}

async function deleteFile(path, message, sha) {
  const res = await fetch(`${API}/repos/${REPO}/contents/${path}`, {
    method: 'DELETE',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sha, branch: BRANCH }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Suppression GitHub échouée (${res.status}) pour ${path} : ${body}`);
  }
  return res.json();
}

module.exports = { getFile, putFile, deleteFile };
