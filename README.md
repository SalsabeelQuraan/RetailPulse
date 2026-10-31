# RetailPulse

A full-stack **inventory & point-of-sale management system** for small retail stores. It covers the daily workflow end to end: ringing up sales, tracking stock movements, raising purchase orders to suppliers, and reviewing revenue and profit reports.

Built with **Node.js / Express**, **PostgreSQL**, and a **vanilla JavaScript** frontend styled with **Tailwind CSS**.

---

## Features

### Dashboard
- KPI cards: today's sales, orders today, active products, inventory value (at cost)
- 14-day sales trend chart (SVG)
- Top 5 products by stock value
- Recent transactions and a "Needs reordering" list with a one-click **Reorder** shortcut

### Products
- Full catalog management: add, edit, soft-delete (archive)
- Live margin preview while entering cost and price
- Search by name, SKU, or supplier; filter by category and stock status
- Stock level bars with Low Stock / Out of Stock badges

### Inventory
- Complete stock-movement history (Stock in / Stock out / Adjustment) with running balance
- Manual stock adjustments with a reason
- Search and filter, plus **CSV export**

### Sales (POS)
- Product grid with search, cart, quantity controls, and stock checks
- Promo codes, tax calculation, and payment methods (Cash, Card, QR Pay)
- Order history view

