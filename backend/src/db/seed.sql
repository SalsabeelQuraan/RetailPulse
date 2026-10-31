-- RetailPulse - backend/src/db/seed.sql
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM products) THEN
        RAISE EXCEPTION 'Seed already applied. Run reset.sql first.';
    END IF;
END $$;

INSERT INTO settings (key, value) VALUES
    ('tax_percent', '8'),
    ('store_name', 'RetailPulse Store'),
    ('email', 'admin@retailpulse.app'),
    ('currency', 'USD'),
    ('low_stock_alerts', 'true'),
    ('daily_summary', 'false');

INSERT INTO coupons (code, rate, active, expires_at) VALUES
    ('SUMMER10', 0.10, true, NULL),
    ('WELCOME5', 0.05, true, NULL),
    ('VIP15',    0.15, true, current_date + 180),
    ('FLASH20',  0.20, true, current_date - 30);

INSERT INTO products (sku, name, category, cost, price, stock, min_stock, max_stock, supplier) VALUES
('SK-EL-091','Wireless Mouse Pro','Electronics',14.50,29.99,142,20,200,'Logitech Global'),
('SK-EL-440','Anker PowerBank 10,000mAh','Electronics',19.80,39.99,45,10,80,'Anker Innovations'),
('SK-PW-033','65W GaN Fast Charger','Electronics',15.00,34.50,2,15,150,'Anker Innovations'),
('SK-EL-512','Bluetooth Speaker Mini','Electronics',18.00,44.99,37,12,90,'JBL Distribution'),
('SK-EL-603','Smart LED Desk Lamp','Electronics',12.50,29.90,54,10,80,'Xiaomi Trading'),
('SK-EL-715','4K Webcam','Electronics',38.00,79.99,18,8,60,'Logitech Global'),
('SK-EL-820','Portable SSD 1TB','Electronics',62.00,109.00,26,8,50,'Samsung Memory'),
('SK-AC-202','Braided USB-C Cable 2m','Accessories',4.20,12.50,88,20,150,'Belkin Connect'),
('SK-AC-819','Mechanical Keycap Set','Accessories',24.00,54.99,0,15,60,'Keychron Studio'),
('SK-AC-310','Laptop Sleeve 14"','Accessories',8.50,22.00,41,10,80,'Belkin Connect'),
('SK-AC-455','Aluminum Phone Stand','Accessories',5.20,15.99,73,15,120,'Ugreen Supply'),
('SK-AC-560','Screen Cleaning Kit','Accessories',2.10,7.50,96,20,150,'Belkin Connect'),
('SK-AC-677','Wireless Charging Pad','Accessories',9.80,24.99,8,12,100,'Anker Innovations'),
('SK-ST-104','A5 Dotted Notebook','Stationery',3.10,9.90,3,10,120,'Leuchtturm Labs'),
('SK-ST-110','Gel Pens 10-Pack','Stationery',5.50,14.25,62,15,120,'Nordic Paper Goods'),
('SK-ST-221','Sticky Notes Set','Stationery',1.80,5.99,130,25,200,'Nordic Paper Goods'),
('SK-ST-330','Wooden Desk Organizer','Stationery',11.00,27.50,22,8,60,'Nordic Paper Goods'),
('SK-ST-415','Highlighter Pack (6)','Stationery',2.40,6.99,0,20,150,'Nordic Paper Goods'),
('SK-AU-105','Studio ANC Headphones','Audio',62.00,119.00,9,5,40,'Studio Audio Ltd'),
('SK-AU-210','True Wireless Earbuds','Audio',24.00,59.99,48,10,80,'Studio Audio Ltd'),
('SK-AU-322','USB Condenser Microphone','Audio',33.00,69.00,15,6,40,'Studio Audio Ltd'),
('SK-GM-101','Gaming Mouse RGB','Gaming',16.00,39.99,33,10,70,'Razer Distribution'),
('SK-GM-205','Mechanical Keyboard 75%','Gaming',42.00,94.99,17,8,50,'Keychron Studio'),
('SK-GM-318','XL Gaming Mouse Pad','Gaming',6.00,18.99,64,15,100,'Razer Distribution');

INSERT INTO purchase_orders (po_number, supplier, sku, items, total, status, order_date)
SELECT v.po, p.supplier, v.sku, v.items, round(v.items * p.cost, 2), v.status, current_date - v.days
FROM (VALUES
    ('PO-9001','SK-EL-091',50,'Received',78),
    ('PO-9002','SK-AC-202',60,'Received',74),
    ('PO-9003','SK-ST-110',80,'Received',66),
    ('PO-9004','SK-EL-440',30,'Received',60),
    ('PO-9005','SK-AU-210',30,'Received',52),
    ('PO-9006','SK-GM-101',25,'Received',47),
    ('PO-9007','SK-AC-455',50,'Received',40),
    ('PO-9008','SK-ST-221',100,'Received',33),
    ('PO-9009','SK-EL-512',25,'Received',26),
    ('PO-9010','SK-GM-318',40,'Received',19),
    ('PO-9011','SK-EL-603',30,'Received',14),
    ('PO-9012','SK-AC-560',60,'Received',11),
    ('PO-9013','SK-PW-033',100,'Ordered',6),
    ('PO-9014','SK-ST-104',80,'Ordered',5),
    ('PO-9015','SK-AC-677',60,'Ordered',4),
    ('PO-9016','SK-AU-105',20,'Ordered',3),
    ('PO-9017','SK-AC-819',40,'Draft',2),
    ('PO-9018','SK-ST-415',100,'Draft',1),
    ('PO-9019','SK-EL-715',15,'Draft',0),
    ('PO-9020','SK-ST-104',80,'Cancelled',35),
    ('PO-9021','SK-GM-205',10,'Cancelled',28)
) AS v(po, sku, items, status, days)
JOIN products p ON p.sku = v.sku;

