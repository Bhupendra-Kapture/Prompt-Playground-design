/**
 * editor.js — Prompt textarea helpers
 *
 * - Live character count displayed in the footer
 * - Save button shows "Saved!" flash feedback on click
 * - Selection magic wand: floating button + AI action popup
 */
(function () {
  function initEditor() {
    const textarea  = document.getElementById("prompt-textarea");
    const charCount = document.getElementById("char-count");
    const saveBtn   = document.getElementById("save-btn");

    if (!textarea) return;

    /* ── Character counter ─────────────────────────────── */
    function updateCount() {
      const len = textarea.value.length;
      if (charCount) {
        charCount.textContent = len.toLocaleString() + " chars";
      }
    }

    textarea.addEventListener("input", updateCount);
    updateCount(); // run once on load

    /* ── Save button feedback ──────────────────────────── */
    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        const original = saveBtn.innerHTML;
        saveBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6 9 17l-5-5"/>
          </svg>
          Saved!`;
        saveBtn.disabled = true;

        setTimeout(() => {
          saveBtn.innerHTML = original;
          saveBtn.disabled  = false;
        }, 1800);
      });
    }

    /* ── Magic wand selection popup ───────────────────── */
    const QUICK_ACTIONS = [
      { label: 'Summarize',      icon: '✦' },
      { label: 'Reduce Tokens',  icon: '⬡' },
      { label: 'Compress',       icon: '⇢' },
      { label: 'Simplify',       icon: '◎' },
      { label: 'Make Formal',    icon: '❋' },
      { label: 'Add Examples',   icon: '⊕' },
    ];

    /* Build wand button */
    const wandBtn = document.createElement('button');
    wandBtn.id = 'selection-wand';
    wandBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/>
        <path d="M17.8 11.8 19 13"/><path d="M15 9h.01"/><path d="M17.8 6.2 19 5"/>
        <path d="m3 21 9-9"/><path d="M12.2 6.2 11 5"/>
      </svg>
      AI Edit`;
    document.body.appendChild(wandBtn);

    /* Build popup */
    const popup = document.createElement('div');
    popup.id = 'wand-popup';
    popup.innerHTML = `
      <div class="wand-popup-header">
        <div class="wand-popup-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
               fill="none" stroke="#c23469" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/>
            <path d="M17.8 11.8 19 13"/><path d="M15 9h.01"/><path d="M17.8 6.2 19 5"/>
            <path d="m3 21 9-9"/><path d="M12.2 6.2 11 5"/>
          </svg>
          Edit with AI
        </div>
        <button class="wand-popup-close" id="wand-close">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
          </svg>
        </button>
      </div>

      <div class="wand-selected-preview" id="wand-preview"></div>

      <p class="wand-instruction-label">Quick actions</p>
      <div class="wand-chips">
        ${QUICK_ACTIONS.map(a => `
          <button class="wand-chip" data-action="${a.label}">
            <span class="wand-chip-icon">${a.icon}</span>${a.label}
          </button>`).join('')}
      </div>

      <p class="wand-instruction-label" style="margin-top:12px">Or describe what you want</p>
      <div class="wand-input-row">
        <textarea
          id="wand-input"
          class="wand-textarea"
          placeholder="e.g. Make this more concise and professional…"
          rows="2"
        ></textarea>
      </div>
      <button class="wand-run-btn" id="wand-run">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
             fill="currentColor" stroke="none">
          <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>
        </svg>
        Apply
      </button>
    `;
    document.body.appendChild(popup);

    let selectedText = '';
    let hideWandTimer = null;

    function showWand(x, y) {
      wandBtn.style.left = x + 'px';
      wandBtn.style.top  = y + 'px';
      wandBtn.classList.add('visible');
    }

    function hideWand() {
      wandBtn.classList.remove('visible');
    }

    function showPopup() {
      // Position popup near wand button
      const wx = parseInt(wandBtn.style.left);
      const wy = parseInt(wandBtn.style.top);
      const pw = 320;
      const vw = window.innerWidth;

      let left = wx;
      if (left + pw > vw - 16) left = vw - pw - 16;
      if (left < 8) left = 8;

      let top = wy + 36;
      if (top + 420 > window.innerHeight) top = wy - 420;

      popup.style.left = left + 'px';
      popup.style.top  = top + 'px';

      // Show preview of selected text
      const preview = document.getElementById('wand-preview');
      preview.textContent = selectedText.length > 120
        ? selectedText.slice(0, 120) + '…'
        : selectedText;

      popup.classList.add('visible');
      document.getElementById('wand-input').focus();
    }

    function hidePopup() {
      popup.classList.remove('visible');
    }

    /* Show wand on mouseup inside textarea */
    textarea.addEventListener('mouseup', () => {
      clearTimeout(hideWandTimer);
      const sel = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd).trim();
      if (sel.length > 0) {
        selectedText = sel;
        // Get caret position approximation via cursor
        const rect = textarea.getBoundingClientRect();
        showWand(rect.left + 8, rect.top - 38);
      } else {
        hideWandTimer = setTimeout(hideWand, 150);
      }
    });

    /* Also catch keyboard selections */
    textarea.addEventListener('keyup', (e) => {
      const sel = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd).trim();
      if (sel.length > 0) {
        selectedText = sel;
        const rect = textarea.getBoundingClientRect();
        showWand(rect.left + 8, rect.top - 38);
      } else {
        hideWand();
      }
    });

    /* Wand button click → open popup */
    wandBtn.addEventListener('mousedown', (e) => {
      e.preventDefault(); // prevent textarea losing selection
    });
    wandBtn.addEventListener('click', () => {
      hideWand();
      showPopup();
    });

    /* Chip clicks — fill the textarea with the action label */
    popup.addEventListener('click', (e) => {
      const chip = e.target.closest('.wand-chip');
      if (chip) {
        document.querySelectorAll('.wand-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        document.getElementById('wand-input').value = chip.dataset.action + ' the selected text';
      }
    });

    /* Close popup */
    document.getElementById('wand-close').addEventListener('click', hidePopup);

    /* Run button (demo — just closes) */
    document.getElementById('wand-run').addEventListener('click', () => {
      const btn = document.getElementById('wand-run');
      btn.textContent = '✓ Done!';
      btn.style.background = '#16a34a';
      setTimeout(() => {
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
          fill="currentColor" stroke="none">
          <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>
        </svg> Apply`;
        btn.style.background = '';
        hidePopup();
      }, 1000);
    });

    /* Click outside closes popup */
    document.addEventListener('mousedown', (e) => {
      if (!popup.contains(e.target) && e.target !== wandBtn) {
        hidePopup();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", initEditor);
})();
