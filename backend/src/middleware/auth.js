/*RetailPulse - backend/src/middleware/auth.js*/
const jwt = require("jsonwebtoken");
const { httpError } = require("../utils/helpers");

exports.requireAuth = (req, res, next) => {
    const token = (req.headers.authorization || "").replace(/^Bearer /, "");
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch { next(httpError(401, "Unauthorized")); }
};

exports.requireRole = (...roles) => (req, res, next) =>
    roles.includes(req.user?.role) ? next() : next(httpError(403, "Forbidden"));