### Purchases
- Create purchase orders (defaults to the product's supplier and cost)
- Status workflow: `Draft → Ordered → Received` (or `Cancelled`)
- Marking an order as **Received** automatically adds the stock and logs the movement

### Reports (admin only)
- Weekly revenue and gross profit (4 or 8 weeks)
- Sales by category
- CSV export for both reports

### Settings
- Store name, contact email, currency (USD / JOD / EUR), sales tax rate
- Low-stock alert badge toggle

### Security and access control
- JWT authentication with bcrypt-hashed passwords
- Two roles: **admin** (full access) and **cashier** (sales and read-only views)
- Login rate limiting, CORS allow-list, and HTML escaping on all rendered user data

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | HTML, vanilla JavaScript (ES modules), Tailwind CSS (CDN), Material Symbols |
| Backend | Node.js, Express 5 |
| Database | PostgreSQL (`pg`) |
| Auth | JSON Web Tokens, `bcryptjs`, `express-rate-limit` |

---

## Project structure

```
RetailPulse/
├── backend/
│   ├── server.js
│   ├── createAdmin.js          # CLI script to create users
│   ├── .env.example
│   └── src/
│       ├── config/db.js        # PostgreSQL pool
│       ├── controllers/        # auth, products, inventory, sales, purchases, reports, settings, coupons
│       ├── routes/
│       ├── middleware/         # auth (JWT + roles), error handler
│       ├── utils/helpers.js    # transactions, stock movement helper
│       └── db/
│           ├── schema.sql
│           ├── seed.sql        # demo data
│           └── reset.sql
└── frontend/
    ├── login.html
    ├── dashboard.html
    ├── products.html
    ├── inventory.html
    ├── sales.html
    ├── purchases.html
    ├── reports.html
    ├── settings.html
    └── js/
        ├── layout.js           # sidebar, topbar, auth guard, shared helpers (RP)
        ├── data.js             # API client and data layer (DB)
        ├── ui.js               # shared UI components
        └── tailwind-config.js  # design tokens
```

---

## Getting started

### Prerequisites
- [Node.js](https://nodejs.org/) 18 or newer
- [PostgreSQL](https://www.postgresql.org/) 14 or newer

### 1. Clone the repository

```bash
git clone https://github.com/SalsabeelQuraan/RetailPulse.git
cd RetailPulse
```

### 2. Set up the database

```bash
psql -U postgres -c "CREATE DATABASE retailpulse;"
psql -U postgres -d retailpulse -f backend/src/db/schema.sql
psql -U postgres -d retailpulse -f backend/src/db/seed.sql
```

The seed script loads 24 demo products, 21 purchase orders, about 90 days of random sales history, stock movements, and sample promo codes.

> To start over, run `backend/src/db/reset.sql`, then `schema.sql` and `seed.sql` again. `reset.sql` does not drop the `users` table.

### 3. Configure the backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your own values:

```dotenv
PORT=3000
DATABASE_URL=postgres://USER:PASSWORD@localhost:5432/retailpulse
JWT_SECRET=put-a-long-random-string-here
CORS_ORIGIN=http://127.0.0.1:5500,http://localhost:5500
```

Generate a strong secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 4. Create a user

```bash
node createAdmin.js <username> <password> [admin|cashier]

# examples
node createAdmin.js admin YourStrongPassword admin
node createAdmin.js cashier1 AnotherPassword cashier
```

### 5. Run the backend

```bash
npm start
```

You should see `API on port 3000` and `DB connected`.

### 6. Run the frontend

The frontend must be served on port **5500** (it is the origin allowed by CORS). Either:

- Use the **Live Server** extension in VS Code and open `frontend/login.html`, or
- From the `frontend` folder run: `npx serve -l 5500`

Then open [http://localhost:5500/login.html](http://localhost:5500/login.html) and sign in.

> The API base URL (`http://localhost:3000`) is hardcoded in `frontend/js/data.js`, `frontend/login.html`, and `frontend/settings.html`. Change it there if you deploy the backend elsewhere.

---

## Roles and permissions

| Capability | Admin | Cashier |
|---|:---:|:---:|
| View dashboard, products, inventory, purchases | ✅ | ✅ |
| Ring up sales | ✅ | ✅ |
| Add / edit / delete products | ✅ | ❌ |
| Adjust stock | ✅ | ❌ |
| Create and manage purchase orders | ✅ | ❌ |
| View reports | ✅ | ❌ |
| Change settings | ✅ | ❌ |

Permissions are enforced on the **server** (`requireRole`), not just hidden in the UI.

---

## Demo promo codes

| Code | Discount | Notes |
|---|---|---|
| `SUMMER10` | 10% | no expiry |
| `WELCOME5` | 5% | no expiry |
| `VIP15` | 15% | valid for 180 days from seeding |
| `FLASH20` | 20% | intentionally expired (to test validation) |

---

## API overview

All routes except `/api/auth/login` require `Authorization: Bearer <token>`.

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/api/auth/login` | public | Sign in, returns JWT |
| GET | `/api/products` | any | List active products |
| POST / PUT / DELETE | `/api/products[/:sku]` | admin | Create, update, archive |
| GET | `/api/inventory` | any | Latest 200 stock movements |
| POST | `/api/inventory/adjust` | admin | Manual stock adjustment |
| GET | `/api/sales` | any | Latest 100 orders |
| GET | `/api/sales/daily` | any | Last 14 days of sales |
| GET | `/api/sales/today` | any | Today's sales and order count |
| POST | `/api/sales` | any | Record a sale |
| GET | `/api/purchases` | any | List purchase orders |
| POST | `/api/purchases` | admin | Create a draft PO |
| PATCH | `/api/purchases/:po/status` | admin | Place or cancel an order |
| PATCH | `/api/purchases/:po/receive` | admin | Receive an order (adds stock) |
| GET | `/api/reports/weekly?weeks=8` | admin | Weekly revenue and profit |
| GET | `/api/reports/categories?weeks=8` | admin | Sales by category |
| GET / PUT | `/api/settings` | any / admin | Read / update settings |
| GET | `/api/coupons/:code` | any | Validate a promo code |

---

## Design notes

- **Transactional stock updates.** Sales, receiving a PO, and adjustments run inside database transactions with row locks (`SELECT ... FOR UPDATE`), so stock can't go negative or be double-counted.
- **Deadlock avoidance.** Cart lines are sorted by SKU before locking.
- **Server-side pricing.** The server recalculates prices, discounts, tax, and profit from the database. It never trusts totals sent by the client.
- **Soft delete.** Deleting a product archives it (`is_active = false`) so sales and movement history stay intact. Re-adding the same SKU restores it.
- **Audit trail.** Every stock change is logged in `stock_movements` with type, quantity, resulting balance, reference, and user.
- **Timezone-aware reports.** Daily and weekly aggregations use `Asia/Amman` (configurable via `TZ` in `backend/src/utils/helpers.js`).

---

## Possible improvements

- Refund flow in the UI (refunds currently exist only in seed data)
- Daily sales summary email (the setting is present but disabled)
- Pagination for sales and movement history
- Automated tests and CI
- Docker Compose setup for one-command startup

---

## Author

**Salsabeel Quraan**
GitHub: [@SalsabeelQuraan](https://github.com/SalsabeelQuraan)

---

## License

This project is for educational and portfolio purposes.