DO $$
DECLARE
    d INT; n INT; k INT; q INT; sid INT; qty_sum INT;
    p RECORD;
    sub NUMERIC; csum NUMERIC; rate NUMERIC; disc NUMERIC; tx NUMERIC;
    ts TIMESTAMPTZ;
    custs TEXT[] := ARRAY['Walk-in Customer','Walk-in Customer','Walk-in Customer','Walk-in Customer',
        'Elena Rostova','Markus Bennett','Sarah Cho','Omar Haddad','Lina Khoury','Yousef Nasser','Dana Aziz','Tariq Mansour'];
    pays TEXT[] := ARRAY['Card','Card','Card','Cash','Cash','QR Pay'];
BEGIN
    FOR d IN 0..89 LOOP
        FOR n IN 1..(3 + floor(random() * 6)::int) LOOP
            ts   := now() - make_interval(days => d, hours => floor(random() * 10)::int, mins => floor(random() * 60)::int);
            rate := CASE WHEN random() < 0.12 THEN 0.10 ELSE 0 END;

            INSERT INTO sales (customer, payment, items, total, created_at)
            VALUES (custs[1 + floor(random() * array_length(custs, 1))::int],
                    pays[1 + floor(random() * array_length(pays, 1))::int], 0, 0, ts)
            RETURNING id INTO sid;

            sub := 0; csum := 0; qty_sum := 0;
            k := 1 + floor(random() * 3)::int;
            FOR p IN SELECT sku, price, cost FROM products ORDER BY random() LIMIT k LOOP
                q := 1 + floor(random() * 3)::int;
                INSERT INTO sale_lines (sale_id, sku, qty, price, cost) VALUES (sid, p.sku, q, p.price, p.cost);
                sub := sub + p.price * q;
                csum := csum + p.cost * q;
                qty_sum := qty_sum + q;
            END LOOP;

            disc := round(sub * rate, 2);
            tx   := round((sub - disc) * 0.08, 2);
            UPDATE sales
               SET items = qty_sum, subtotal = sub, discount = disc, tax = tx,
                   total = sub - disc + tx, profit = sub - disc - csum
             WHERE id = sid;
        END LOOP;
    END LOOP;
END $$;

INSERT INTO sales (customer, payment, items, subtotal, discount, tax, total, profit, status, created_at) VALUES
('Sarah Cho','Card',2,0,0,0,-48.00,0,'Refunded', now() - interval '1 day 3 hours'),
('Omar Haddad','Cash',1,0,0,0,-29.99,0,'Refunded', now() - interval '4 days'),
('Lina Khoury','Card',1,0,0,0,-119.00,0,'Refunded', now() - interval '9 days'),
('Dana Aziz','QR Pay',3,0,0,0,-64.50,0,'Refunded', now() - interval '17 days'),
('Tariq Mansour','Card',1,0,0,0,-39.99,0,'Refunded', now() - interval '31 days');

INSERT INTO stock_movements (sku, type, qty, balance, ref, by_user, created_at)
WITH ev AS (
    SELECT l.sku, 'OUT' AS type, -l.qty AS qty, 'ORD-' || s.id AS ref, s.created_at AS at, s.id AS ord
      FROM sale_lines l JOIN sales s ON s.id = l.sale_id
    UNION ALL
    SELECT po.sku, 'IN', po.items, po.po_number,
           (po.order_date + 3)::timestamptz + interval '10 hours', 0
      FROM purchase_orders po WHERE po.status = 'Received'
    UNION ALL
    SELECT 'SK-ST-104', 'ADJUSTMENT', -2, 'Physical audit', now() - interval '20 days', 0
    UNION ALL
    SELECT 'SK-AC-560', 'ADJUSTMENT', -3, 'Damaged items', now() - interval '12 days', 0
    UNION ALL
    SELECT 'SK-EL-091', 'ADJUSTMENT', 2, 'Found in storage', now() - interval '8 days', 0
), opening AS (
    SELECT p.sku, p.stock - COALESCE((SELECT SUM(e.qty) FROM ev e WHERE e.sku = p.sku), 0) AS qty
      FROM products p
), all_ev AS (
    SELECT sku, 'IN' AS type, qty, 'Opening stock' AS ref, now() - interval '100 days' AS at, 0 AS ord
      FROM opening WHERE qty > 0
    UNION ALL
    SELECT sku, type, qty, ref, at, ord FROM ev
)
SELECT sku, type, qty,
       SUM(qty) OVER (PARTITION BY sku ORDER BY at, ord ROWS UNBOUNDED PRECEDING),
       ref,
       (ARRAY['Sarah M.','Kevin L.','Admin'])[1 + floor(random() * 3)::int],
       at
  FROM all_ev;