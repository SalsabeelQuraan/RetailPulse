/*RetailPulse - frontend/js/ui.js*/
window.UI = {
    $: (s, r = document) => r.querySelector(s),
    STATUS: {
        "In Stock": "bg-secondary-container/40 text-on-secondary-container",
        "Low Stock": "bg-tertiary-fixed text-on-tertiary-fixed-variant",
        "Out of Stock": "bg-error-container text-on-error-container",
        Completed: "bg-secondary-container/40 text-on-secondary-container",
        Refunded: "bg-error-container text-on-error-container"
    },
    badge: label => `<span class="px-2.5 py-1 rounded-full font-label-sm text-label-sm ${UI.STATUS[label] || ""}">${RP.esc(label)}</span>`,
      kpi: (label, value, icon, note = "") => `<div class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex items-center justify-between">
        <div><span class="font-label-md text-on-surface-variant">${label}</span><p class="font-headline-lg text-headline-lg font-bold tabular-nums">${value}</p>
        ${note ? `<span class="font-body-sm text-on-surface-variant">${note}</span>` : ""}</div>
        <span class="material-symbols-outlined text-primary-container bg-surface-container-high rounded-xl p-2">${icon}</span></div>`,
    header: (title, sub, actions = "") => `<div class="flex items-end justify-between flex-wrap gap-space-md">
        <div><h1 class="font-headline-lg text-headline-lg font-bold">${title}</h1><p class="text-on-surface-variant">${sub}</p></div>${actions}</div>`,
    btn: "flex items-center gap-2 bg-primary-container text-on-primary px-space-lg py-2.5 rounded-xl font-title-sm text-title-sm shadow-sm active:scale-95 transition",
    input: "h-10 px-space-md bg-surface-container-low rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-container",
    th: "px-space-md py-3 font-label-sm text-label-sm uppercase"
};