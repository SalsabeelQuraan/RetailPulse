/*RetailPulse - backend/src/controllers/settings.controller.js*/
const pool = require("../config/db");
const { tx, httpError } = require("../utils/helpers");

const bool = v => String(v === true || v === "true");
const VALIDATORS = {
    tax_percent: v => {
        const n = Number(v);
        if (!Number.isFinite(n) || n < 0 || n > 100) throw httpError(400, "Invalid tax");
        return String(n);
    },
    store_name: v => {
        const s = String(v ?? "").trim();
        if (!s || s.length > 80) throw httpError(400, "Store name must be 1-80 characters");
        return s;
    },
    email: v => {
        const s = String(v ?? "").trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) || s.length > 120) throw httpError(400, "Invalid email");
        return s;
    },
    currency: v => {
        if (!["USD", "JOD", "EUR"].includes(v)) throw httpError(400, "Unsupported currency");
        return v;
    },
    low_stock_alerts: bool,
    daily_summary: bool
};

const readAll = async db => {
    const { rows } = await db.query("SELECT key, value FROM settings");
    return Object.fromEntries(rows.map(r => [r.key, r.value]));
};

exports.get = async (req, res, next) => {
    try { res.json(await readAll(pool)); } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
    try {
        const entries = Object.entries(req.body ?? {});
        if (!entries.length) throw httpError(400, "Nothing to update");
        const out = await tx(async c => {
            for (const [key, val] of entries) {
                if (!VALIDATORS[key]) throw httpError(400, `Unknown setting: ${key}`);
                await c.query(
                    `INSERT INTO settings (key, value) VALUES ($1, $2)
                     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
                    [key, VALIDATORS[key](val)]);
            }
            return readAll(c);
        });
        res.json(out);
    } catch (e) { next(e); }
};