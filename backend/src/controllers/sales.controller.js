/*RetailPulse - backend/src/controllers/sales.controller.js*/
const pool = require("../config/db");
const { TZ, tx, moveStock, httpError } = require("../utils/helpers");
const r2 = n => Math.round(n * 100) / 100;
const PAYMENTS = ["Cash", "Card", "QR Pay"];

exports.list = async (req, res, next) => {
    try {
        const { rows } = await pool.query(
        `SELECT 'ORD-' || id AS id, customer, payment, status, items, total::float,
                to_char(created_at AT TIME ZONE '${TZ}', 'YYYY-MM-DD HH24:MI') AS at
        FROM sales ORDER BY created_at DESC, id DESC LIMIT 100`);
        res.json(rows);
    } catch (e) { next(e); }
};

exports.daily = async (req, res, next) => {
    try {
        const { rows } = await pool.query(
        `SELECT COALESCE(SUM(s.subtotal - s.discount) FILTER (WHERE s.status = 'Completed'), 0)::float AS v
        FROM generate_series(
                ((now() AT TIME ZONE '${TZ}')::date - 13)::timestamp,
                (now() AT TIME ZONE '${TZ}')::date::timestamp, interval '1 day') AS d
        LEFT JOIN sales s ON (s.created_at AT TIME ZONE '${TZ}')::date = d::date
        GROUP BY d ORDER BY d`);
        res.json(rows.map(r => r.v));
    } catch (e) { next(e); }
};

exports.today = async (req, res, next) => {
    try {
        const { rows: [r] } = await pool.query(
        `SELECT COALESCE(SUM(subtotal - discount) FILTER (WHERE status = 'Completed'), 0)::float AS sales,
                COUNT(*) FILTER (WHERE status = 'Completed')::int AS orders
        FROM sales
        WHERE (created_at AT TIME ZONE '${TZ}')::date = (now() AT TIME ZONE '${TZ}')::date`);
        res.json(r);
    } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
    try {
        const body = req.body ?? {};
        const { lines, coupon } = body;
        const payment = body.payment ?? "Cash";
        const customer = String(body.customer ?? "").trim().slice(0, 120) || "Walk-in Customer";
        const by = req.user?.username || "System";

        if (!PAYMENTS.includes(payment)) throw httpError(400, "Invalid payment method");
        if (!Array.isArray(lines) || !lines.length) throw httpError(400, "Cart is empty");
        if (lines.length > 100) throw httpError(400, "Too many lines");

        const merged = new Map();
        for (const l of lines) {
            if (typeof l?.sku !== "string" || !l.sku) throw httpError(400, "Invalid SKU");
            if (!Number.isInteger(l.qty) || l.qty <= 0) throw httpError(400, "Invalid quantity");
            merged.set(l.sku, (merged.get(l.sku) || 0) + l.qty);
        }
        const sorted = [...merged].sort(([a], [b]) => a.localeCompare(b)); // ترتيب ثابت لتجنب deadlock

        const sale = await tx(async c => {
            const { rows: [t] } = await c.query("SELECT value::float AS v FROM settings WHERE key = 'tax_percent'");
            const taxRate = (t?.v ?? 8) / 100;

            let rate = 0;
            if (coupon) {
                const { rows: [cp] } = await c.query(
                    `SELECT rate::float AS rate FROM coupons
                     WHERE code = $1 AND active AND (expires_at IS NULL OR expires_at >= CURRENT_DATE)`,
                    [String(coupon).trim().toUpperCase()]);
                if (!cp) throw httpError(400, "Invalid promo code");
                rate = cp.rate;
            }

            let subtotal = 0, cost = 0, items = 0;
            const priced = [];
            for (const [sku, qty] of sorted) {
                const { rows: [p] } = await c.query(
                    "SELECT sku, name, price::float, cost::float, stock FROM products WHERE sku = $1 AND is_active FOR UPDATE", [sku]);
                if (!p) throw httpError(404, `Unknown SKU ${sku}`);
                if (p.stock < qty) throw httpError(409, `Only ${p.stock} of ${p.name} in stock`);
                subtotal += p.price * qty; cost += p.cost * qty; items += qty;
                priced.push({ ...p, qty });
            }
            subtotal = r2(subtotal);
            const discount = r2(subtotal * rate);
            const tax = r2((subtotal - discount) * taxRate);
            const total = r2(subtotal - discount + tax);
            const profit = r2(subtotal - discount - cost);

            const { rows: [s] } = await c.query(
                `INSERT INTO sales (customer, payment, items, subtotal, discount, tax, total, profit)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
                [customer, payment, items, subtotal, discount, tax, total, profit]);
            const id = "ORD-" + s.id;
            for (const l of priced) {
                await c.query(
                    "INSERT INTO sale_lines (sale_id, sku, qty, price, cost) VALUES ($1,$2,$3,$4,$5)",
                    [s.id, l.sku, l.qty, l.price, l.cost]);
                await moveStock(c, { sku: l.sku, delta: -l.qty, type: "OUT", ref: id, by });
            }
            return { id, total };
        });
        res.status(201).json(sale);
    } catch (e) { next(e); }
};