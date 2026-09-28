import { state, currentPrice, SPREAD, MAX_POINTS } from './state.js';

const canvas = document.getElementById('chartCanvas');
const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });

const BG = '#0B0E14';
const GREEN = '#00C076';
const RED = '#FF3B30';
const PURPLE = '#8A52F5';
const RIGHT_PAD = 70;
const TAG_W = 64;
const TAG_H = 18;
const TOP = 88;
const BOTTOM_PAD = 16;
const HEAD_LERP = 0.5;
const Y_MARGIN = 0.1;
const AXIS_LERP = 0.05;
const LINE_WIDTH = 2.2;
const HEAD_RADIUS = 4;
const PER_CANDLE = 4;

let cssW = 0;
let cssH = 0;
let currentMinPrice = 0;
let currentMaxPrice = 0;
let renderPrice = 0;

export function resizeChart() {
  const parent = canvas.parentElement;
  cssW = parent.clientWidth;
  cssH = parent.clientHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = (cssW * dpr) | 0;
  canvas.height = (cssH * dpr) | 0;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

export function snapCamera() {
  renderPrice = currentPrice();
}

function visibleExtremes(pts, xs, head, entry) {
  let lo = head;
  let hi = head;
  for (let i = pts.length - 1; i >= 0 && xs[i] >= 0; i--) {
    const v = pts[i];
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  if (entry > 0) {
    if (entry < lo) lo = entry;
    if (entry > hi) hi = entry;
  }
  return { lo, hi };
}

function updateBounds(pts, xs, head, entry) {
  const { lo, hi } = visibleExtremes(pts, xs, head, entry);
  const span = Math.max(hi - lo, head * 0.005, 0.01);
  const targetMin = Math.max(0, lo - span * Y_MARGIN);
  const targetMax = hi + span * Y_MARGIN;
  if (!(currentMaxPrice > currentMinPrice)) {
    currentMinPrice = targetMin;
    currentMaxPrice = targetMax;
    return;
  }
  currentMinPrice += (targetMin - currentMinPrice) * AXIS_LERP;
  currentMaxPrice += (targetMax - currentMaxPrice) * AXIS_LERP;
  if (head > currentMaxPrice) currentMaxPrice = head;
  if (head < currentMinPrice) currentMinPrice = head;
}

function yScale(h) {
  const range = currentMaxPrice - currentMinPrice || 1;
  const bottom = h - BOTTOM_PAD;
  return (val) => bottom - ((val - currentMinPrice) / range) * (bottom - TOP);
}

function splitStyle(h, splitY, above, below) {
  if (splitY === null) return above;
  const t = Math.min(1, Math.max(0, splitY / h));
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, above);
  g.addColorStop(t, above);
  g.addColorStop(t, below);
  g.addColorStop(1, below);
  return g;
}

function tracePath(xs, ys, from, headX, headY) {
  ctx.beginPath();
  ctx.moveTo(xs[from], ys[from]);
  for (let i = from + 1; i < xs.length; i++) ctx.lineTo(xs[i], ys[i]);
  ctx.lineTo(headX, headY);
}

function priceTag(y, w, text, color) {
  const tx = w - TAG_W - 4;
  ctx.fillStyle = BG;
  ctx.fillRect(tx, y - TAG_H / 2, TAG_W, TAG_H);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.strokeRect(tx + 0.5, y - TAG_H / 2 + 0.5, TAG_W - 1, TAG_H - 1);
  ctx.fillStyle = color;
  ctx.font = '600 11px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, tx + TAG_W / 2, y);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  return tx;
}

function drawEntry(w, entryY) {
  ctx.save();
  ctx.beginPath();
  ctx.setLineDash([4, 5]);
  ctx.strokeStyle = PURPLE;
  ctx.lineWidth = 1;
  ctx.moveTo(0, entryY);
  ctx.lineTo(w - TAG_W - 6, entryY);
  ctx.stroke();
  ctx.restore();
  priceTag(entryY, w, 'AVG ' + state.gav.toFixed(2), PURPLE);
}

function drawHead(x, y, w, under) {
  const color = under ? RED : GREEN;
  const pulse = HEAD_RADIUS * 2.2 + 1.6 * Math.sin(performance.now() / 220);
  ctx.beginPath();
  ctx.arc(x, y, pulse, 0, Math.PI * 2);
  ctx.fillStyle = under ? 'rgba(255, 59, 48, 0.16)' : 'rgba(0, 192, 118, 0.16)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, HEAD_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, HEAD_RADIUS * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  const tagX = priceTag(y, w, '$' + currentPrice().toFixed(2), color);
  ctx.save();
  ctx.beginPath();
  ctx.setLineDash([3, 4]);
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 1;
  ctx.moveTo(x, y);
  ctx.lineTo(tagX, y);
  ctx.stroke();
  ctx.restore();
}

function drawCandles(pts, xs, first, head, getY, stepX, perCandle) {
  const n = pts.length;
  const startG = state.pushCount - n;
  const bodyW = Math.max(1, Math.floor(perCandle * stepX * 0.62));
  let cur = null;
  const flush = () => {
    if (!cur) return;
    const x = Math.round(cur.xSum / cur.members) + 0.5;
    const color = cur.close >= cur.open ? GREEN : RED;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, Math.round(getY(cur.high)));
    ctx.lineTo(x, Math.round(getY(cur.low)));
    ctx.stroke();
    const yo = getY(cur.open);
    const yc = getY(cur.close);
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x - 0.5 - bodyW / 2), Math.round(Math.min(yo, yc)), bodyW, Math.max(1, Math.round(Math.abs(yc - yo))));
  };
  for (let i = first; i <= n; i++) {
    const v = i < n ? pts[i] : head.value;
    const x = i < n ? xs[i] : head.x;
    const slot = Math.floor((startG + i) / perCandle);
    if (!cur || cur.slot !== slot) {
      flush();
      cur = { slot, open: v, high: v, low: v, close: v, xSum: x, members: 1 };
    } else {
      if (v > cur.high) cur.high = v;
      if (v < cur.low) cur.low = v;
      cur.close = v;
      cur.xSum += x;
      cur.members++;
    }
  }
  flush();
}

