/*RetailPulse - backend/src/routes/products.routes.js*/
const router = require("express").Router();
const c = require("../controllers/products.controller");
const { requireRole } = require("../middleware/auth");

router.get("/", c.list);
router.post("/", requireRole("admin"), c.create);
router.delete("/:sku", requireRole("admin"), c.remove);
router.put("/:sku", requireRole("admin"), c.update);
module.exports = router;