const { clearSessionCookie } = require('./_lib/auth');

module.exports = (req, res) => {
  clearSessionCookie(res);
  res.status(200).json({ ok: true });
};
