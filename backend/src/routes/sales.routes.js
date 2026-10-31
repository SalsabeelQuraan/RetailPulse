/*RetailPulse - backend/src/routes/sales.routes.js*/
const router = require("express").Router();
const c = require("../controllers/sales.controller");
router.get("/", c.list);
router.get("/daily", c.daily);
router.get("/today", c.today);
router.post("/", c.create);
module.exports = router;