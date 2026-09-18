/**
 * tabs/history.js — History tab: version list with dummy data
 *
 * Data comes from window.APP_DATA.history (data/constants.js).
 * Exposes: window.TabHistory { render(), init() }
 */
window.TabHistory = (function () {

  /* ── Badge ──────────────────────────────────────────── */
  const BADGE_CLASS = {
    OPTIMIZED: 'hist-badge hist-badge-optimized',
    REFINED:   'hist-badge hist-badge-refined',
    SAVED:     'hist-badge hist-badge-saved',
  };

  function badgeHTML(type) {
    const cls = BADGE_CLASS[type] ?? BADGE_CLASS.OPTIMIZED;
    return `<span class="${cls}">${type}</span>`;
  }

  /* ── Days-left pill ─────────────────────────────────── */
  function daysLeftHTML(item) {
    if (item.isPermanent) {
      return `<span class="text-[10px] font-semibold text-[#16a34a]">Permanent</span>`;
    }
    return `<span class="text-[10px] text-[#9ba3b8]">${item.daysLeft}</span>`;
  }

  /* ── Single history card ────────────────────────────── */
  function cardHTML(item) {
    return `
      <div class="hist-card" data-id="${item.id}">

        <!-- Title + badge -->
        <div class="flex items-start justify-between gap-2 mb-1">
          <span class="text-[12.5px] font-semibold text-[#343b4f] leading-tight">${item.title}</span>
          ${badgeHTML(item.type)}
        </div>

        <!-- Meta: timestamp + days left -->
        <div class="flex items-center justify-between mb-2.5">
          <div class="flex items-center gap-1 text-[10.5px] text-[#9ba3b8]">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            ${item.timestamp}
          </div>
          ${daysLeftHTML(item)}
        </div>

        <!-- Snippets -->
        <div class="flex flex-col gap-1.5">
          <div class="flex items-baseline gap-1.5">
            <span class="hist-snippet-label text-[#9ba3b8]">ORIGINAL</span>
            <span class="text-[11.5px] text-[#757b8d] truncate">${item.original}</span>
          </div>
          <div class="flex items-baseline gap-1.5">
            <span class="hist-snippet-label text-[#c23469]">ENHANCED</span>
            <span class="text-[11.5px] text-[#c23469] truncate">${item.enhanced}</span>
          </div>
        </div>
      </div>`;
  }

  /* ── Date group ─────────────────────────────────────── */
  function groupHTML(group) {
    return `
      <div>
        <p class="text-[9.5px] font-bold text-[#9ba3b8] tracking-[0.1em] uppercase mb-2 px-0.5">${group.group}</p>
        <div class="flex flex-col gap-2">
          ${group.items.map(cardHTML).join('')}
        </div>
      </div>`;
  }

  /* ── Total count across all groups ─────────────────── */
  function totalCount() {
    return (window.APP_DATA?.history ?? []).reduce((s, g) => s + g.items.length, 0);
  }

  /* ── render() ───────────────────────────────────────── */
  function render() {
    const data  = window.APP_DATA?.history ?? [];
    const count = totalCount();

    return `
      <div class="flex flex-col h-full overflow-hidden">

        <!-- Header bar -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-[#e0e3ed] shrink-0">
          <div class="flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                 fill="none" stroke="#c23469" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span class="text-[13px] font-semibold text-[#343b4f]">History</span>
            <span class="text-[11px] bg-[#f0f2f7] text-[#757b8d] rounded-full px-2 py-[1px] font-semibold leading-none">${count}</span>
          </div>
          <div class="flex items-center gap-0.5">
            <!-- Filter -->
            <button class="hist-icon-btn" title="Filter">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/>
                <line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/>
                <line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/>
                <line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/>
                <line x1="16" x2="16" y1="18" y2="22"/>
              </svg>
            </button>
            <!-- Refresh -->
            <button class="hist-icon-btn" title="Refresh">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5"/>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                <path d="M8 16H3v5"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Auto-delete warning banner -->
        <div class="flex items-start gap-2 px-4 py-2.5 bg-[#fffbf0] border-b border-[#fde68a] shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24"
               fill="none" stroke="#d97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
               class="shrink-0 mt-[1px]">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/>
          </svg>
          <p class="text-[11px] text-[#92400e] leading-[1.4]">
            Versions are auto-deleted after 3 days unless saved permanently.
          </p>
        </div>

        <!-- List -->
        <div class="flex-1 overflow-y-auto playground-scroll p-4 flex flex-col gap-4">
          ${data.length
            ? data.map(groupHTML).join('')
            : `<div class="flex flex-col items-center gap-3 py-12 text-center">
                 <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"
                      fill="none" stroke="#e0e3ed" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                   <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                 </svg>
                 <p class="text-[13px] font-medium text-[#343b4f]">No history yet</p>
                 <p class="text-[12px] text-[#9ba3b8]">Saved and optimized prompts will appear here.</p>
               </div>`}
        </div>
      </div>`;
  }

  /* ── init() ─────────────────────────────────────────── */
  function init() {
    /* Click a card to highlight it (future: load that version) */
    document.querySelectorAll('.hist-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.hist-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
      });
    });
  }

  return { render, init };
})();
