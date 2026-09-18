/**
 * tabs/test.js — Test Prompt: 3-step wizard
 *
 * Steps:
 *   1. Use Cases      — list of test scenarios
 *   2. Test Run       — simulated chat with scoring per turn
 *   3. Results        — aggregate scores + breakdown
 *
 * Bot Settings are accessible via the Settings button in the Use Cases header.
 */
window.TabTest = (function () {

  let step = 1; // 1–3

  /* ─────────────────────────────────────────────────────────
     DUMMY DATA
  ───────────────────────────────────────────────────────── */
  const settings = {
    provider: 'VITOS',
    model: 'claude-haiku-4-5',
    temperature: 0.7,
    maxTokens: 1024,
    tone: 'Friendly',
  };

  const useCases = [
    {
      id: 'uc1',
      title: 'Loan Enquiry Handling',
      desc: 'Customer asks about personal loan eligibility, interest rates, and repayment schedule.',
      persona: 'Retail Banking Customer',
      channels: ['WhatsApp', 'Web Chat'],
      tags: ['High Value', 'Edge Case'],
      inSet: true,
    },
    {
      id: 'uc2',
      title: 'Account Balance Check',
      desc: 'User wants to check their savings account balance without going to a branch.',
      persona: 'Existing Customer',
      channels: ['Web Chat'],
      tags: ['Common Flow'],
      inSet: true,
    },
    {
      id: 'uc3',
      title: 'Credit Card Dispute',
      desc: 'Customer disputes an unknown transaction and wants to raise a chargeback request.',
      persona: 'Credit Card Holder',
      channels: ['WhatsApp', 'IVR'],
      tags: ['Escalation', 'Edge Case'],
      inSet: false,
    },
  ];

  const simulation = [
    {
      useCase: 'Loan Enquiry Handling',
      passed: true,
      score: 88,
      turns: [
        { role: 'user',  text: 'Hi, I want to know about personal loans.' },
        { role: 'bot',   text: 'Hello! I\'d be happy to help with personal loans. Could you share your monthly income and the loan amount you\'re looking for?', score: 'Excellent', scoreVal: 92 },
        { role: 'user',  text: 'My monthly income is ₹60,000 and I need ₹3 lakhs.' },
        { role: 'bot',   text: 'Great! Based on your income, you may be eligible for up to ₹3.5 lakhs. Interest rates start at 10.5% p.a. Repayment tenure options: 12, 24, or 36 months. Would you like to apply?', score: 'Excellent', scoreVal: 90 },
        { role: 'user',  text: 'What documents do I need?' },
        { role: 'bot',   text: 'You\'ll need: Aadhaar card, PAN card, last 3 months\' salary slips, and 6 months\' bank statements. Shall I guide you through the application?', score: 'Good', scoreVal: 83 },
      ],
    },
    {
      useCase: 'Account Balance Check',
      passed: true,
      score: 94,
      turns: [
        { role: 'user',  text: 'What\'s my current balance?' },
        { role: 'bot',   text: 'To protect your account security, I\'ll need to verify your identity first. Please share your registered mobile number or account number.', score: 'Excellent', scoreVal: 96 },
        { role: 'user',  text: 'Account no: 12345678' },
        { role: 'bot',   text: 'Identity verified! Your savings account balance as of today is ₹1,24,580.00. Is there anything else I can help you with?', score: 'Excellent', scoreVal: 94 },
      ],
    },
    {
      useCase: 'Credit Card Dispute',
      passed: false,
      score: 52,
      turns: [
        { role: 'user',  text: 'There\'s a transaction I didn\'t make on my credit card.' },
        { role: 'bot',   text: 'I\'m sorry to hear that. Can you share the transaction date and amount?', score: 'Good', scoreVal: 78 },
        { role: 'user',  text: '₹4,500 on July 28 from some merchant I don\'t recognize.' },
        { role: 'bot',   text: 'To raise a dispute you must visit your nearest branch with a signed letter.', score: 'Poor', scoreVal: 38 },
        { role: 'user',  text: 'Can\'t you do it online?' },
        { role: 'bot',   text: 'I don\'t have information about online dispute processes.', score: 'Poor', scoreVal: 29 },
      ],
    },
  ];

  const results = {
    overall: 75,
    label: 'Fair',
    total: 3,
    passed: 2,
    failed: 1,
    metrics: [
      { name: 'Instruction Adherence', score: 82 },
      { name: 'Relevance',             score: 78 },
      { name: 'Accuracy',              score: 71 },
      { name: 'Tone Alignment',        score: 88 },
      { name: 'Helpfulness',           score: 65 },
    ],
  };

  /* ─────────────────────────────────────────────────────────
     Stepper bar
  ───────────────────────────────────────────────────────── */
  const STEPS = ['Use Cases', 'Test Run', 'Results'];

  function stepperHTML() {
    return `
      <div class="tw-stepper">
        ${STEPS.map((label, i) => {
          const n      = i + 1;
          const done   = n < step;
          const active = n === step;
          return `
            <div class="tw-step ${done ? 'done' : ''} ${active ? 'active' : ''}">
              <div class="tw-step-circle">
                ${done
                  ? `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24"
                         fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                       <path d="M20 6 9 17l-5-5"/>
                     </svg>`
                  : n}
              </div>
              <span class="tw-step-label">${label}</span>
              ${i < STEPS.length - 1 ? '<div class="tw-step-line"></div>' : ''}
            </div>`;
        }).join('')}
      </div>`;
  }

  /* ─────────────────────────────────────────────────────────
     Settings Modal (Bot Settings as popup)
  ───────────────────────────────────────────────────────── */
  function settingsModalHTML() {
    const providers = [
      { id: 'VITOS',    label: 'VITOS',    icon: '⚡' },
      { id: 'ChatGPT',  label: 'ChatGPT',  icon: '🤖' },
      { id: 'Gemini',   label: 'Gemini',   icon: '✦'  },
      { id: 'DeepSeek', label: 'DeepSeek', icon: '🔍' },
    ];
    const tones = [
      { id: 'Formal',       icon: '🎩', desc: 'Structured & precise'    },
      { id: 'Friendly',     icon: '😊', desc: 'Warm & conversational'   },
      { id: 'Casual',       icon: '👋', desc: 'Relaxed & natural'       },
      { id: 'Professional', icon: '💼', desc: 'Authoritative & clear'   },
    ];
    return `
      <div class="tw-settings-modal-overlay" id="tw-settings-overlay">
        <div class="tw-settings-modal">

          <!-- Modal header -->
          <div class="tw-settings-modal-hdr">
            <div style="display:flex;align-items:center;gap:10px">
              <div class="tw-settings-hdr-icon" style="width:32px;height:32px;border-radius:8px">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                     fill="none" stroke="#c23469" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </div>
              <div>
                <h2 class="tw-settings-modal-title">Bot Settings</h2>
                <p class="tw-settings-modal-sub">Configure the AI model and behaviour for this test run.</p>
              </div>
            </div>
            <button class="tw-settings-modal-close" id="tw-settings-close" title="Close">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
              </svg>
            </button>
          </div>

          <!-- Modal body -->
          <div class="tw-settings-modal-body playground-scroll">

            <!-- LLM Provider -->
            <div class="tw-form-card">
              <div class="tw-form-card-hdr">
                <span class="tw-form-label">LLM Provider</span>
                <span class="tw-form-hint">Select the AI provider</span>
              </div>
              <div class="tw-grid-2">
                ${providers.map(p => `
                  <button class="tw-sel-card ${settings.provider === p.id ? 'active' : ''}" data-provider="${p.id}">
                    <span class="tw-sel-icon">${p.icon}</span>
                    <span class="tw-sel-name">${p.label}</span>
                  </button>`).join('')}
              </div>
            </div>

            <!-- Engine Model -->
            <div class="tw-form-card">
              <div class="tw-form-card-hdr">
                <span class="tw-form-label">Engine Model</span>
                <span class="tw-form-hint">Choose the model variant</span>
              </div>
              <div class="tw-select-wrap">
                <select class="tw-select" id="ts-model">
                  <option value="claude-haiku-4-5" ${settings.model==='claude-haiku-4-5'?'selected':''}>Claude Haiku 4.5 — Fast &amp; Efficient</option>
                  <option value="claude-sonnet-4-6" ${settings.model==='claude-sonnet-4-6'?'selected':''}>Claude Sonnet 4.6 — Balanced</option>
                  <option value="gpt-4o-mini">GPT-4o Mini — OpenAI</option>
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash — Google</option>
                </select>
                <svg class="tw-select-caret" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                     fill="none" stroke="#aeb9e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </div>
            </div>

            <!-- Temperature + Max Tokens -->
            <div class="tw-grid-2">
              <div class="tw-form-card">
                <div class="tw-form-card-hdr">
                  <span class="tw-form-label">Temperature</span>
                  <span class="tw-val-badge" id="ts-temp-val">${settings.temperature}</span>
                </div>
                <input type="range" class="tw-slider" id="ts-temp"
                       min="0" max="1" step="0.05" value="${settings.temperature}">
                <div class="tw-slider-labels"><span>Precise</span><span>Creative</span></div>
              </div>
              <div class="tw-form-card">
                <div class="tw-form-card-hdr">
                  <span class="tw-form-label">Max Tokens</span>
                  <span class="tw-form-hint">64 – 8192</span>
                </div>
                <input type="number" class="tw-number-input" id="ts-tokens"
                       min="64" max="8192" step="64" value="${settings.maxTokens}">
                <div class="tw-slider-labels"><span>Shorter</span><span>Longer</span></div>
              </div>
            </div>

            <!-- Tone -->
            <div class="tw-form-card">
              <div class="tw-form-card-hdr">
                <span class="tw-form-label">Tone</span>
                <span class="tw-form-hint">How the bot communicates</span>
              </div>
              <div class="tw-grid-2">
                ${tones.map(t => `
                  <button class="tw-sel-card tw-sel-card-tone ${settings.tone === t.id ? 'active' : ''}" data-tone="${t.id}">
                    <span class="tw-sel-icon">${t.icon}</span>
                    <span class="tw-sel-name">${t.id}</span>
                    <span class="tw-sel-desc">${t.desc}</span>
                  </button>`).join('')}
              </div>
            </div>

            <!-- Info -->
            <div class="tw-info-box-v2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                   fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
              </svg>
              <span>Settings apply only to this test run and won't overwrite your saved prompt configuration.</span>
            </div>

          </div>

          <!-- Modal footer -->
          <div class="tw-settings-modal-footer">
            <button class="tw-footer-btn tw-footer-btn-ghost" id="tw-settings-cancel">Cancel</button>
            <button class="tw-footer-btn tw-footer-btn-primary" id="tw-settings-save">Save Settings</button>
          </div>

        </div>
      </div>`;
  }

  function showSettingsModal() {
    // Remove any existing modal
    document.getElementById('tw-settings-overlay')?.remove();
    const el = document.createElement('div');
    el.innerHTML = settingsModalHTML();
    document.body.appendChild(el.firstElementChild);
    bindSettingsModal();
  }

  function hideSettingsModal() {
    document.getElementById('tw-settings-overlay')?.remove();
  }

  function bindSettingsModal() {
    document.getElementById('tw-settings-close')?.addEventListener('click', hideSettingsModal);
    document.getElementById('tw-settings-cancel')?.addEventListener('click', hideSettingsModal);
    document.getElementById('tw-settings-save')?.addEventListener('click', hideSettingsModal);

    // Click overlay to close
    document.getElementById('tw-settings-overlay')?.addEventListener('click', e => {
      if (e.target.id === 'tw-settings-overlay') hideSettingsModal();
    });

    // Provider pills
    document.querySelectorAll('#tw-settings-overlay [data-provider]').forEach(btn => {
      btn.addEventListener('click', () => {
        settings.provider = btn.dataset.provider;
        document.querySelectorAll('#tw-settings-overlay [data-provider]').forEach(b =>
          b.classList.toggle('active', b.dataset.provider === settings.provider));
      });
    });

    // Tone pills
    document.querySelectorAll('#tw-settings-overlay [data-tone]').forEach(btn => {
      btn.addEventListener('click', () => {
        settings.tone = btn.dataset.tone;
        document.querySelectorAll('#tw-settings-overlay [data-tone]').forEach(b =>
          b.classList.toggle('active', b.dataset.tone === settings.tone));
      });
    });

    // Temperature slider
    const tempSlider = document.getElementById('ts-temp');
    const tempVal    = document.getElementById('ts-temp-val');
    if (tempSlider && tempVal) {
      tempSlider.addEventListener('input', () => {
        settings.temperature = +tempSlider.value;
        tempVal.textContent = tempSlider.value;
      });
    }

    // Max tokens
    document.getElementById('ts-tokens')?.addEventListener('change', e => {
      settings.maxTokens = +e.target.value;
    });

    // Model
    document.getElementById('ts-model')?.addEventListener('change', e => {
      settings.model = e.target.value;
    });
  }

  /* ─────────────────────────────────────────────────────────
     Step 1 — Use Cases
  ───────────────────────────────────────────────────────── */
  function useCaseCardHTML(uc, idx) {
    const channelChips = uc.channels.map(c =>
      `<span class="tw-chip tw-chip-blue">${c}</span>`).join('');
    const tagChips = uc.tags.map(t =>
      `<span class="tw-chip tw-chip-gray">${t}</span>`).join('');
    return `
      <div class="tw-uc-card">
        <div class="tw-uc-card-hdr">
          <div class="tw-uc-title-row">
            <span class="tw-uc-num">#${idx + 1}</span>
            <span class="tw-uc-title">${uc.title}</span>
          </div>
          <div class="tw-uc-actions">
            <label class="tw-toggle" title="In Test Set">
              <input type="checkbox" ${uc.inSet ? 'checked' : ''} data-uc-toggle="${uc.id}">
              <span class="tw-toggle-track"></span>
            </label>
            <button class="tw-icon-btn" title="Edit">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>
                <path d="m15 5 4 4"/>
              </svg>
            </button>
            <button class="tw-icon-btn tw-icon-btn-del" title="Delete">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>
        <p class="tw-uc-desc">${uc.desc}</p>
        <div class="tw-uc-meta">
          <span class="tw-chip tw-chip-purple">${uc.persona}</span>
          ${channelChips}
          ${tagChips}
        </div>
      </div>`;
  }

  function step1HTML() {
    const inSetCount = useCases.filter(u => u.inSet).length;
    return `
      <div class="tw-body playground-scroll">
        <div class="tw-uc-header">
          <span class="tw-uc-count">${useCases.length} Use Cases
            <span class="tw-uc-count-badge">${inSetCount} in set</span>
          </span>
          <div class="tw-uc-btns">
            <button class="tw-sm-btn" id="tw-settings-open" title="Bot Settings">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              Settings
            </button>
            <button class="tw-sm-btn" title="Export">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export
            </button>
            <button class="tw-sm-btn tw-sm-btn-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add
            </button>
            <button class="tw-sm-btn" title="AI Generate">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
                   fill="#c23469" stroke="none">
                <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>
              </svg>
              AI Generate
            </button>
          </div>
        </div>
        <div class="tw-uc-list">
          ${useCases.map((uc, i) => useCaseCardHTML(uc, i)).join('')}
        </div>
      </div>`;
  }

  /* ─────────────────────────────────────────────────────────
     Step 2 — Test Run
  ───────────────────────────────────────────────────────── */
  let simIdx = 0;

  function scoreBadgeHTML(score) {
    if (!score) return '';
    const cls = score === 'Excellent' ? 'tw-score-ex'
              : score === 'Good'      ? 'tw-score-good'
              :                         'tw-score-poor';
    return `<span class="tw-score-badge ${cls}">${score}</span>`;
  }

  function step2HTML() {
    const sim = simulation[simIdx];
    const passedCount = simulation.filter(s => s.passed).length;
    return `
      <div class="tw-run-wrap">
        <!-- Use case tabs -->
        <div class="tw-run-tabs playground-scroll">
          ${simulation.map((s, i) => `
            <button class="tw-run-tab ${i === simIdx ? 'active' : ''}" data-sim-idx="${i}">
              <span class="tw-run-tab-dot ${s.passed ? 'pass' : 'fail'}"></span>
              <span class="tw-run-tab-name">${s.useCase}</span>
            </button>`).join('')}
        </div>

        <!-- Stats bar -->
        <div class="tw-run-statsbar">
          <div class="tw-run-stat">
            <span class="tw-run-stat-val">${passedCount}/${simulation.length}</span>
            <span class="tw-run-stat-lbl">Passed</span>
          </div>
          <div class="tw-run-stat">
            <span class="tw-run-stat-val ${sim.passed ? 'clr-pass' : 'clr-fail'}">${sim.score}</span>
            <span class="tw-run-stat-lbl">Score</span>
          </div>
          <div class="tw-run-stat">
            <span class="tw-run-stat-badge ${sim.passed ? 'badge-pass' : 'badge-fail'}">${sim.passed ? 'PASSED' : 'FAILED'}</span>
          </div>
          <button class="tw-rerun-btn" id="tw-rerun">
            <svg class="tw-rerun-icon" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            Re-run
          </button>
        </div>

        <!-- Chat messages -->
        <div class="tw-chat playground-scroll" id="tw-chat">
          ${sim.turns.map(t => {
            if (t.role === 'user') {
              return `
                <div class="tw-msg-row tw-msg-user">
                  <div>
                    <div class="tw-bubble tw-bubble-user">${t.text}</div>
                    <div class="tw-msg-meta">You</div>
                  </div>
                </div>`;
            }
            return `
              <div class="tw-msg-row">
                <div class="tw-avatar">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24"
                       fill="#c23469" stroke="none">
                    <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>
                  </svg>
                </div>
                <div>
                  <div class="tw-bubble tw-bubble-bot">${t.text}</div>
                  <div class="tw-msg-meta">${scoreBadgeHTML(t.score)} ${t.scoreVal ?? ''}/100</div>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>`;
  }

  /* ─────────────────────────────────────────────────────────
     Step 3 — Results
  ───────────────────────────────────────────────────────── */
  function donutSVG(score) {
    const r = 42, cx = 54, cy = 54;
    const circ = 2 * Math.PI * r;
    const dash  = (score / 100) * circ;
    const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f97316' : '#ef4444';
    const label = score >= 80 ? 'Good' : score >= 60 ? 'Fair' : 'Poor';
    return `
      <div class="tw-donut-wrap">
        <svg width="108" height="108" viewBox="0 0 108 108">
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#f0f2f7" stroke-width="10"/>
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="10"
                  stroke-dasharray="${dash} ${circ}" stroke-dashoffset="${circ * 0.25}"
                  stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})"/>
        </svg>
        <div class="tw-donut-label">
          <span class="tw-donut-score">${score}</span>
          <span class="tw-donut-100">/100</span>
          <span class="tw-donut-tag" style="color:${color}">${label}</span>
        </div>
      </div>`;
  }

  function metricBarHTML(m) {
    const color = m.score >= 80 ? '#22c55e' : m.score >= 60 ? '#f97316' : '#ef4444';
    return `
      <div class="tw-metric-row">
        <span class="tw-metric-name">${m.name}</span>
        <div class="tw-metric-bar-wrap">
          <div class="tw-metric-bar" style="width:${m.score}%;background:${color}"></div>
        </div>
        <span class="tw-metric-val">${m.score}</span>
      </div>`;
  }

  function ucScoreCardHTML(s) {
    const color = s.passed ? '#22c55e' : '#ef4444';
    const metrics = ['Grounding', 'Empathy', 'Precision', 'Instructions', 'Resolution'];
    const vals    = [82, 77, 68, 90, 55].map(v => Math.round(v * (s.score / 88)));
    return `
      <div class="tw-uc-score-card">
        <div class="tw-uc-score-hdr">
          <span class="tw-uc-score-title">${s.useCase}</span>
          <div class="tw-uc-score-right">
            <span class="tw-uc-score-num" style="color:${color}">${s.score}</span>
            <span class="tw-run-stat-badge ${s.passed ? 'badge-pass' : 'badge-fail'}">${s.passed ? 'PASSED' : 'FAILED'}</span>
          </div>
        </div>
        <div class="tw-mini-metrics">
          ${metrics.map((m, i) => `
            <div class="tw-mini-metric">
              <span class="tw-mini-name">${m}</span>
              <div class="tw-mini-bar-wrap">
                <div class="tw-mini-bar" style="width:${vals[i]}%;background:${vals[i]>=70?'#22c55e':'#ef4444'}"></div>
              </div>
              <span class="tw-mini-val">${vals[i]}</span>
            </div>`).join('')}
        </div>
      </div>`;
  }

  function step3HTML() {
    const r = results;
    return `
      <div class="tw-body playground-scroll">

        <!-- Score donut + quick stats -->
        <div class="tw-results-top">
          ${donutSVG(r.overall)}
          <div class="tw-results-stats">
            <div class="tw-res-stat-card">
              <span class="tw-res-stat-num">${r.total}</span>
              <span class="tw-res-stat-lbl">Total</span>
            </div>
            <div class="tw-res-stat-card tw-res-stat-pass">
              <span class="tw-res-stat-num">${r.passed}</span>
              <span class="tw-res-stat-lbl">Passed</span>
            </div>
            <div class="tw-res-stat-card tw-res-stat-fail">
              <span class="tw-res-stat-num">${r.failed}</span>
              <span class="tw-res-stat-lbl">Failed</span>
            </div>
          </div>
        </div>

        <!-- Avg metric scores -->
        <div class="tw-section tw-section-border">
          <p class="tw-section-title-sm">Average Scores</p>
          <div class="tw-metrics-list">
            ${r.metrics.map(metricBarHTML).join('')}
          </div>
        </div>

        <!-- Per use-case breakdown -->
        <div class="tw-section tw-section-border">
          <p class="tw-section-title-sm">Use Case Breakdown</p>
          <div class="tw-uc-score-list">
            ${simulation.map(ucScoreCardHTML).join('')}
          </div>
        </div>
      </div>`;
  }

  /* ─────────────────────────────────────────────────────────
     Enhance view
  ───────────────────────────────────────────────────────── */
  const enhanceSuggestions = [
    {
      severity: 'MEDIUM',
      tags: [{ label: 'instruction', cls: 'enh-tag-blue' }, { label: 'instruction-adherence', cls: 'enh-tag-teal' }],
      title: 'Reinforce strict customer verification before any account action',
      useCases: ['Loan Enquiry Handling', 'Account Balance Check'],
      checked: false,
    },
    {
      severity: 'MEDIUM',
      tags: [{ label: 'instruction', cls: 'enh-tag-blue' }, { label: 'instruction-adherence', cls: 'enh-tag-teal' }],
      title: 'Improve handling of multiple intents with out-of-scope questions',
      useCases: ['Credit Card Dispute'],
      checked: false,
    },
    {
      severity: 'MEDIUM',
      tags: [{ label: 'Tone', cls: 'enh-tag-orange' }, { label: 'empathy-score', cls: 'enh-tag-purple' }],
      title: 'Ensure consistent empathetic acknowledgment of customer distress',
      useCases: ['Credit Card Dispute'],
      checked: false,
    },
  ];

  const promptLines = [
    '# 1. ROLE & OBJECTIVE',
    '',
    'Your name is Sarah. You are a friendly, knowledgeable and professional Banking',
    'Assistant for SecureBank. Your role is to assist customers with account queries,',
    'transactions, loan inquiries, and financial guidance via inbound calls and chat.',
    '',
    '# 2. CUSTOMER DETAILS',
    '',
    'You have access to the customer\'s basic information and account history. Always',
    'verify identity before sharing account details using their registered mobile',
    'number and Customer ID.',
    '',
    '# 3. STANDARD OPERATING PROCEDURE',
    '',
    '1. Customer Verification: Once the customer provides their mobile number and',
    'Customer ID, verify their identity and greet them warmly by their first name.',
    '',
    '2. Balance & Statement Requests: Re-verify via OTP before sharing any sensitive',
    'account information. If verification fails, follow the escalation policy.',
    '',
    '3. Loan Enquiry: Ask about the loan type, required amount, and tenure. Provide',
    'interest rates and eligibility based on the customer profile.',
    '',
    '4. Dispute Handling: For disputed transactions, collect the transaction date,',
    'amount, and merchant. Raise a chargeback request and inform the customer of',
    'the 7–10 business day resolution timeline.',
    '',
    '5. Closing: Thank the customer for contacting SecureBank. Offer further',
    'assistance and end the conversation professionally.',
  ];

  function enhanceSuggestionCardHTML(s, idx) {
    return `
      <div class="enh-card ${s.checked ? 'checked' : ''}" data-enh-idx="${idx}">
        <div class="enh-card-top">
          <label class="enh-checkbox">
            <input type="checkbox" ${s.checked ? 'checked' : ''} data-enh-check="${idx}">
            <span class="enh-checkbox-box"></span>
          </label>
          <div class="enh-card-body">
            <div class="enh-card-meta">
              <span class="enh-severity">${s.severity}</span>
              ${s.tags.map(t => `<span class="enh-tag ${t.cls}">${t.label}</span>`).join('')}
            </div>
            <p class="enh-card-title">${s.title}</p>
            <div class="enh-usecases">
              <span class="enh-usecases-label">AFFECTED USE CASES</span>
              <div class="enh-usecases-chips">
                ${s.useCases.map(u => `<span class="enh-uc-chip">${u}</span>`).join('')}
              </div>
            </div>
          </div>
          <button class="enh-expand-btn" title="View detail">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>
        </div>
      </div>`;
  }

  function enhanceBodyHTML() {
    const checkedCount = enhanceSuggestions.filter(s => s.checked).length;
    return `
      <!-- Content row -->
      <div class="enh-content">

        <!-- Left: Prompt viewer -->
        <div class="enh-left">
          <div class="enh-left-hdr">
            <div class="enh-left-hdr-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24"
                   fill="#c23469" stroke="none">
                <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>
              </svg>
              SYSTEM PROMPT
            </div>
            <span class="enh-line-badge">${promptLines.length} lines</span>
          </div>
          <div class="enh-prompt-lines playground-scroll">
            ${promptLines.map((line, i) => `
              <div class="enh-prompt-line">
                <span class="enh-line-num">${i + 1}</span>
                <span class="enh-line-text ${line.startsWith('#') ? 'enh-line-heading' : ''}">${line || '&nbsp;'}</span>
              </div>`).join('')}
          </div>
        </div>

        <!-- Divider -->
        <div class="enh-divider"></div>

        <!-- Right: Suggestions -->
        <div class="enh-right">
          <div class="enh-right-hdr">
            <div class="enh-right-hdr-title">
              <span class="enh-suggestions-count">${enhanceSuggestions.length} Suggestions</span>
              <span class="enh-total-badge">${enhanceSuggestions.length} Total</span>
            </div>
            <div class="enh-filter-tabs">
              <button class="enh-filter active" data-filter="all">All</button>
              <button class="enh-filter" data-filter="none">None</button>
            </div>
          </div>
          <div class="enh-list playground-scroll">
            ${enhanceSuggestions.map((s, i) => enhanceSuggestionCardHTML(s, i)).join('')}
          </div>
        </div>

      </div>

      <!-- Footer -->
      <div class="enh-footer">
        <span class="enh-footer-hint">Select suggestions to apply, or click Apply &amp; Close to skip</span>
        <div class="enh-footer-btns">
          <button class="tw-footer-btn tw-footer-btn-ghost" id="enh-back">Back</button>
          <button class="tw-footer-btn tw-footer-btn-primary" id="enh-apply">
            Apply Changes${checkedCount ? ` (${checkedCount})` : ''}
          </button>
        </div>
      </div>`;
  }

  function showEnhance() {
    const testBody    = document.getElementById('test-body');
    const enhBody     = document.getElementById('enhance-body');
    const writeBody   = document.getElementById('write-body');
    if (!enhBody) return;

    if (testBody)  testBody.classList.add('hidden');
    if (writeBody) writeBody.classList.add('hidden');
    enhBody.classList.remove('hidden');
    enhBody.innerHTML = enhanceBodyHTML();

    document.getElementById('tab-write')?.classList.add('active');
    document.getElementById('tab-test')?.classList.remove('active');

    bindEnhanceEvents();
  }

  function hideEnhance() {
    const testBody  = document.getElementById('test-body');
    const enhBody   = document.getElementById('enhance-body');
    if (!enhBody) return;
    enhBody.classList.add('hidden');
    if (testBody) testBody.classList.remove('hidden');

    document.getElementById('tab-write')?.classList.remove('active');
    document.getElementById('tab-test')?.classList.add('active');
  }

  function bindEnhanceEvents() {
    document.getElementById('enh-back')?.addEventListener('click', hideEnhance);

    document.getElementById('enh-apply')?.addEventListener('click', () => {
      const enhBody   = document.getElementById('enhance-body');
      const writeBody = document.getElementById('write-body');
      const testBody  = document.getElementById('test-body');
      if (enhBody)   enhBody.classList.add('hidden');
      if (testBody)  testBody.classList.add('hidden');
      if (writeBody) writeBody.classList.remove('hidden');
      document.getElementById('tab-write')?.classList.add('active');
      document.getElementById('tab-test')?.classList.remove('active');

      const ta = document.getElementById('prompt-textarea');
      if (ta) {
        const applied = enhanceSuggestions.filter(s => s.checked).map(s => `• ${s.title}`);
        if (applied.length) {
          const note = `# ✦ AI Enhanced — ${new Date().toLocaleString([], { dateStyle:'medium', timeStyle:'short' })}\n# Applied: ${applied.length} suggestion(s)\n${applied.join('\n')}\n# ${'─'.repeat(50)}\n\n`;
          ta.value = note + ta.value;
          ta.dispatchEvent(new Event('input'));
        }
      }
    });

    document.querySelectorAll('[data-enh-check]').forEach(cb => {
      cb.addEventListener('change', () => {
        const idx = +cb.dataset.enhCheck;
        enhanceSuggestions[idx].checked = cb.checked;
        cb.closest('.enh-card')?.classList.toggle('checked', cb.checked);
        const count = enhanceSuggestions.filter(s => s.checked).length;
        const applyBtn = document.getElementById('enh-apply');
        if (applyBtn) applyBtn.textContent = `Apply Changes${count ? ` (${count})` : ''}`;
      });
    });

    document.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-filter]').forEach(b => b.classList.toggle('active', b === btn));
        const selectAll = btn.dataset.filter === 'all';
        enhanceSuggestions.forEach((s, i) => {
          s.checked = selectAll;
          const cb = document.querySelector(`[data-enh-check="${i}"]`);
          if (cb) cb.checked = selectAll;
          document.querySelector(`[data-enh-idx="${i}"]`)?.classList.toggle('checked', selectAll);
        });
        const count = enhanceSuggestions.filter(s => s.checked).length;
        const applyBtn = document.getElementById('enh-apply');
        if (applyBtn) applyBtn.textContent = `Apply Changes${count ? ` (${count})` : ''}`;
      });
    });
  }

  /* ─────────────────────────────────────────────────────────
     Footer (Back / Next / action buttons)
  ───────────────────────────────────────────────────────── */
  function footerHTML() {
    const isFirst = step === 1;
    const isLast  = step === 3;
    let rightBtn = '';
    if (step === 2) {
      rightBtn = `<button id="tw-next" class="tw-footer-btn tw-footer-btn-primary">
        View Results
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
        </svg>
      </button>`;
    } else if (step === 1) {
      rightBtn = `<button id="tw-next" class="tw-footer-btn tw-footer-btn-primary">
        Start Testing
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="6 3 20 12 6 21 6 3"/>
        </svg>
      </button>`;
    } else {
      rightBtn = `
        <div style="display:flex;gap:8px">
          <button id="tw-restart" class="tw-footer-btn tw-footer-btn-outline">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            Run Again
          </button>
          <button id="tw-enhance-open" class="tw-footer-btn tw-footer-btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>
              <path d="m15 5 4 4"/>
            </svg>
            Enhance Prompt
          </button>
        </div>`;
    }
    return `
      <div class="tw-footer">
        ${isFirst
          ? `<div></div>`
          : `<button id="tw-back" class="tw-footer-btn tw-footer-btn-ghost">
               <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                 <path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>
               </svg>
               Back
             </button>`}
        ${rightBtn}
      </div>`;
  }

  /* ─────────────────────────────────────────────────────────
     render() + rerender()
  ───────────────────────────────────────────────────────── */
  function bodyHTML() {
    switch (step) {
      case 1: return step1HTML();
      case 2: return step2HTML();
      case 3: return step3HTML();
      default: return '';
    }
  }

  function render() {
    return `
      <div class="tw-wizard">
        ${stepperHTML()}
        <div class="tw-wizard-content">
          ${bodyHTML()}
        </div>
        ${footerHTML()}
      </div>`;
  }

  function rerender() {
    const el = document.getElementById('test-body');
    if (!el) return;
    el.innerHTML = render();
    bindEvents();
  }

  /* ─────────────────────────────────────────────────────────
     bindEvents()
  ───────────────────────────────────────────────────────── */
  function bindEvents() {

    /* Step 1 — Settings button */
    document.getElementById('tw-settings-open')?.addEventListener('click', showSettingsModal);

    /* Step 1 — toggle in-set */
    document.querySelectorAll('[data-uc-toggle]').forEach(cb => {
      cb.addEventListener('change', () => {
        const uc = useCases.find(u => u.id === cb.dataset.ucToggle);
        if (uc) uc.inSet = cb.checked;
        const badge = document.querySelector('.tw-uc-count-badge');
        if (badge) badge.textContent = `${useCases.filter(u => u.inSet).length} in set`;
      });
    });

    /* Step 2 — switch simulation tab */
    document.querySelectorAll('[data-sim-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        simIdx = +btn.dataset.simIdx;
        rerender();
      });
    });

    /* Step 2 — re-run (fake spinner) */
    document.getElementById('tw-rerun')?.addEventListener('click', () => {
      const btn  = document.getElementById('tw-rerun');
      const chat = document.getElementById('tw-chat');
      if (!btn || !chat) return;
      btn.disabled = true;
      btn.innerHTML = `<svg class="spin-icon" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Running…`;
      chat.innerHTML = `<div class="tw-run-loading">
        <div class="typing-dots"><span></span><span></span><span></span></div>
        <span style="font-size:12px;color:#aeb9e1">Simulating conversation…</span>
      </div>`;
      setTimeout(() => {
        rerender();
      }, 1800);
    });

    /* Navigation */
    document.getElementById('tw-next')?.addEventListener('click', () => {
      if (step < 3) { step++; rerender(); }
    });
    document.getElementById('tw-back')?.addEventListener('click', () => {
      if (step > 1) { step--; rerender(); }
    });
    document.getElementById('tw-restart')?.addEventListener('click', () => {
      step = 1; rerender();
    });

    /* Enhance button (step 3) */
    document.getElementById('tw-enhance-open')?.addEventListener('click', showEnhance);
  }

  function init() {
    step   = 1;
    simIdx = 0;
    bindEvents();
  }

  return { render, init };
})();
