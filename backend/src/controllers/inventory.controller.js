/*RetailPulse - backend/src/controllers/inventory.controller.js*/
const pool = require("../config/db");
const { TZ, tx, moveStock, httpError } = require("../utils/helpers");

exports.adjust = async (req, res, next) => {
    try {
        const { sku, qty, reason } = req.body ?? {};
        const n = Number(qty);
        if (typeof sku !== "string" || !sku) throw httpError(400, "Product is required");
        if (!Number.isInteger(n) || n === 0) throw httpError(400, "Quantity must be a non-zero whole number");
        const ref = String(reason ?? "").trim().slice(0, 60) || "Manual adjustment";
        const balance = await tx(c => moveStock(c, { sku, delta: n, type: "ADJUSTMENT", ref, by: req.user?.username }));
        res.status(201).json({ balance });
    } catch (e) { next(e); }
};

exports.list = async (req, res, next) => {
    try {
        const { rows } = await pool.query(
        `SELECT 'MV-' || m.id AS id, m.sku, p.name AS product, m.type, m.qty, m.balance, m.ref, m.by_user AS by,
        to_char(m.created_at AT TIME ZONE '${TZ}', 'YYYY-MM-DD HH24:MI') AS at
            FROM stock_movements m JOIN products p ON p.sku = m.sku
            ORDER BY m.created_at DESC, m.id DESC LIMIT 200`);
        res.json(rows);
    } catch (e) { next(e); }
};

