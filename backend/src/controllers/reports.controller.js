/*RetailPulse - backend/src/controllers/reports.controller.js*/
const pool = require("../config/db");
const { TZ } = require("../utils/helpers");
const weeksParam = req => Math.min(Math.max(parseInt(req.query.weeks) || 8, 1), 52);

exports.weekly = async (req, res, next) => {
    try {
        const { rows } = await pool.query(
        `WITH cur AS (SELECT date_trunc('week', now() AT TIME ZONE '${TZ}') AS w)
        SELECT to_char(g.w, 'Mon FMDD') AS label,
                COALESCE(SUM(s.subtotal - s.discount), 0)::float AS revenue,
                COALESCE(SUM(s.profit), 0)::float AS profit
        FROM cur, generate_series(cur.w - ($1::int - 1) * interval '1 week', cur.w, interval '1 week') AS g(w)
        LEFT JOIN sales s ON s.status = 'Completed'
                AND date_trunc('week', s.created_at AT TIME ZONE '${TZ}') = g.w
        GROUP BY g.w ORDER BY g.w`, [weeksParam(req)]);
        res.json(rows.map(r => [r.label, r.revenue, r.profit]));
    } catch (e) { next(e); }
};

exports.categories = async (req, res, next) => {
    try {
        const { rows } = await pool.query(
        `SELECT p.category,
                SUM(l.price * l.qty * (1 - s.discount / NULLIF(s.subtotal, 0)))::float AS total
        FROM sale_lines l
        JOIN sales s ON s.id = l.sale_id AND s.status = 'Completed'
        JOIN products p ON p.sku = l.sku
        WHERE date_trunc('week', s.created_at AT TIME ZONE '${TZ}')
              >= date_trunc('week', now() AT TIME ZONE '${TZ}') - ($1::int - 1) * interval '1 week'
        GROUP BY p.category ORDER BY total DESC`, [weeksParam(req)]);
        res.json(rows.map(r => [r.category, r.total]));
    } catch (e) { next(e); }
};