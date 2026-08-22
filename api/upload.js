const { requireAuth } = require('./_lib/auth');
const { storageUpload } = require('./_lib/supabase');

const ALLOWED = {
  pdf: 'application/pdf',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls: 'application/vnd.ms-excel',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc: 'application/msword',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ppt: 'application/vnd.ms-powerpoint',
};

const DIACRITICS = new RegExp('[̀-ͯ]', 'g');

function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .replace(/[^a-z0-9]+/g, '-')
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
  const contentType = ALLOWED[ext];
  if (!contentType) {
    res.status(400).json({ error: `Format non autorisé (.${ext}). Formats acceptés : ${Object.keys(ALLOWED).join(', ')}.` });
    return;
  }

  // ~4 Mo max : limite de taille de requête des fonctions serveur Vercel.
  const approxBytes = (contentBase64.length * 3) / 4;
  if (approxBytes > 4 * 1024 * 1024) {
    res.status(413).json({ error: 'Fichier trop volumineux (max ~4 Mo, limite des fonctions serveur).' });
    return;
  }

  const base = slugify(filename.replace(/\.[^.]+$/, ''));
  const path = `${base}-${Date.now().toString(36)}.${ext}`;

  try {
    const buffer = Buffer.from(contentBase64, 'base64');
    const publicUrl = await storageUpload(path, buffer, contentType);
    res.status(201).json({ ok: true, path: publicUrl });
  } catch (err) {
    res.status(500).json({ error: err.message || "Échec de l'envoi du fichier." });
  }
};
