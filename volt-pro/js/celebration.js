const poffLayer = document.getElementById('poffLayer');
const liqOverlay = document.getElementById('liqOverlay');

export function poffWin() {
  if (!poffLayer) return;
  poffLayer.replaceChildren();
  const cx = 50;
  const cy = 50;
  for (let i = 0; i < 10; i++) {
    const d = document.createElement('i');
    d.className = 'poff-dot';
    const ang = (Math.PI * 2 * i) / 10 + Math.random() * 0.4;
    const dist = 18 + Math.random() * 22;
    d.style.left = `${cx}%`;
    d.style.top = `${cy}%`;
    d.style.setProperty('--dx', `${Math.cos(ang) * dist}px`);
    d.style.setProperty('--dy', `${Math.sin(ang) * dist}px`);
    d.style.background = i & 1 ? '#00C076' : '#ffffff';
    poffLayer.appendChild(d);
  }
  setTimeout(() => poffLayer.replaceChildren(), 300);
}

export function showLiquidated() {
  if (!liqOverlay) return;
  liqOverlay.classList.add('show');
  liqOverlay.setAttribute('aria-hidden', 'false');
  setTimeout(() => {
    liqOverlay.classList.remove('show');
    liqOverlay.setAttribute('aria-hidden', 'true');
  }, 700);
}
