/*RetailPulse - backend/src/controllers/auth.controller.js*/
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const { httpError } = require("../utils/helpers");

exports.login = async (req, res, next) => {
    try {
        const { username, password } = req.body ?? {};
        const { rows: [u] } = await pool.query(
            "SELECT id, username, password_hash, role FROM users WHERE username = $1",
            [String(username ?? "")]);
        if (!u || !(await bcrypt.compare(String(password ?? ""), u.password_hash)))
            throw httpError(401, "Wrong username or password");
        const token = jwt.sign(
            { id: u.id, username: u.username, role: u.role },
            process.env.JWT_SECRET,
            { expiresIn: "8h" });
        res.json({ token, user: { username: u.username, role: u.role } });
    } catch (e) { next(e); }
};