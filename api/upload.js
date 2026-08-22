const { requireAuth } = require('./_lib/auth');
const { getFile, putFile } = require('./_lib/github');

const ALLOWED_EXT = ['pdf', 'xlsx', 'xls', 'docx', 'doc', 'pptx', 'ppt'];

const DIACRITICS = new RegExp('[̀-ͯ]', 'g');

function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée.' });
    return;
  }

  const { filename, contentBase64 } = req.body || {};
  if (!filename || !contentBase64) {
    res.status(400).json({ error: 'filename et contentBase64 sont requis.' });
    return;
  }

  const ext = (filename.split('.').pop() || '').toLowerCase();
  if (!ALLOWED_EXT.includes(ext)) {
    res.status(400).json({ error: `Format non autorisé (.${ext}). Formats acceptés : ${ALLOWED_EXT.join(', ')}.` });
    return;
  }

  // ~4 Mo max : limite de taille de requête des fonctions serveur Vercel.
  const approxBytes = (contentBase64.length * 3) / 4;
  if (approxBytes > 4 * 1024 * 1024) {
    res.status(413).json({ error: 'Fichier trop volumineux (max ~4 Mo).' });
    return;
  }

  const base = slugify(filename.replace(/\.[^.]+$/, ''));
  const path = `documents/${base}-${Date.now().toString(36)}.${ext}`;

  try {
    const existing = await getFile(path).catch(() => null);
    await putFile(path, contentBase64, `Admin : ajoute le fichier ${filename}`, existing ? existing.sha : undefined);
    res.status(201).json({ ok: true, path });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Échec de l’envoi du fichier.' });
  }
};
