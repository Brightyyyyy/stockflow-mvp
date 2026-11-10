const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/dashboard', auth, async (req, res) => {
  try {
    const totals = await pool.query(
      `select count(*)::int as total_products, coalesce(sum(quantity),0)::int as total_quantity
       from products where organization_id=$1`,
      [req.user.orgId]
    );
    const low = await pool.query(
      `select p.id, p.name, p.sku, p.quantity,
              coalesce(p.low_stock_threshold, o.default_low_stock_threshold) as threshold
       from products p join organizations o on o.id = p.organization_id
       where p.organization_id = $1
         and p.quantity <= coalesce(p.low_stock_threshold, o.default_low_stock_threshold)
       order by p.quantity asc`,
      [req.user.orgId]
    );
    res.json({
      totalProducts: totals.rows[0].total_products,
      totalQuantity: totals.rows[0].total_quantity,
      lowStock: low.rows,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/settings', auth, async (req, res) => {
  try {
    const r = await pool.query(
      'select default_low_stock_threshold from organizations where id=$1',
      [req.user.orgId]
    );
    res.json(r.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/settings', auth, async (req, res) => {
  const v = Number(req.body.default_low_stock_threshold);
  if (!Number.isInteger(v) || v < 0)
    return res.status(400).json({ error: 'Enter a whole number, 0 or more' });
  try {
    await pool.query(
      'update organizations set default_low_stock_threshold=$1 where id=$2',
      [v, req.user.orgId]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;