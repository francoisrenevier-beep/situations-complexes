const { requireAuth } = require('./_lib/auth');
const { dbInsert, dbUpdate, dbDelete } = require('./_lib/supabase');

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

function toRow(body) {
  return {
    gt: body.gt,
    genre: body.genre,
    origine: body.origine,
    date: body.date || '',
    duree: body.duree || null,
    titre: body.titre.trim(),
    texte: body.texte || '',
    lien: body.lien.trim(),
  };
}

module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;

  if (req.method === 'GET') {
    // Sert uniquement à vérifier qu'une session valide existe (l'admin lit
    // les ressources publiques directement depuis Supabase).
    res.status(200).json({ ok: true });
    return;
  }

  try {
    if (req.method === 'POST') {
      const body = req.body || {};
      const errors = validate(body);
      if (errors.length) {
        res.status(400).json({ error: errors.join(' ') });
        return;
      }
      const id = `${slugify(body.gt)}-${slugify(body.titre)}-${Date.now().toString(36)}`;
      const resource = await dbInsert({ id, ...toRow(body) });
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
      const resource = await dbUpdate(body.id, toRow(body));
      if (!resource) {
        res.status(404).json({ error: 'Ressource introuvable.' });
        return;
      }
      res.status(200).json({ ok: true, resource });
      return;
    }

    if (req.method === 'DELETE') {
      const id = (req.body && req.body.id) || req.query.id;
      if (!id) {
        res.status(400).json({ error: 'id manquant.' });
        return;
      }
      const deleted = await dbDelete(id);
      if (!deleted) {
        res.status(404).json({ error: 'Ressource introuvable.' });
        return;
      }
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: 'Méthode non autorisée.' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Erreur serveur.' });
  }
};
