const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.use(auth);

const num = (v) => (v === '' || v === null || v === undefined ? null : Number(v));

function parse(body) {
  const name = (body.name || '').trim();
  const sku = (body.sku || '').trim();
  if (!name) return { error: 'Name is required' };
  if (!sku) return { error: 'SKU is required' };
  const quantity = Number(body.quantity);
  if (!Number.isInteger(quantity) || quantity < 0)
    return { error: 'Quantity must be a whole number, 0 or more' };
  const cost = num(body.cost_price);
  const sell = num(body.selling_price);
  const thr = num(body.low_stock_threshold);
  if ([cost, sell].some((v) => v !== null && (isNaN(v) || v < 0)))
    return { error: 'Prices must be numbers, 0 or more' };
  if (thr !== null && (!Number.isInteger(thr) || thr < 0))
    return { error: 'Low stock threshold must be a whole number, 0 or more' };
  return { value: { name, sku, description: body.description || null, quantity, cost, sell, thr } };
}

const wrap = (fn) => (req, res) =>
  fn(req, res).catch((e) => {
    if (e.code === '23505') return res.status(409).json({ error: 'SKU already exists in your organization' });
    if (e.code === '22P02') return res.status(404).json({ error: 'Not found' });
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  });

router.get('/', wrap(async (req, res) => {
  const s = (req.query.search || '').trim();
  const r = await pool.query(
    `select p.*,
            coalesce(p.low_stock_threshold, o.default_low_stock_threshold) as effective_threshold,
            p.quantity <= coalesce(p.low_stock_threshold, o.default_low_stock_threshold) as is_low
     from products p join organizations o on o.id = p.organization_id
     where p.organization_id = $1
       and ($2::text = '' or p.name ilike '%' || $2::text || '%' or p.sku ilike '%' || $2::text || '%')
     order by p.created_at desc`,
    [req.user.orgId, s]
  );
  res.json(r.rows);
}));

router.get('/:id', wrap(async (req, res) => {
  const r = await pool.query(
    'select * from products where id=$1 and organization_id=$2',
    [req.params.id, req.user.orgId]
  );
  if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(r.rows[0]);
}));

router.post('/', wrap(async (req, res) => {
  const { error, value: v } = parse(req.body);
  if (error) return res.status(400).json({ error });
  const r = await pool.query(
    `insert into products
       (organization_id, name, sku, description, quantity, cost_price, selling_price, low_stock_threshold, last_updated_by)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *`,
    [req.user.orgId, v.name, v.sku, v.description, v.quantity, v.cost, v.sell, v.thr, req.user.id]
  );
  res.status(201).json(r.rows[0]);
}));

router.put('/:id', wrap(async (req, res) => {
  const { error, value: v } = parse(req.body);
  if (error) return res.status(400).json({ error });
  const r = await pool.query(
    `update products set name=$1, sku=$2, description=$3, quantity=$4, cost_price=$5,
            selling_price=$6, low_stock_threshold=$7, last_updated_by=$8, updated_at=now()
     where id=$9 and organization_id=$10 returning *`,
    [v.name, v.sku, v.description, v.quantity, v.cost, v.sell, v.thr, req.user.id, req.params.id, req.user.orgId]
  );
  if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(r.rows[0]);
}));

router.delete('/:id', wrap(async (req, res) => {
  const r = await pool.query(
    'delete from products where id=$1 and organization_id=$2',
    [req.params.id, req.user.orgId]
  );
  if (r.rowCount === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
}));

module.exports = router;