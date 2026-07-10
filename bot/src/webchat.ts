// HTML страницы веб-чата (тестовый режим в браузере). Самодостаточная:
// стили и скрипт встроены. Отдаётся с GET /.

export const WEBCHAT_HTML = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>Bootsbaza — тест-чат</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, Segoe UI, Roboto, sans-serif;
    background: #0d1512; color: #e7efe9; display: flex; flex-direction: column; height: 100dvh; }
  header { padding: 14px 16px; border-bottom: 1px solid #23302a; font-weight: 800;
    display: flex; align-items: center; gap: 8px; }
  header .dot { width: 9px; height: 9px; border-radius: 50%; background: #37d67a; }
  #log { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
  .msg { max-width: 80%; padding: 10px 13px; border-radius: 14px; line-height: 1.4;
    white-space: pre-wrap; word-wrap: break-word; }
  .me { align-self: flex-end; background: #2f6f4e; color: #fff; border-bottom-right-radius: 4px; }
  .bot { align-self: flex-start; background: #182420; border: 1px solid #23302a; border-bottom-left-radius: 4px; }
  .card { align-self: flex-start; max-width: 80%; background: #182420; border: 1px solid #23302a;
    border-radius: 14px; overflow: hidden; }
  .card img { display: block; width: 100%; height: auto; max-height: 460px; object-fit: contain; background: #0d1512; }
  .card .cap { padding: 8px 11px; font-size: 14px; white-space: pre-wrap; }
  .sys { align-self: center; color: #7d8f83; font-size: 13px; }
  form { display: flex; gap: 8px; padding: 12px; border-top: 1px solid #23302a; }
  input[type=text] { flex: 1; padding: 12px 14px; border-radius: 12px; border: 1px solid #2b3a33;
    background: #0d1512; color: #e7efe9; font-size: 15px; outline: none; }
  input[type=text]:focus { border-color: #37d67a; }
  button { padding: 0 18px; border: 0; border-radius: 12px; background: #37d67a; color: #062012;
    font-weight: 700; font-size: 15px; cursor: pointer; }
  button:disabled { opacity: .5; cursor: default; }
</style>
</head>
<body>
  <header><span class="dot"></span> Bootsbaza — тест-консультант</header>
  <div id="log"></div>
  <form id="f">
    <input id="i" type="text" placeholder="Напишите как клиент…" autocomplete="off" />
    <button id="b" type="submit">➤</button>
  </form>
<script>
  const log = document.getElementById('log');
  const form = document.getElementById('f');
  const input = document.getElementById('i');
  const btn = document.getElementById('b');

  let sessionId = localStorage.getItem('bb_sid');
  if (!sessionId) { sessionId = 'web-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('bb_sid', sessionId); }
  let password = localStorage.getItem('bb_pw') || '';

  function add(cls, text) {
    const d = document.createElement('div'); d.className = 'msg ' + cls; d.textContent = text;
    log.appendChild(d); log.scrollTop = log.scrollHeight; return d;
  }
  function addCard(url, cap) {
    const c = document.createElement('div'); c.className = 'card';
    if (url) { const im = document.createElement('img'); im.src = url; im.loading = 'lazy'; c.appendChild(im); }
    if (cap) { const p = document.createElement('div'); p.className = 'cap'; p.textContent = cap; c.appendChild(p); }
    log.appendChild(c); log.scrollTop = log.scrollHeight;
  }
  add('sys', 'Это тестовый чат. Пишите как покупатель — бот подберёт товары и оформит заказ.');

  async function send(text) {
    add('me', text);
    input.value = ''; btn.disabled = true; input.disabled = true;
    const wait = add('sys', 'печатает…');
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: text, password }) });
      wait.remove();
      if (res.status === 401) {
        const pw = prompt('Введите пароль доступа к тест-чату:');
        if (pw) { password = pw; localStorage.setItem('bb_pw', pw); await send(text); }
        return;
      }
      const data = await res.json();
      // Сначала карточки товаров (фото + подпись) в порядке отправки.
      for (const c of (data.cards || [])) {
        if (c.kind === 'image') addCard(c.url, '');
        else if (c.kind === 'text') { const last = log.lastElementChild;
          if (last && last.className === 'card' && !last.querySelector('.cap')) {
            const p = document.createElement('div'); p.className = 'cap'; p.textContent = c.text; last.appendChild(p);
          } else addCard('', c.text);
        }
      }
      if (data.reply) add('bot', data.reply);
      if (data.error) add('sys', 'Ошибка: ' + data.error);
    } catch (e) { wait.remove(); add('sys', 'Сеть недоступна: ' + e.message); }
    finally { btn.disabled = false; input.disabled = false; input.focus(); }
  }

  form.addEventListener('submit', (e) => { e.preventDefault();
    const t = input.value.trim(); if (t) send(t); });
</script>
</body>
</html>`;
