/*RetailPulse - backend/src/routes/settings.routes.js*/
const router = require("express").Router();
const c = require("../controllers/settings.controller");
const { requireRole } = require("../middleware/auth");

router.get("/", c.get);
router.put("/", requireRole("admin"), c.update);
module.exports = router;