/**
 * js/sidebar.js — 3-tab sidebar switcher
 *
 * Tabs: Refine · Optimize · History
 * Each tab delegates rendering to its module in tabs/.
 * Modules must be loaded before this file.
 */
(function () {

  /* ── Tab definitions ──────────────────────────────── */
  const TABS = [
    {
      id:    'optimize',
      label: 'Optimize',
      icon:  `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
                fill="currentColor" stroke="none">
                <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>
              </svg>`,
    },
    {
      id:    'history',
      label: 'Versions',
      icon:  `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>`,
      /* Dynamic badge: total history count */
      badge: () => (window.APP_DATA?.history ?? []).reduce((s, g) => s + g.items.length, 0),
    },
  ];

  /* ── Module lookup ────────────────────────────────── */
  function getModule(id) {
    const MAP = {
      optimize: window.TabOptimize,
      history:  window.TabHistory,
    };
    return MAP[id];
  }

  /* ── Render tab bar ───────────────────────────────── */
  function renderTabBar() {
    const bar = document.getElementById('sidebar-tab-bar');
    if (!bar) return;

    bar.innerHTML = TABS.map(t => {
      const badge = t.badge ? t.badge() : null;
      return `
        <button
          class="sidebar-tab relative flex flex-1 items-center justify-center gap-[5px]
                 px-1 py-2.5 text-[12px] font-medium whitespace-nowrap
                 transition-colors select-none"
          data-tab="${t.id}">
          <span class="tab-icon flex items-center shrink-0">${t.icon}</span>
          <span class="truncate">${t.label}</span>
          ${badge != null ? `<span class="sidebar-badge">${badge}</span>` : ''}
          <span class="sidebar-tab-indicator"></span>
        </button>`;
    }).join('');

    bar.querySelectorAll('.sidebar-tab').forEach(btn =>
      btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
  }

  /* ── Switch active tab ────────────────────────────── */
  function switchTab(id) {
    /* Update button active states */
    document.querySelectorAll('#sidebar-tab-bar .sidebar-tab').forEach(btn =>
      btn.classList.toggle('active', btn.dataset.tab === id));

    /* Render content via module */
    const content = document.getElementById('sidebar-content');
    const module  = getModule(id);
    if (!content || !module) return;

    content.innerHTML = module.render();
    if (typeof module.init === 'function') module.init();
  }

  /* ── Boot ─────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    renderTabBar();
    switchTab('optimize'); // default active tab
  });
})();
