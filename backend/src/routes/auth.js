const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const sign = (u) =>
  jwt.sign({ userId: u.id, orgId: u.organization_id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

router.post('/signup', async (req, res) => {
  const { email, password, organizationName } = req.body;
  if (!emailOk(email || '')) return res.status(400).json({ error: 'Enter a valid email' });
  if (!password || password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  if (!organizationName || !organizationName.trim())
    return res.status(400).json({ error: 'Organization name is required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const org = await client.query(
      'insert into organizations(name) values($1) returning id',
      [organizationName.trim()]
    );
    const hash = await bcrypt.hash(password, 10);
    const u = await client.query(
      'insert into users(email, password_hash, organization_id) values($1,$2,$3) returning id, email, organization_id',
      [email.toLowerCase(), hash, org.rows[0].id]
    );
    await client.query('COMMIT');
    res.json({ token: sign(u.rows[0]), user: { email: u.rows[0].email } });
  } catch (e) {
    await client.query('ROLLBACK');
    if (e.code === '23505') return res.status(409).json({ error: 'Email already registered' });
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const r = await pool.query(
      'select id, email, password_hash, organization_id from users where email=$1',
      [email.toLowerCase()]
    );
    const u = r.rows[0];
    if (!u || !(await bcrypt.compare(password, u.password_hash)))
      return res.status(401).json({ error: 'Wrong email or password' });
    res.json({ token: sign(u), user: { email: u.email } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;