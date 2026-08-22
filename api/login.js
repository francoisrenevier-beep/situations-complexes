const crypto = require('crypto');
const { setSessionCookie } = require('./_lib/auth');

module.exports = (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée.' });
    return;
  }

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    res.status(500).json({ error: "ADMIN_PASSWORD n'est pas configuré sur le serveur." });
    return;
  }

  const submitted = (req.body && req.body.password) || '';
  const a = Buffer.from(String(submitted));
  const b = Buffer.from(String(expected));
  const match = a.length === b.length && crypto.timingSafeEqual(a, b);

  if (!match) {
    res.status(401).json({ error: 'Mot de passe incorrect.' });
    return;
  }

  setSessionCookie(res);
  res.status(200).json({ ok: true });
};
