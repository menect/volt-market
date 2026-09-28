const USERS = ['NovaJay', 'HexPulse', 'AriaVolt', 'KojiFX', 'MiraLong', 'ByteReef'];
const LINES = [
  'Volt Token looking clean on the 1m.',
  'Holding through this dip.',
  'Breakout incoming?',
  'Spread is tight, staying in.',
  'That spike was wild.',
  'Anyone else scaling in here?'
];

const MAX_MSGS = 36;
let box;
let timer = 0;

function addMessage(author, body, isUser = false) {
  const row = document.createElement('div');
  row.className = isUser ? 'chat-msg own' : 'chat-msg';

  const head = document.createElement('div');
  head.className = 'msg-header';
  const a = document.createElement('span');
  a.className = 'msg-author';
  a.textContent = author;
  const t = document.createElement('span');
  t.className = 'msg-time num';
  t.textContent = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  head.append(a, t);

  const p = document.createElement('div');
  p.className = 'msg-body';
  p.textContent = body;
  row.append(head, p);

  box.appendChild(row);
  while (box.children.length > MAX_MSGS) box.removeChild(box.firstChild);
  box.scrollTop = box.scrollHeight;
}

export function initChat() {
  box = document.getElementById('chatMessages');
  LINES.slice(0, 3).forEach((line, i) => addMessage(USERS[i], line));

  const send = () => {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;
    addMessage('You', text, true);
    input.value = '';
  };

  document.getElementById('chatSendBtn').addEventListener('click', send);
  document.getElementById('chatInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') send();
  });

  timer = setInterval(() => {
    if (document.hidden || Math.random() > 0.28) return;
    addMessage(
      USERS[(Math.random() * USERS.length) | 0],
      LINES[(Math.random() * LINES.length) | 0]
    );
  }, 7000);
}

export function stopChat() {
  clearInterval(timer);
}
