/*RetailPulse - backend/src/routes/purchases.routes.js*/
const router = require("express").Router();
const c = require("../controllers/purchases.controller");
const { requireRole } = require("../middleware/auth");

router.get("/", c.list);
router.post("/", requireRole("admin"), c.create);
router.patch("/:po/status", requireRole("admin"), c.setStatus);
router.patch("/:po/receive", requireRole("admin"), c.receive);
module.exports = router;