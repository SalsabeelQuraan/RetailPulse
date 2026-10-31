/*RetailPulse - backend/src/routes/inventory.routes.js*/
const router = require("express").Router();
const c = require("../controllers/inventory.controller");
const { requireRole } = require("../middleware/auth");

router.get("/", c.list);
router.post("/adjust", requireRole("admin"), c.adjust);
module.exports = router;