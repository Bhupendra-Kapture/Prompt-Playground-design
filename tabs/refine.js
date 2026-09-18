/**
 * tabs/refine.js — Refine tab: chat-based prompt editing
 *
 * The user types a change request → a mock AI reply appears →
 * the prompt textarea is updated to reflect the change.
 *
 * Exposes: window.TabRefine { render(), init() }
 */
window.TabRefine = (function () {

  /* ── State (reset each render) ──────────────────────── */
  let messages = [];

  /* ── Helpers ────────────────────────────────────────── */
  function nowTime() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function getReply(text) {
    const lower = text.toLowerCase();
    const list  = window.APP_DATA?.refineResponses ?? [];
    for (const r of list) {
      if (r.triggers.some(t => lower.includes(t))) return r;
    }
    return {
      reply: "Analyzed your feedback and updated the prompt. The changes maintain overall structure while incorporating your requirements.\n\n✓ Applied to prompt.",
      promptNote: 'Refined',
    };
  }

  function applyToPrompt(note) {
    const ta = document.getElementById('prompt-textarea');
    if (!ta) return;
    const ts = nowTime();
    const separator = `# ── Refined [${ts}]: ${note} ${'─'.repeat(Math.max(0, 40 - note.length))}\n\n`;
    ta.value = separator + ta.value;
    ta.dispatchEvent(new Event('input')); // sync char counter
  }

  /* ── Message HTML builders ──────────────────────────── */
  function aiMsgHTML(msg) {
    return `
      <div class="flex items-start gap-2">
        <div class="w-[28px] h-[28px] rounded-full bg-[#fdf0f5] flex items-center justify-center shrink-0 mt-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
               fill="#c23469" stroke="none">
            <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <div class="msg-bubble ai-bubble">${esc(msg.text).replace(/\n/g, '<br>')}</div>
          <div class="msg-time">${msg.time}</div>
        </div>
      </div>`;
  }

  function userMsgHTML(msg) {
    return `
      <div class="flex items-start gap-2 flex-row-reverse">
        <div class="w-[28px] h-[28px] rounded-full bg-[#343b4f] flex items-center justify-center shrink-0 mt-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
               fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <div class="flex-1 min-w-0 flex flex-col items-end">
          <div class="msg-bubble user-bubble">${esc(msg.text).replace(/\n/g, '<br>')}</div>
          <div class="msg-time">${msg.time}</div>
        </div>
      </div>`;
  }

  function msgHTML(msg) {
    return msg.role === 'ai' ? aiMsgHTML(msg) : userMsgHTML(msg);
  }

  function typingHTML() {
    return `
      <div id="refine-typing" class="flex items-start gap-2">
        <div class="w-[28px] h-[28px] rounded-full bg-[#fdf0f5] flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
               fill="#c23469" stroke="none">
            <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>
          </svg>
        </div>
        <div class="typing-dots"><span></span><span></span><span></span></div>
      </div>`;
  }

  /* ── render() ───────────────────────────────────────── */
  function render() {
    messages = [
      {
        role: 'ai',
        text: "Hi! Tell me what changes you'd like to make to your prompt and I'll update it instantly.\n\nTry: \"Make it more formal\" or \"Make it shorter\"",
        time: nowTime(),
      },
    ];

    return `
      <div class="flex flex-col h-full overflow-hidden">

        <!-- Messages -->
        <div id="refine-messages" class="flex-1 overflow-y-auto p-4 flex flex-col gap-3 playground-scroll">
          ${messages.map(msgHTML).join('')}
        </div>

        <!-- Input -->
        <div class="shrink-0 border-t border-[#e0e3ed] p-3">
          <div id="refine-input-wrap"
               class="flex items-end gap-2 bg-[#f9f9f9] border border-[#e0e3ed] rounded-xl px-3 py-2 transition-colors">
            <textarea
              id="refine-input"
              rows="1"
              placeholder="Describe a change… e.g. 'Make it more formal'"
              class="flex-1 resize-none bg-transparent outline-none text-[12.5px] text-[#343b4f] placeholder:text-[#c5cce0] leading-[1.5] max-h-[72px] playground-scroll"
            ></textarea>
            <button id="refine-send"
              class="w-[28px] h-[28px] rounded-lg bg-[#c23469] flex items-center justify-center shrink-0 hover:bg-[#a82d5a] transition-colors"
              title="Send (Enter)">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                   fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
              </svg>
            </button>
          </div>
          <p class="text-[10px] text-[#c5cce0] mt-1.5 px-1">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>`;
  }

  /* ── init() ─────────────────────────────────────────── */
  function init() {
    const input   = document.getElementById('refine-input');
    const sendBtn = document.getElementById('refine-send');
    const wrap    = document.getElementById('refine-input-wrap');
    const msgArea = document.getElementById('refine-messages');

    if (!input || !sendBtn || !msgArea) return;

    /* Focus ring on input wrap */
    input.addEventListener('focus', () => wrap?.classList.add('!border-[#c23469]'));
    input.addEventListener('blur',  () => wrap?.classList.remove('!border-[#c23469]'));

    /* Auto-grow textarea */
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 72) + 'px';
    });

    /* Keyboard: Enter = send, Shift+Enter = newline */
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    });

    sendBtn.addEventListener('click', send);

    /* ── send ── */
    function send() {
      const text = input.value.trim();
      if (!text) return;

      addMsg({ role: 'user', text, time: nowTime() });
      input.value = '';
      input.style.height = 'auto';
      sendBtn.disabled = true;

      /* Show typing indicator */
      msgArea.insertAdjacentHTML('beforeend', typingHTML());
      scrollBottom();

      /* Simulate AI response */
      const delay = 800 + Math.random() * 500;
      setTimeout(() => {
        const typing = document.getElementById('refine-typing');
        if (typing) typing.remove();

        const result = getReply(text);
        addMsg({ role: 'ai', text: result.reply, time: nowTime() });
        applyToPrompt(result.promptNote);
        sendBtn.disabled = false;
      }, delay);
    }

    function addMsg(msg) {
      messages.push(msg);
      msgArea.insertAdjacentHTML('beforeend', msgHTML(msg));
      scrollBottom();
    }

    function scrollBottom() {
      msgArea.scrollTop = msgArea.scrollHeight;
    }
  }

  return { render, init };
})();
