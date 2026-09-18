/**
 * tabs/optimize.js — Optimize tab
 *
 * Layout:
 *   ┌─ Categories (3-col icon cards, ~half the panel) ──────┐
 *   ├─ Selected category description + use-case textarea ───┤
 *   ├─ Guidelines (pill chips + hover-to-open modal) ───────┤
 *   └─ Optimize button (pinned bottom) ────────────────────-┘
 */
window.TabOptimize = (function () {

  const state = {
    selectedCat:  null,
    useCaseText:  '',
    guidelines:   [],
    examples:     {},   // { gid: [ { scenario, response } ] }
  };

  function getCats()  { return window.APP_DATA?.categories ?? []; }
  function getGlines(){ return window.APP_DATA?.guidelines  ?? []; }

  /* ─────────────────────────────────────────────────────────
     HTML builders
  ───────────────────────────────────────────────────────── */

  function catCardsHTML() {
    return getCats().map(c => `
      <button class="opt-cat-card ${state.selectedCat === c.id ? 'selected' : ''}"
              data-cat="${c.id}" title="${c.name}">
        <span class="opt-cat-emoji" style="background:${c.color}18">${c.icon}</span>
        <span class="opt-cat-label">${c.name}</span>
      </button>`).join('');
  }

  function catDescHTML() {
    if (!state.selectedCat) return '';
    const cat = getCats().find(c => c.id === state.selectedCat);
    if (!cat) return '';
    // Pre-fill with the category description the first time this cat is selected
    const value = state.useCaseText || cat.desc;
    return `
      <div class="opt-cat-desc-block">
        <div class="opt-cat-desc-title">
          <span>${cat.icon}</span>
          <span>${cat.name}</span>
        </div>
        <label class="opt-usecase-label">Use case description <span class="opt-usecase-hint">(edit to personalise)</span></label>
        <textarea id="opt-usecase-ta" class="opt-usecase-ta playground-scroll"
        >${value}</textarea>
      </div>`;
  }

  function guidelinePillsHTML() {
    return getGlines().map(g => `
      <div class="opt-g-pill-wrap">
        <span class="opt-g-pill ${g.active ? 'active' : ''}" data-gid="${g.id}">
          ${g.name}
          ${g.badge ? `<span class="badge-critical">${g.badge}</span>` : ''}
        </span>
        <button class="opt-g-pill-btn" data-open-gid="${g.id}" title="Add examples">
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
      </div>`).join('');
  }

  /* ─────────────────────────────────────────────────────────
     render()
  ───────────────────────────────────────────────────────── */
  function render() {
    return `
      <div class="flex flex-col h-full overflow-hidden relative">

        <!-- Scrollable body -->
        <div class="flex-1 overflow-y-auto playground-scroll">

          <!-- ── Categories ── -->
          <div class="opt-section">
            <div class="opt-section-hdr">
              <span class="opt-section-title">Category</span>
              ${state.selectedCat
                ? `<button class="opt-clear-link" id="opt-clear-cat">Clear</button>`
                : `<span class="opt-section-hint">Pick one that fits your bot</span>`}
            </div>
            <div id="opt-cat-grid" class="opt-cat-grid">
              ${catCardsHTML()}
            </div>
            ${catDescHTML()}
          </div>

          <!-- ── Guidelines ── -->
          <div class="opt-section opt-section-border">
            <div class="opt-section-hdr">
              <span class="opt-section-title">Guidelines</span>
              <span class="opt-section-hint">Hover a pill to add examples</span>
            </div>
            <div id="opt-g-pills" class="opt-g-pills">
              ${guidelinePillsHTML()}
            </div>
          </div>

        </div>

        <!-- ── Optimize button ── -->
        <div class="opt-footer">
          <button id="opt-run-btn" class="opt-run-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="white" stroke="none">
              <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>
            </svg>
            Optimize Prompt
          </button>
        </div>

        <!-- ── Guideline modal (hidden by default) ── -->
        <div id="opt-modal-overlay" class="opt-modal-overlay" style="display:none">
          <div class="opt-modal">
            <div class="opt-modal-hdr">
              <span id="opt-modal-title" class="opt-modal-title"></span>
              <button id="opt-modal-close" class="opt-modal-close" title="Close">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                     fill="none" stroke="currentColor" stroke-width="2.5"
                     stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <p class="opt-modal-sub">Add example conversations to help the AI understand expected behaviour.</p>
            <div id="opt-modal-body" class="opt-modal-body playground-scroll"></div>
            <button id="opt-modal-add" class="opt-modal-add">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" stroke-width="2.5"
                   stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add another example
            </button>
          </div>
        </div>

      </div>`;
  }

  /* ─────────────────────────────────────────────────────────
     Modal helpers
  ───────────────────────────────────────────────────────── */
  let _modalGid = null;

  function modalExamplesHTML(gid) {
    const list = state.examples[gid] ?? [];
    if (!list.length) return '<p class="opt-modal-empty">No examples yet. Click "Add another example" below.</p>';
    return list.map((ex, i) => `
      <div class="opt-ex-card" data-ex-idx="${i}">
        <div class="opt-ex-card-hdr">
          <span class="opt-ex-num">#${i + 1}</span>
          <button class="opt-ex-del" data-del-idx="${i}" title="Remove">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2.5"
                 stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <label class="opt-ex-label">Example Scenario</label>
        <textarea class="opt-ex-ta playground-scroll" data-field="scenario" data-idx="${i}"
          placeholder="Describe a user situation…">${ex.scenario ?? ''}</textarea>
        <label class="opt-ex-label">Expected Response</label>
        <textarea class="opt-ex-ta playground-scroll" data-field="response" data-idx="${i}"
          placeholder="What the bot should say…">${ex.response ?? ''}</textarea>
      </div>`).join('');
  }

  function openModal(gid) {
    _modalGid = gid;
    if (!state.examples[gid]) state.examples[gid] = [];
    const g = state.guidelines.find(x => x.id === gid);

    document.getElementById('opt-modal-title').textContent =
      g ? `${g.name}${g.badge ? '  ' + g.badge : ''}` : '';
    document.getElementById('opt-modal-body').innerHTML = modalExamplesHTML(gid);
    document.getElementById('opt-modal-overlay').style.display = 'flex';
  }

  function closeModal() {
    document.getElementById('opt-modal-overlay').style.display = 'none';
    _modalGid = null;
  }

  function refreshModalBody() {
    const body = document.getElementById('opt-modal-body');
    if (body && _modalGid) body.innerHTML = modalExamplesHTML(_modalGid);
  }

  /* ─────────────────────────────────────────────────────────
     init()
  ───────────────────────────────────────────────────────── */
  function rerender() {
    const content = document.getElementById('sidebar-content');
    if (!content) return;
    content.innerHTML = render();
    bindEvents();
  }

  function init() {
    state.guidelines = getGlines().map(g => ({ ...g }));
    bindEvents();
  }

  function bindEvents() {

    /* Category grid */
    document.getElementById('opt-cat-grid')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-cat]');
      if (!btn) return;
      const clicked = btn.dataset.cat;
      if (state.selectedCat !== clicked) {
        state.useCaseText = ''; // reset so new cat's desc pre-fills
      }
      state.selectedCat = state.selectedCat === clicked ? null : clicked;
      rerender();
    });

    document.getElementById('opt-clear-cat')?.addEventListener('click', () => {
      state.selectedCat = null;
      rerender();
    });

    /* Use case textarea */
    document.getElementById('opt-usecase-ta')?.addEventListener('input', e => {
      state.useCaseText = e.target.value;
    });

    /* Guideline pill toggle */
    document.getElementById('opt-g-pills')?.addEventListener('click', e => {
      const pill = e.target.closest('[data-gid]');
      if (pill && !e.target.closest('[data-open-gid]')) {
        const g = state.guidelines.find(x => x.id === pill.dataset.gid);
        if (g) {
          g.active = !g.active;
          pill.classList.toggle('active', g.active);
        }
        return;
      }
      /* Eye icon → open modal */
      const eyeBtn = e.target.closest('[data-open-gid]');
      if (eyeBtn) openModal(eyeBtn.dataset.openGid);
    });

    /* Modal close */
    document.getElementById('opt-modal-close')?.addEventListener('click', closeModal);
    document.getElementById('opt-modal-overlay')?.addEventListener('click', e => {
      if (e.target === document.getElementById('opt-modal-overlay')) closeModal();
    });

    /* Modal: example field input */
    document.getElementById('opt-modal-body')?.addEventListener('input', e => {
      const ta = e.target.closest('[data-field]');
      if (!ta || !_modalGid) return;
      const idx = +ta.dataset.idx;
      if (!state.examples[_modalGid]) state.examples[_modalGid] = [];
      if (!state.examples[_modalGid][idx]) state.examples[_modalGid][idx] = {};
      state.examples[_modalGid][idx][ta.dataset.field] = ta.value;
    });

    /* Modal: delete example */
    document.getElementById('opt-modal-body')?.addEventListener('click', e => {
      const del = e.target.closest('[data-del-idx]');
      if (!del || !_modalGid) return;
      state.examples[_modalGid].splice(+del.dataset.delIdx, 1);
      refreshModalBody();
    });

    /* Modal: add example */
    document.getElementById('opt-modal-add')?.addEventListener('click', () => {
      if (!_modalGid) return;
      if (!state.examples[_modalGid]) state.examples[_modalGid] = [];
      state.examples[_modalGid].push({ scenario: '', response: '' });
      refreshModalBody();
    });

    /* Optimize button */
    document.getElementById('opt-run-btn')?.addEventListener('click', () => {
      if (!state.selectedCat) {
        document.getElementById('opt-cat-grid')?.classList.add('shake');
        setTimeout(() => document.getElementById('opt-cat-grid')?.classList.remove('shake'), 450);
        return;
      }
      runOptimize();
    });
  }

  /* ─────────────────────────────────────────────────────────
     Simulate optimize
  ───────────────────────────────────────────────────────── */
  function runOptimize() {
    const btn = document.getElementById('opt-run-btn');
    if (!btn) return;
    btn.disabled = true;
    btn.innerHTML = `
      <svg class="spin-icon" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
           fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg> Optimizing…`;

    setTimeout(() => {
      const ta   = document.getElementById('prompt-textarea');
      const cat  = getCats().find(c => c.id === state.selectedCat);
      const acts = state.guidelines.filter(g => g.active).map(g => g.name);
      const ts   = new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
      if (ta) {
        ta.value = [
          `# ${'═'.repeat(56)}`,
          `# AI Optimized — ${ts}`,
          `# Category  : ${cat?.icon ?? ''} ${cat?.name ?? 'General'}`,
          `# Guidelines: ${acts.length ? acts.join(', ') : 'None'}`,
          `# ${'═'.repeat(56)}`, '',
        ].join('\n') + ta.value;
        ta.dispatchEvent(new Event('input'));
      }
      btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
             fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6 9 17l-5-5"/>
        </svg> Optimized!`;
      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="white" stroke="none">
            <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>
          </svg> Optimize Prompt`;
      }, 2000);
    }, 1500);
  }

  return { render, init };
})();
