-- RetailPulse - backend/src/db/reset.sql
DROP TABLE IF EXISTS sale_lines, sales, stock_movements, purchase_orders, products, settings, coupons CASCADE;
DROP SEQUENCE IF EXISTS po_seq;