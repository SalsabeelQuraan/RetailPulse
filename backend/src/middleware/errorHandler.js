/*RetailPulse - backend/src/middleware/errorHandler.js*/
const CHECK_MESSAGES = {
    products_stock_check:        [409, "Insufficient stock"],
    products_cost_check:         [400, "Cost must be 0 or more"],
    products_price_check:        [400, "Price must be 0 or more"],
    sale_lines_qty_check:        [400, "Invalid quantity"],
    stock_movements_type_check:  [400, "Invalid movement type"],
    purchase_orders_status_check:[400, "Invalid purchase order status"]
};

module.exports = (err, req, res, next) => {
    if (err.status) return res.status(err.status).json({ error: err.message });

    if (err.code === "23514") {
        const [status, msg] = CHECK_MESSAGES[err.constraint] || [400, "Invalid data"];
        return res.status(status).json({ error: msg });
    }
    if (err.code === "22P02") return res.status(400).json({ error: "Invalid value" });

    console.error(err);
    res.status(500).json({ error: "Server error" });
};