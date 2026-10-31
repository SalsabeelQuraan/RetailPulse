/*RetailPulse - backend/src/controllers/products.controller.js*/
const pool = require("../config/db");
const { tx, httpError } = require("../utils/helpers");

const COLS = `sku, name, category, cost::float, price::float, stock,
              min_stock AS min, max_stock AS max, supplier`;

exports.list = async (req, res, next) => {
    try {
        const { rows } = await pool.query(
            `SELECT ${COLS} FROM products WHERE is_active ORDER BY created_at DESC`);
        res.json(rows);
    } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
    try {
        const r = await pool.query(
            "UPDATE products SET is_active = false WHERE sku = $1 AND is_active", [req.params.sku]);
        if (!r.rowCount) return res.status(404).json({ error: "Not found" });
        res.status(204).end();
    } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
    try {
        const body = req.body ?? {};
        const by = req.user?.username || "System";
        for (const k of ["sku", "name", "category"])
            if (typeof body[k] !== "string" || !body[k].trim()) throw httpError(400, "Missing required fields");

        const sku = body.sku.trim(), name = body.name.trim(), category = body.category.trim();
        const supplier = String(body.supplier ?? "").trim() || "—";
        const cost = Number(body.cost), price = Number(body.price);
        const stock = Number(body.stock ?? 0), min = Number(body.min ?? 10);

        if (!/^[A-Za-z0-9-]{1,30}$/.test(sku)) throw httpError(400, "SKU: letters, digits, and dashes only (max 30)");
        if (name.length > 120) throw httpError(400, "Name is too long");
        if (category.length > 60) throw httpError(400, "Category is too long (max 60)");
        if (supplier.length > 120) throw httpError(400, "Supplier is too long (max 120)");
        if (!Number.isFinite(cost) || cost < 0) throw httpError(400, "Cost must be 0 or more");
        if (!Number.isFinite(price) || price < 0) throw httpError(400, "Price must be 0 or more");
        if (price < cost) throw httpError(400, "Price must not be lower than cost");
        if (!Number.isInteger(stock) || stock < 0) throw httpError(400, "Stock must be a whole number, 0 or more");
        if (!Number.isInteger(min) || min < 0) throw httpError(400, "Minimum must be a whole number, 0 or more");

        const max = Math.max(stock * 2, min * 2, 50);
        const product = await tx(async c => {
            const { rows: [old] } = await c.query(
                "SELECT stock, is_active FROM products WHERE sku = $1 FOR UPDATE", [sku]);
            if (old?.is_active) throw httpError(409, "This SKU already exists");

            if (old) {
                const { rows: [row] } = await c.query(
                    `UPDATE products SET name=$2, category=$3, cost=$4, price=$5, min_stock=$6, supplier=$7,
                            max_stock = GREATEST(max_stock, $6 * 2)
                    WHERE sku=$1 AND is_active RETURNING ${COLS}`
                    [sku, name, category, cost, price, stock, min, max, supplier]);
                if (stock !== old.stock)
                    await c.query(
                        "INSERT INTO stock_movements (sku, type, qty, balance, ref, by_user) VALUES ($1,'ADJUSTMENT',$2,$3,'Product restored',$4)",
                        [sku, stock - old.stock, stock, by]);
                return row;
            }

            const { rows: [row] } = await c.query(
                `INSERT INTO products (sku, name, category, cost, price, stock, min_stock, max_stock, supplier)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING ${COLS}`,
                [sku, name, category, cost, price, stock, min, max, supplier]);
            if (stock > 0)
                await c.query(
                    "INSERT INTO stock_movements (sku, type, qty, balance, ref, by_user) VALUES ($1,'IN',$2,$2,'Initial stock',$3)",
                    [sku, stock, by]);
            return row;
        });
        res.status(201).json(product);
    } catch (e) {
        if (e.code === "23505") return res.status(409).json({ error: "This SKU already exists" });
        next(e);
    }
};

exports.update = async (req, res, next) => {
    try {
        const b = req.body ?? {};
        const name = String(b.name ?? "").trim(), category = String(b.category ?? "").trim();
        const supplier = String(b.supplier ?? "").trim() || "—";
        const cost = Number(b.cost), price = Number(b.price), min = Number(b.min ?? 10);
        if (!name || !category) throw httpError(400, "Missing required fields");
        if (name.length > 120 || category.length > 60 || supplier.length > 120) throw httpError(400, "Text is too long");
        if (!Number.isFinite(cost) || cost < 0) throw httpError(400, "Cost must be 0 or more");
        if (!Number.isFinite(price) || price < cost) throw httpError(400, "Price must not be lower than cost");
        if (!Number.isInteger(min) || min < 0) throw httpError(400, "Minimum must be a whole number, 0 or more");
        const { rows: [row] } = await pool.query(
            `UPDATE products SET name=$2, category=$3, cost=$4, price=$5, min_stock=$6, supplier=$7
             WHERE sku=$1 AND is_active RETURNING ${COLS}`,
            [req.params.sku, name, category, cost, price, min, supplier]);
        if (!row) throw httpError(404, "Not found");
        res.json(row);
    } catch (e) { next(e); }
};