-- RetailPulse - backend/src/db/schema.sql
CREATE SEQUENCE IF NOT EXISTS po_seq START 9025;

CREATE TABLE IF NOT EXISTS products (
    sku        VARCHAR(30) PRIMARY KEY,
    name       VARCHAR(120) NOT NULL,
    category   VARCHAR(60)  NOT NULL,
    cost       NUMERIC(10,2) NOT NULL CHECK (cost >= 0),
    price      NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    stock      INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    min_stock  INT NOT NULL DEFAULT 10,
    max_stock  INT NOT NULL DEFAULT 100,
    supplier   VARCHAR(120) DEFAULT '—',
    is_active  BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stock_movements (
    id         SERIAL PRIMARY KEY,
    sku        VARCHAR(30) NOT NULL REFERENCES products(sku),
    type       VARCHAR(12) NOT NULL CHECK (type IN ('IN','OUT','ADJUSTMENT')),
    qty        INT NOT NULL,
    balance    INT NOT NULL,
    ref        VARCHAR(60),
    by_user    VARCHAR(60) DEFAULT 'Admin',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sales (
    id         SERIAL PRIMARY KEY,
    customer   VARCHAR(120) DEFAULT 'Walk-in Customer',
    payment    VARCHAR(20) NOT NULL,
    items      INT NOT NULL,
    subtotal   NUMERIC(10,2) NOT NULL DEFAULT 0,
    discount   NUMERIC(10,2) NOT NULL DEFAULT 0,
    tax        NUMERIC(10,2) NOT NULL DEFAULT 0,
    total      NUMERIC(10,2) NOT NULL,
    profit     NUMERIC(10,2) NOT NULL DEFAULT 0,
    status     VARCHAR(20) NOT NULL DEFAULT 'Completed',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sale_lines (
    id       SERIAL PRIMARY KEY,
    sale_id  INT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    sku      VARCHAR(30) NOT NULL REFERENCES products(sku),
    qty      INT NOT NULL CHECK (qty > 0),
    price    NUMERIC(10,2) NOT NULL,
    cost     NUMERIC(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id         SERIAL PRIMARY KEY,
    po_number  VARCHAR(20) UNIQUE NOT NULL DEFAULT 'PO-' || nextval('po_seq'),
    supplier   VARCHAR(120) NOT NULL,
    sku        VARCHAR(30) REFERENCES products(sku),
    items      INT NOT NULL DEFAULT 0,
    total      NUMERIC(10,2) NOT NULL DEFAULT 0,
    status     VARCHAR(12) NOT NULL DEFAULT 'Draft'
                CHECK (status IN ('Draft','Ordered','Received','Cancelled')),
    order_date DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS settings (
    key   VARCHAR(40) PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS coupons (
    code       VARCHAR(30) PRIMARY KEY,
    rate       NUMERIC(4,3) NOT NULL CHECK (rate > 0 AND rate <= 0.5),
    active     BOOLEAN NOT NULL DEFAULT true,
    expires_at DATE
);

CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(40) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role          VARCHAR(10) NOT NULL DEFAULT 'cashier' CHECK (role IN ('admin','cashier'))
);

CREATE INDEX IF NOT EXISTS idx_sales_created      ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_movements_created  ON stock_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sale_lines_sale ON sale_lines(sale_id);
CREATE INDEX IF NOT EXISTS idx_movements_sku   ON stock_movements(sku);
CREATE INDEX IF NOT EXISTS idx_po_sku          ON purchase_orders(sku);