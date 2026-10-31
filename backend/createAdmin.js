/*RetailPulse - backend/createAdmin.js*/
require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("./src/config/db");

(async () => {
    const [user, pass, role = "admin"] = process.argv.slice(2);
    if (!user || !pass) { console.log("Usage: node createAdmin.js <username> <password> [admin|cashier]"); return process.exit(1); }
    if (!["admin", "cashier"].includes(role)) { console.log("Role must be admin or cashier."); return process.exit(1); }
    await pool.query("INSERT INTO users (username, password_hash, role) VALUES ($1,$2,$3)",
        [user, await bcrypt.hash(pass, 12), role]);
    console.log(`${role} created`);
    await pool.end();
})();