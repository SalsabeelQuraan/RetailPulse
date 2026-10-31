/*RetailPulse - backend/src/routes/coupons.routes.js*/
const router = require("express").Router();
router.get("/:code", require("../controllers/coupons.controller").check);
module.exports = router;