export function renderChart() {
  if (!cssW) resizeChart();
  const w = cssW;
  const h = cssH;
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);

  const pts = state.points;
  const n = pts.length;
  if (n < 2) return;

  const price = currentPrice();
  if (!renderPrice) renderPrice = price;
  renderPrice += (price - renderPrice) * HEAD_LERP;

  const currentDotX = w - RIGHT_PAD;
  const stepX = currentDotX / (MAX_POINTS - 1);
  const frac = Math.min(1, Math.max(0, state.tickPhase));
  const xs = new Array(n);
  let first = 0;
  for (let i = 0; i < n; i++) {
    xs[i] = currentDotX - (n - 1 - i + frac) * stepX;
    if (xs[i] < 0) first = i;
  }

  const entry = state.inPosition && state.gav > 0 ? state.gav / (1 + SPREAD) : 0;
  updateBounds(pts, xs, renderPrice, entry);
  const getY = yScale(h);
  const renderY = getY(renderPrice);
  const entryPixelY = entry > 0 ? getY(entry) : null;
  const under = entry > 0 && renderPrice < entry;

  if (state.chartType === 'candle') {
    drawCandles(pts, xs, first, { value: renderPrice, x: currentDotX }, getY, stepX, PER_CANDLE);
  } else {
    const ys = new Array(n);
    for (let i = first; i < n; i++) ys[i] = getY(pts[i]);

    const fill = ctx.createLinearGradient(0, TOP, 0, h);
    if (entryPixelY === null) {
      fill.addColorStop(0, 'rgba(0, 192, 118, 0.16)');
      fill.addColorStop(1, 'rgba(0, 192, 118, 0)');
    } else {
      const t = Math.min(1, Math.max(0, (entryPixelY - TOP) / (h - TOP)));
      fill.addColorStop(0, 'rgba(0, 192, 118, 0.18)');
      fill.addColorStop(t, 'rgba(0, 192, 118, 0.04)');
      fill.addColorStop(t, 'rgba(255, 59, 48, 0.16)');
      fill.addColorStop(1, 'rgba(255, 59, 48, 0)');
    }
    tracePath(xs, ys, first, currentDotX, renderY);
    ctx.lineTo(currentDotX, h);
    ctx.lineTo(xs[first], h);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();

    ctx.lineJoin = 'miter';
    ctx.miterLimit = 3;
    ctx.lineCap = 'butt';
    ctx.strokeStyle = splitStyle(h, entryPixelY, GREEN, RED);
    ctx.globalAlpha = 0.12;
    ctx.lineWidth = LINE_WIDTH * 2.4;
    tracePath(xs, ys, first, currentDotX, renderY);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.lineWidth = LINE_WIDTH;
    tracePath(xs, ys, first, currentDotX, renderY);
    ctx.stroke();
  }

  if (entryPixelY !== null) drawEntry(w, entryPixelY);
  drawHead(currentDotX, renderY, w, under);
}
