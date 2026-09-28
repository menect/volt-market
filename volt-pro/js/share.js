import { state } from './state.js';

// Replace with the public demo URL when deployed; localhost links only work on this machine.
const DEMO_URL = `${location.origin}${location.pathname}`;
const SV = new Intl.NumberFormat('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const GREEN = '#00C076';
const RED = '#FF3B30';

function signedUsd(n) {
  return `${n < 0 ? '-' : '+'}$${SV.format(Math.abs(n))}`;
}

function signedPct(n) {
  return `${n < 0 ? '-' : '+'}${SV.format(Math.abs(n))}%`;
}

function payload() {
  const s = state.userStats;
  const year = state.sharePeriod === 'year';
  const realized = year ? s.yearPnl : s.dayPnl;
  const turnover = year ? s.yearTurnover : s.dayTurnover;
  const open = state.inPosition ? state.liveProfit : 0;
  return {
    title: year ? `Mitt ${new Date().getFullYear()}` : 'Min dag',
    hero: realized + open,
    usd: realized,
    pct: turnover ? (realized / turnover) * 100 : 0
  };
}

function paint() {
  const p = payload();
  document.getElementById('shareTitle').textContent = p.title;
  const hero = document.getElementById('shareHeroVal');
  hero.textContent = signedUsd(p.hero);
  hero.style.color = p.hero < 0 ? RED : GREEN;
  document.querySelector('.share-card').classList.toggle('is-loss', p.hero < 0);
  const pct = document.getElementById('sharePctVal');
  pct.textContent = signedPct(p.pct);
  pct.style.color = p.pct < 0 ? RED : GREEN;
  const usd = document.getElementById('shareUsdVal');
  usd.textContent = signedUsd(p.usd);
  usd.style.color = p.usd < 0 ? RED : GREEN;
  document.querySelectorAll('[data-share-period]').forEach((b) => {
    const on = b.dataset.sharePeriod === state.sharePeriod;
    b.classList.toggle('active', on);
    b.setAttribute('aria-selected', String(on));
  });
}

function shareText() {
  const p = payload();
  return `${p.title} på Volt: ${signedUsd(p.hero)} (${signedPct(p.pct)}) · Volt Token (VOLT). Testa demot:`;
}

function setStatus(msg) {
  const el = document.getElementById('shareStatus');
  el.textContent = msg;
  clearTimeout(setStatus.timer);
  setStatus.timer = setTimeout(() => { el.textContent = ''; }, 2200);
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

async function shareInstagram(text) {
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Volt', text, url: DEMO_URL });
      return;
    } catch (err) {
      if (err && err.name === 'AbortError') return;
    }
  }
  const ok = await copy(`${text} ${DEMO_URL}`);
  setStatus(ok ? 'Text kopierad – klistra in på Instagram' : 'Kunde inte kopiera texten');
  window.open('https://www.instagram.com/', '_blank', 'noopener');
}

function shareTo(target) {
  const text = shareText();
  if (target === 'instagram') {
    shareInstagram(text);
    return;
  }
  const t = encodeURIComponent(text);
  const u = encodeURIComponent(DEMO_URL);
  const links = {
    telegram: `https://t.me/share/url?url=${u}&text=${t}`,
    whatsapp: `https://wa.me/?text=${t}%20${u}`,
    x: `https://twitter.com/intent/tweet?text=${t}&url=${u}`
  };
  if (links[target]) window.open(links[target], '_blank', 'noopener');
}

function closeShareModal() {
  document.getElementById('shareModal').classList.remove('active');
}

export function openShareModal() {
  paint();
  document.getElementById('shareModal').classList.add('active');
}

export function bindShareControls() {
  const demoLink = document.getElementById('demoLink');
  demoLink.href = DEMO_URL;

  document.getElementById('shareBtn').addEventListener('click', openShareModal);
  document.getElementById('statsShareBtn').addEventListener('click', openShareModal);
  document.getElementById('closeShareModalBtn').addEventListener('click', closeShareModal);
  document.getElementById('shareModal').addEventListener('click', (e) => {
    if (e.target.id === 'shareModal') closeShareModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeShareModal();
  });

  document.querySelectorAll('[data-share-period]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.sharePeriod = btn.dataset.sharePeriod;
      paint();
    });
  });

  document.querySelectorAll('[data-share]').forEach((btn) => {
    btn.addEventListener('click', () => shareTo(btn.dataset.share));
  });

  document.getElementById('copyDemoLinkBtn').addEventListener('click', async () => {
    setStatus((await copy(DEMO_URL)) ? 'Länk kopierad' : 'Kunde inte kopiera länken');
  });
}
