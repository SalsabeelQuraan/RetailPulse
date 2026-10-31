/*RetailPulse - frontend/js/layout.js*/
(() => {
    const TOKEN_KEY = "retailpulse.token", USER_KEY = "retailpulse.user";

    if (!localStorage.getItem(TOKEN_KEY)) {
        location.replace("login.html");
        window.RP = {
            isAdmin: false,
            esc: s => String(s ?? ""),
            authFetch: () => new Promise(() => {}),
            fatal() {}, setLowCount() {}, toast() {}
        };
        return;
    }

    const user = (() => { try { return JSON.parse(localStorage.getItem(USER_KEY)) || {}; } catch { return {}; } })();

    const NAV = [
        ["dashboard", "Dashboard", "dashboard"],
        ["products", "Products", "inventory_2"],
        ["inventory", "Inventory", "warehouse"],
        ["sales", "Sales", "point_of_sale"],
        ["purchases", "Purchases", "shopping_cart_checkout"],
        ["reports", "Reports", "analytics"],
        ["settings", "Settings", "settings"]
    ].filter(([id]) => id !== "reports" || user.role === "admin");

    const current = document.body.dataset.page;

    const alertsOn = () => { try { return JSON.parse(localStorage.getItem("retailpulse.settings"))?.lowStock !== false; } catch { return true; } };
    const lowCount = +localStorage.getItem("retailpulse.low") || 0;

    const navLink = ([id, label, icon]) => `
        <a href="${id}.html" ${id === current ? 'aria-current="page"' : ""}
        class="flex items-center gap-space-sm px-space-md py-space-sm rounded-xl transition-colors font-title-sm text-title-sm
        ${id === current ? "bg-primary-container text-on-primary" : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"}">
        <span class="material-symbols-outlined text-[20px]">${icon}</span>${label}</a>`;

    const sidebar = `
        <aside class="fixed left-0 top-0 h-screen w-64 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col justify-between">
        <div class="flex flex-col flex-1">
            <a href="dashboard.html" class="h-16 px-space-lg flex items-center gap-space-sm">
            <span class="w-8 h-8 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
                <span class="material-symbols-outlined text-[20px]">monitoring</span></span>
            <span class="font-title-md text-title-md font-bold tracking-tight">RetailPulse</span>
            </a>
            <nav class="flex-1 px-space-sm py-space-md flex flex-col gap-space-xs" aria-label="Main">${NAV.map(navLink).join("")}</nav>
        </div>
        <div class="p-space-md"><div class="bg-surface-container-low rounded-xl p-space-md flex items-center gap-space-sm">
            <span class="material-symbols-outlined text-secondary text-[20px]">wifi_tethering</span>
            <div class="flex flex-col"><span class="font-label-sm text-label-sm text-secondary font-bold">TERMINAL LIVE</span>
            <span class="font-body-sm text-body-sm text-on-surface-variant">POS Node #04</span></div></div></div>
        </aside>`;

    const topbar = `
        <header class="fixed top-0 left-64 right-0 h-16 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-space-lg">
        <div class="relative flex items-center">
            <span class="material-symbols-outlined absolute left-space-sm text-outline text-[18px]">search</span>
            <input type="search" placeholder="Search inventory, orders, SKU..." aria-label="Global search"
            class="w-80 h-10 pl-9 pr-4 bg-surface-container-lowest font-body-sm text-body-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-container"/>
        </div>
        <div class="flex items-center gap-space-md">
            <button id="bell" class="relative p-space-sm rounded-xl text-on-surface-variant hover:bg-surface-container-low" aria-label="Notifications">
            <span class="material-symbols-outlined text-[22px]">notifications</span>
            <span id="low-badge" class="${lowCount && alertsOn() ? "" : "hidden"} absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-error text-on-error font-label-sm text-[10px] flex items-center justify-center">${lowCount}</span></button>
            <div class="flex items-center gap-space-sm">
            <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center"><span class="material-symbols-outlined text-on-primary text-[18px]">person</span></div>
            <div class="flex flex-col"><span id="user-name" class="font-title-sm text-title-sm font-bold leading-tight"></span>
            <span id="user-role" class="font-body-sm text-body-sm text-on-surface-variant leading-tight"></span></div></div>
            <button id="logout" class="p-space-sm rounded-xl text-on-surface-variant hover:bg-surface-container-low hover:text-error" aria-label="Log out" title="Log out">
            <span class="material-symbols-outlined text-[22px]">logout</span></button>
        </div>
        </header>`;

    const shell = document.getElementById("app");
    document.body.insertAdjacentHTML("afterbegin", sidebar);
    shell.insertAdjacentHTML("afterbegin", topbar);

    document.getElementById("user-name").textContent = user.username || "User";
    document.getElementById("user-role").textContent = user.role ? user.role[0].toUpperCase() + user.role.slice(1) : "";
    document.getElementById("logout").addEventListener("click", () => RP.logout());
    document.getElementById("bell").addEventListener("click", () => location.href = "products.html?status=" + encodeURIComponent("Needs Reorder"));

    document.querySelector('header input[type="search"]').addEventListener("keydown", e => {
        if (e.key === "Enter" && e.target.value.trim())
            location.href = "products.html?q=" + encodeURIComponent(e.target.value.trim());
    });

    const currency = () => {
        try { return JSON.parse(localStorage.getItem("retailpulse.settings"))?.currency || "USD"; } catch { return "USD"; }
    };
    const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

    window.RP = {
        isAdmin: user.role === "admin",
        fmt: n => new Intl.NumberFormat("en-US", { style: "currency", currency: currency() }).format(n),

        esc: s => String(s ?? "").replace(/[&<>"']/g, c => ESC[c]),

        async authFetch(url, opts = {}) {
            const res = await fetch(url, {
                ...opts,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + localStorage.getItem(TOKEN_KEY),
                    ...opts.headers
                }
            });
            if (res.status === 401) { RP.logout(); throw new Error("Session expired"); }
            return res;
        },

        logout() {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            location.replace("login.html");
        },

        fatal(err) {
            const msg = err instanceof TypeError
                ? "Cannot reach the server. Is it running?"
                : (err?.message || "Something went wrong");
            const host = document.querySelector("main");
            if (!host) return;
            host.innerHTML = `<div role="alert" class="mt-space-xl bg-error-container text-on-error-container p-space-lg rounded-xl flex items-center justify-between gap-space-md">
                <div><p class="font-title-md text-title-md font-bold">Couldn't load this page</p><p>${RP.esc(msg)}</p></div>
                <button onclick="location.reload()" class="h-10 px-space-lg rounded-xl bg-error text-on-error font-title-sm">Retry</button></div>`;
        },

        setLowCount(n) {
            try { localStorage.setItem("retailpulse.low", n); } catch { /* ignore */ }
            const b = document.getElementById("low-badge");
            if (!b) return;
            b.textContent = n;
            b.classList.toggle("hidden", !n || !alertsOn());
        },

        toast(msg) {
            const t = document.createElement("div");
            t.setAttribute("role", "status");
            t.className = "fixed bottom-6 right-6 z-[100] text-white px-space-lg py-space-sm rounded-xl shadow-lg font-title-sm text-title-sm";
            t.style.backgroundColor = "#213145"; t.textContent = msg;
            document.body.appendChild(t); setTimeout(() => t.remove(), 2500);
        },

        download(name, rows) {
            const csv = "\uFEFF" + rows.map(r => r.map(c => `"${String(c).replaceAll('"', '""')}"`).join(",")).join("\n");
            const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
            const a = Object.assign(document.createElement("a"), { href: url, download: name });
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
    };
})();