/*RetailPulse - backend/src/config/db.js*/
require("dotenv").config();
const { Pool } = require("pg");
module.exports = new Pool({ connectionString: process.env.DATABASE_URL });