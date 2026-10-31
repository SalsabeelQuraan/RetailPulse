/*RetailPulse - backend/src/routes/reports.routes.js*/
const router = require("express").Router();
const c = require("../controllers/reports.controller");
router.get("/weekly", c.weekly);
router.get("/categories", c.categories);
module.exports = router;