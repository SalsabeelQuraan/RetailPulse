/*RetailPulse - backend/src/controllers/purchases.controller.js*/
const pool = require("../config/db");
const { tx, moveStock, httpError } = require("../utils/helpers");

const COLS = `po_number AS id, supplier, to_char(order_date, 'YYYY-MM-DD') AS date,
              sku, items, total::float, status`;

const NEXT = { Draft: ["Ordered", "Cancelled"], Ordered: ["Cancelled"] };

exports.create = async (req, res, next) => {
    try {
        const b = req.body ?? {};
        const { sku, supplier } = b;
        const items = Number(b.items);
        if (!sku) throw httpError(400, "Product is required");
        if (!Number.isInteger(items) || items <= 0) throw httpError(400, "Quantity must be a whole number above 0");

        const { rows: [p] } = await pool.query(
            "SELECT cost::float AS cost, supplier FROM products WHERE sku = $1 AND is_active", [sku]);
        if (!p) throw httpError(404, "Unknown product");

        const unit = b.unit_cost == null ? p.cost : Number(b.unit_cost);
        if (!Number.isFinite(unit) || unit < 0) throw httpError(400, "Invalid unit cost");

        const { rows } = await pool.query(
            `INSERT INTO purchase_orders (supplier, sku, items, total) VALUES ($1,$2,$3,$4) RETURNING ${COLS}`,
            [String(supplier || p.supplier).slice(0, 120), sku, items, Math.round(items * unit * 100) / 100]);
        res.status(201).json(rows[0]);
    } catch (e) { next(e); }
};

exports.setStatus = async (req, res, next) => {
    try {
        const to = req.body?.status;
        const po = await tx(async c => {
            const { rows: [o] } = await c.query(
                "SELECT id, status FROM purchase_orders WHERE po_number = $1 FOR UPDATE", [req.params.po]);
            if (!o) throw httpError(404, "Order not found");
            if (!NEXT[o.status]?.includes(to)) throw httpError(409, `Cannot change ${o.status} order to ${to}`);
            await c.query("UPDATE purchase_orders SET status = $1 WHERE id = $2", [to, o.id]);
            const { rows } = await c.query(`SELECT ${COLS} FROM purchase_orders WHERE id = $1`, [o.id]);
            return rows[0];
        });
        res.json(po);
    } catch (e) { next(e); }
};

exports.list = async (req, res, next) => {
    try {
        const { rows } = await pool.query(`SELECT ${COLS} FROM purchase_orders ORDER BY id DESC`);
        res.json(rows);
    } catch (e) { next(e); }
};

exports.receive = async (req, res, next) => {
    try {
        const po = await tx(async c => {
            const { rows: [o] } = await c.query(
                "SELECT id, po_number, sku, items, status FROM purchase_orders WHERE po_number = $1 FOR UPDATE",
                [req.params.po]);
            if (!o) throw httpError(404, "Order not found");
            if (o.status !== "Ordered") throw httpError(409, `Cannot receive a ${o.status} order`);
            await moveStock(c, { sku: o.sku, delta: o.items, type: "IN", ref: o.po_number, by: req.user?.username });
            await c.query("UPDATE purchase_orders SET status = 'Received' WHERE id = $1", [o.id]);
            const { rows } = await c.query(`SELECT ${COLS} FROM purchase_orders WHERE id = $1`, [o.id]);
            return rows[0];
        });
        res.json(po);
    } catch (e) { next(e); }
};