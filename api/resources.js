const { requireAuth } = require('./_lib/auth');
const { getFile, putFile } = require('./_lib/github');

const DATA_PATH = 'data/ressources.json';

const DIACRITICS = new RegExp('[̀-ͯ]', 'g');

function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function validate(body) {
  const errors = [];
  if (!body.gt) errors.push('Groupe de travail manquant.');
  if (!['document', 'video', 'presentation', 'lien'].includes(body.genre)) errors.push('Genre invalide.');
  if (!['gt', 'externe'].includes(body.origine)) errors.push('Origine invalide.');
  if (!body.titre || !body.titre.trim()) errors.push('Titre manquant.');
  if (!body.lien || !body.lien.trim()) errors.push('Lien manquant.');
  return errors;
}

module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;

  if (req.method === 'GET') {
    // Sert uniquement à vérifier qu'une session valide existe (l'admin lit
    // les ressources publiques directement depuis data/ressources.json).
    res.status(200).json({ ok: true });
    return;
  }

  try {
    const current = await getFile(DATA_PATH);
    if (!current) {
      res.status(500).json({ error: 'data/ressources.json introuvable dans le dépôt.' });
      return;
    }
    const data = JSON.parse(current.text);

    if (req.method === 'POST') {
      const body = req.body || {};
      const errors = validate(body);
      if (errors.length) {
        res.status(400).json({ error: errors.join(' ') });
        return;
      }
      const id = `${slugify(body.gt)}-${slugify(body.titre)}-${Date.now().toString(36)}`;
      const resource = {
        id,
        gt: body.gt,
        genre: body.genre,
        origine: body.origine,
        date: body.date || '',
        ...(body.duree ? { duree: body.duree } : {}),
        titre: body.titre.trim(),
        texte: body.texte || '',
        lien: body.lien.trim(),
      };
      data.ressources.push(resource);
      const content = Buffer.from(JSON.stringify(data, null, 2) + '\n').toString('base64');
      await putFile(DATA_PATH, content, `Admin : ajoute « ${resource.titre} »`, current.sha);
      res.status(201).json({ ok: true, resource });
      return;
    }

    if (req.method === 'PUT') {
      const body = req.body || {};
      if (!body.id) {
        res.status(400).json({ error: 'id manquant.' });
        return;
      }
      const errors = validate(body);
      if (errors.length) {
        res.status(400).json({ error: errors.join(' ') });
        return;
      }
      const idx = data.ressources.findIndex((r) => r.id === body.id);
      if (idx === -1) {
        res.status(404).json({ error: 'Ressource introuvable.' });
        return;
      }
      const resource = {
        id: body.id,
        gt: body.gt,
        genre: body.genre,
        origine: body.origine,
        date: body.date || '',
        ...(body.duree ? { duree: body.duree } : {}),
        titre: body.titre.trim(),
        texte: body.texte || '',
        lien: body.lien.trim(),
      };
      data.ressources[idx] = resource;
      const content = Buffer.from(JSON.stringify(data, null, 2) + '\n').toString('base64');
      await putFile(DATA_PATH, content, `Admin : modifie « ${resource.titre} »`, current.sha);
      res.status(200).json({ ok: true, resource });
      return;
    }

    if (req.method === 'DELETE') {
      const id = (req.body && req.body.id) || req.query.id;
      if (!id) {
        res.status(400).json({ error: 'id manquant.' });
        return;
      }
      const before = data.ressources.length;
      data.ressources = data.ressources.filter((r) => r.id !== id);
      if (data.ressources.length === before) {
        res.status(404).json({ error: 'Ressource introuvable.' });
        return;
      }
      const content = Buffer.from(JSON.stringify(data, null, 2) + '\n').toString('base64');
      await putFile(DATA_PATH, content, `Admin : supprime la ressource ${id}`, current.sha);
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: 'Méthode non autorisée.' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Erreur serveur.' });
  }
};
