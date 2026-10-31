/*RetailPulse - backend/src/utils/helpers.js*/
const pool = require("../config/db");

const TZ = "Asia/Amman";
const httpError = (status, message) => Object.assign(new Error(message), { status });

async function tx(fn) {
    const c = await pool.connect();
    try {
        await c.query("BEGIN");
        const result = await fn(c);
        await c.query("COMMIT");
        return result;
    } catch (e) {
        await c.query("ROLLBACK");
        throw e;
    } finally {
        c.release();
    }
}

async function moveStock(c, { sku, delta, type, ref, by = "System" }) {
    const { rows } = await c.query(
        "UPDATE products SET stock = stock + $2 WHERE sku = $1 AND is_active RETURNING stock", [sku, delta]);
    if (!rows.length) throw httpError(404, `Unknown or archived SKU ${sku}`);
    await c.query(
        `INSERT INTO stock_movements (sku, type, qty, balance, ref, by_user) VALUES ($1,$2,$3,$4,$5,$6)`,
        [sku, type, delta, rows[0].stock, ref, by]);
    return rows[0].stock;
}

module.exports = { TZ, httpError, tx, moveStock };