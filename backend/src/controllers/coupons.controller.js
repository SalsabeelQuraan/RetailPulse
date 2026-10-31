/*RetailPulse - backend/src/controllers/coupons.controller.js*/
const pool = require("../config/db");

exports.check = async (req, res, next) => {
    try {
        const { rows: [cp] } = await pool.query(
            `SELECT code, rate::float AS rate FROM coupons
             WHERE code = $1 AND active AND (expires_at IS NULL OR expires_at >= CURRENT_DATE)`,
            [req.params.code.toUpperCase()]);
        if (!cp) return res.status(404).json({ error: "Invalid promo code" });
        res.json(cp);
    } catch (e) { next(e); }
};