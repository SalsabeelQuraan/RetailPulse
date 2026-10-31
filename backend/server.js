/*RetailPulse - backend/server.js*/
require("dotenv").config();
for (const k of ["JWT_SECRET", "DATABASE_URL"])
    if (!process.env[k]) { console.error(`Missing ${k} in .env`); process.exit(1); }

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const pool = require("./src/config/db");
const { requireAuth, requireRole } = require("./src/middleware/auth");

const app = express();
const origins = (process.env.CORS_ORIGIN || "").split(",").map(s => s.trim()).filter(Boolean);
app.use(cors({ origin: origins.length ? origins : false }));
app.use(express.json({ limit: "100kb" }));

app.use("/api/auth/login", rateLimit({
    windowMs: 15 * 60 * 1000, limit: 10,
    skipSuccessfulRequests: true,
    message: { error: "Too many attempts, try again later" }
}));
app.use("/api/auth", require("./src/routes/auth.routes"));
app.use("/api", requireAuth);

app.use("/api/products", require("./src/routes/products.routes"));
app.use("/api/inventory", require("./src/routes/inventory.routes"));
app.use("/api/sales", require("./src/routes/sales.routes"));
app.use("/api/purchases", require("./src/routes/purchases.routes"));
app.use("/api/reports", requireRole("admin"), require("./src/routes/reports.routes"));
app.use("/api/settings", require("./src/routes/settings.routes"));
app.use("/api/coupons", require("./src/routes/coupons.routes"));
app.use((req, res) => res.status(404).json({ error: "Not found" }));
app.use(require("./src/middleware/errorHandler"));

pool.query("SELECT now()")
    .then(r => console.log("DB connected:", r.rows[0].now))
    .catch(e => console.error("DB connection failed:", e.message));

app.listen(process.env.PORT || 3000, () => console.log("API on port " + (process.env.PORT || 3000)));