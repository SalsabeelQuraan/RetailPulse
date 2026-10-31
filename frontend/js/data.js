/*RetailPulse - frontend/js/data.js*/
(() => {
    const API = "http://localhost:3000/api";

    let TAX = 0.08;

    const db = { products: [], movements: [], sales: [], daily: [], purchases: [] };

    async function api(path, opts = {}) {
        const res = await RP.authFetch(API + path, {
            method: opts.method || "GET",
            body: opts.body ? JSON.stringify(opts.body) : undefined
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || "Request failed");
        }
        return res.status === 204 ? null : res.json();
    }

    const status = p => p.stock === 0 ? "Out of Stock" : p.stock <= p.min ? "Low Stock" : "In Stock";

    const DB = {
        get TAX() { return TAX; },
        status,
        checkCoupon: code => api("/coupons/" + encodeURIComponent(code)),
        async init(needs = ["products", "sales", "daily", "purchases", "todayStats", "movements"]) {
            const loaders = {
                products:   () => api("/products"),
                movements:  () => api("/inventory"),
                sales:      () => api("/sales"),
                daily:      () => api("/sales/daily"),
                purchases:  () => api("/purchases"),
                todayStats: () => api("/sales/today")
            };
            const [settings, ...results] = await Promise.all([
                api("/settings"),
                ...needs.map(k => loaders[k]())
            ]);
            TAX = (+settings.tax_percent || 0) / 100;

            try {
                const s = JSON.parse(localStorage.getItem("retailpulse.settings")) || {};
                s.currency = settings.currency || s.currency || "USD";
                localStorage.setItem("retailpulse.settings", JSON.stringify(s));
            } catch { /* ignore */ }

            needs.forEach((k, i) => db[k] = results[i]);
            if (db.products.length || needs.includes("products"))
                window.RP?.setLowCount(db.products.filter(p => status(p) !== "In Stock").length);
        },

        async boot(needs) {
            try { await DB.init(needs); } catch (e) { RP.fatal(e); throw e; }
        },
        get todayStats() { return db.todayStats; },

        get products() { return db.products; },
        get movements() { return db.movements; },
        get sales() { return db.sales; },
        get daily() { return db.daily; },
        get purchases() { return db.purchases; },

        find: sku => db.products.find(p => p.sku === sku),
        margin: p => p.price > 0 ? ((p.price - p.cost) / p.price) * 100 : 0,
        valuation: () => db.products.reduce((s, p) => s + p.cost * p.stock, 0),

        async addProduct(p) {
            const created = await api("/products", { method: "POST", body: p });
            db.products.unshift(created);
            return created;
        },

        async updateProduct(sku, p) {
            const updated = await api("/products/" + encodeURIComponent(sku), { method: "PUT", body: p });
            db.products = db.products.map(x => x.sku === sku ? updated : x);
            return updated;
        },

        async removeProduct(sku) {
            await api("/products/" + encodeURIComponent(sku), { method: "DELETE" });
            db.products = db.products.filter(p => p.sku !== sku);
        },

        adjustStock: body => api("/inventory/adjust", { method: "POST", body }),

        async recordSale(lines, { payment, coupon, customer }) {
            const sale = await api("/sales", {
                method: "POST",
                body: { lines: lines.map(([sku, qty]) => ({ sku, qty })), payment, coupon, customer }
            });
            await DB.init();
            return sale;
        },

        async createPO(body) {
            const po = await api("/purchases", { method: "POST", body });
            db.purchases.unshift(po);
            return po;
        },

        async receivePO(po) {
            await api(`/purchases/${encodeURIComponent(po)}/receive`, { method: "PATCH" });
            await DB.init();
        },

        async setPOStatus(po, status) {
            await api(`/purchases/${encodeURIComponent(po)}/status`, { method: "PATCH", body: { status } });
            await DB.init();
        },
        weekly: weeks => api("/reports/weekly?weeks=" + weeks),
        categories: weeks => api("/reports/categories?weeks=" + weeks)
    };

    window.DB = DB;
})();