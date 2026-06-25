// TDC AI Chatbot Widget
// Communicates with /api/chat (Anthropic-backed serverless function)

(function () {
  const STORAGE_KEY = 'tdc_chat_history_v1';
  const MAX_HISTORY = 20;

  const $toggle = document.getElementById('cb-toggle');
  const $panel = document.getElementById('cb-panel');
  const $body = document.getElementById('cb-body');
  const $input = document.getElementById('cb-input');
  const $send = document.getElementById('cb-send');

  if (!$toggle || !$panel || !$body) return;

  let history = loadHistory();
  let busy = false;

  function loadHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  }

  function saveHistory() {
    try {
      const trimmed = history.slice(-MAX_HISTORY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (e) {}
  }

  // Inline spark SVG with explicit 14px size — avoids <use href> issues with innerHTML
  function sparkSvg() {
    return `<svg viewBox="-50 -50 100 100" style="width:14px;height:14px;display:block;transform:rotate(8deg);" aria-hidden="true">
      <g fill="white">
        <rect x="-6" y="-44" width="12" height="88" rx="6"/>
        <rect x="-6" y="-44" width="12" height="88" rx="6" transform="rotate(60)"/>
        <rect x="-6" y="-44" width="12" height="88" rx="6" transform="rotate(120)"/>
      </g>
    </svg>`;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function formatBubble(text) {
    let html = escapeHtml(text);
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/(https?:\/\/[^\s<)]+)/g, '<a href="$1" target="_blank" rel="noopener" style="color: var(--accent-orange); text-decoration: underline;">$1</a>');
    html = html.replace(/(\bhello@thedalycreative\.com\b)/g, '<a href="mailto:hello@thedalycreative.com" style="color: var(--accent-orange); text-decoration: underline;">$1</a>');
    html = html.replace(/\n/g, '<br>');
    return html;
  }

  function renderMsg(role, text) {
    const wrap = document.createElement('div');
    wrap.className = 'cb-msg ' + (role === 'user' ? 'user' : 'tdc');
    const avatarContent = role === 'user' ? '' : sparkSvg();
    wrap.innerHTML = `
      <div class="cb-msg-avatar">${avatarContent}</div>
      <div class="cb-bubble">${formatBubble(text)}</div>
    `;
    $body.appendChild(wrap);
    $body.scrollTop = $body.scrollHeight;
  }

  function renderTyping() {
    const wrap = document.createElement('div');
    wrap.className = 'cb-msg tdc';
    wrap.id = 'cb-typing-row';
    wrap.innerHTML = `
      <div class="cb-msg-avatar">${sparkSvg()}</div>
      <div class="cb-bubble"><div class="cb-typing"><span></span><span></span><span></span></div></div>
    `;
    $body.appendChild(wrap);
    $body.scrollTop = $body.scrollHeight;
  }

  function removeTyping() {
    const t = document.getElementById('cb-typing-row');
    if (t) t.remove();
  }

  function renderHistory() {
    $body.innerHTML = '';
    if (history.length === 0) {
      renderMsg('tdc', "Hi — I'm the TDC assistant. Happy to walk you through Setup Day, talk through what we'd automate for your business, or just answer questions.\n\nWhat brings you here?");
    } else {
      history.forEach(m => renderMsg(m.role === 'user' ? 'user' : 'tdc', m.content));
    }
  }

  async function sendMessage(text) {
    if (busy || !text.trim()) return;
    busy = true;
    $send.disabled = true;

    const userMsg = { role: 'user', content: text.trim() };
    history.push(userMsg);
    renderMsg('user', userMsg.content);
    saveHistory();

    $input.value = '';
    renderTyping();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history })
      });

      removeTyping();

      if (!res.ok) {
        const errText = res.status === 429
          ? "I'm getting a lot of chat right now — try again in a moment, or just email hello@thedalycreative.com directly."
          : "Something went sideways on my end. Email hello@thedalycreative.com and Tim will reply within 24 hours.";
        renderMsg('tdc', errText);
        busy = false;
        $send.disabled = false;
        return;
      }

      const data = await res.json();
      const reply = (data && data.message) || "Sorry, I dropped the thread. Try again?";

      const tdcMsg = { role: 'assistant', content: reply };
      history.push(tdcMsg);
      renderMsg('tdc', reply);
      saveHistory();
    } catch (e) {
      removeTyping();
      renderMsg('tdc', "Connection hiccup. Try again, or just email hello@thedalycreative.com.");
    }

    busy = false;
    $send.disabled = false;
    $input.focus();
  }

  $toggle.addEventListener('click', () => {
    const isOpen = $panel.classList.toggle('open');
    $toggle.classList.toggle('open', isOpen);
    if (isOpen) {
      renderHistory();
      setTimeout(() => $input.focus(), 100);
    }
  });

  $send.addEventListener('click', () => sendMessage($input.value));

  $input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage($input.value);
    }
  });
})();
