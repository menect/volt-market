import { state, MAX_POINTS, TICK_SEC, ui } from './state.js';
import { renderChart } from './chart.js';
import { updateLiveUi, cashOut } from './trading.js';
import { tickLiveTrades } from './leaderboard.js';

const SIGMA = 0.022;
const ANCHOR = 25;
const ZONE_LOW = 10;
const ZONE_HIGH = 50;
const SOFT_CEIL = 950;
const HARD_CEIL = 990;
const FLOOR = 1;
const MAX_TICK_MOVE = 0.05;
const PUSH_MIN = 3;
const PUSH_MAX = 6;
const PULL_MIN = 1;
const PULL_MAX = 2;
const BURST_WEIGHT = 1.0;
const NOISE_WEIGHT = 0.6;

let raf = 0;
let lastTs = 0;
let tickAcc = 0;
let gaussSpare = null;
let playerAcc = 0;

const regime = {
  bias: 0,
  left: 0,
  surge: false,
  vol: 1,
  volTarget: 1
};

const burst = {
  pullback: true,
  left: 0,
  dir: 1,
  size: 0
};

function randn() {
  if (gaussSpare !== null) {
    const v = gaussSpare;
    gaussSpare = null;
    return v;
  }
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const mag = Math.sqrt(-2 * Math.log(u));
  gaussSpare = mag * Math.sin(2 * Math.PI * v);
  return mag * Math.cos(2 * Math.PI * v);
}

function nextRegime() {
  if (state.mid < ZONE_HIGH && Math.random() < 0.18) {
    regime.surge = true;
    regime.bias = (Math.random() < 0.8 ? 1 : -1) * (0.04 + Math.random() * 0.06);
    regime.left = 6 + Math.random() * 8;
  } else {
    regime.surge = false;
    regime.bias = randn() * 0.02;
    regime.left = 2 + Math.random() * 6;
  }
  regime.volTarget = 0.7 + Math.random() * 0.8;
}

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function nextBurst() {
  if (!burst.pullback) {
    burst.pullback = true;
    burst.dir = -burst.dir;
    burst.left = randInt(PULL_MIN, PULL_MAX);
    burst.size = 0.5 + Math.random() * 0.4;
    return;
  }
  const lean = Math.max(-0.15, Math.min(0.15, regime.bias * 2));
  burst.pullback = false;
  burst.dir = Math.random() < 0.5 + lean ? 1 : -1;
  burst.left = randInt(PUSH_MIN, PUSH_MAX);
  burst.size = 0.75 + Math.random() * 0.45;
}

function reversionDrift(price) {
  const dist = Math.log(price / ANCHOR);
  let kappa = 0.03;
  if (price > ZONE_HIGH) kappa = 0.12 + 0.3 * Math.min(1, (price - ZONE_HIGH) / 500);
  else if (price < ZONE_LOW) kappa = 0.4;
  return -kappa * dist - 3 * Math.pow(price / SOFT_CEIL, 8);
}

function pushPoint(price) {
  state.points.push(price);
  if (state.points.length > MAX_POINTS) state.points.shift();
  state.pushCount++;
}

function tick() {
  regime.left -= TICK_SEC;
  if (regime.left <= 0) nextRegime();
  regime.vol += (regime.volTarget - regime.vol) * TICK_SEC * 0.8;
  if (burst.left <= 0) nextBurst();
  burst.left--;

  const sigma = SIGMA * regime.vol * (regime.surge ? 1.4 : 1) * Math.sqrt(TICK_SEC);
  const drift = (regime.bias + reversionDrift(state.mid) * (regime.surge ? 0.25 : 1)) * TICK_SEC;
  const shock = burst.dir * burst.size * BURST_WEIGHT + randn() * NOISE_WEIGHT;
  const pct = Math.max(-MAX_TICK_MOVE, Math.min(MAX_TICK_MOVE, drift + sigma * shock));

  state.mid = Math.min(HARD_CEIL, Math.max(FLOOR, state.mid * (1 + pct)));
  state.display = state.mid;
  pushPoint(state.display);
}

export function seedHistory() {
  state.points = [];
  state.pushCount = 0;
  state.mid = 20;
  state.display = 20;
  for (let i = 0; i < MAX_POINTS; i++) tick();
}

function loop(ts) {
  raf = requestAnimationFrame(loop);
  if (document.hidden) {
    lastTs = ts;
    return;
  }

  const dt = Math.min(0.25, (ts - (lastTs || ts)) / 1000);
  lastTs = ts;
  tickAcc += dt;
  while (tickAcc >= TICK_SEC) {
    tickAcc -= TICK_SEC;
    tick();
  }
  state.tickPhase = tickAcc / TICK_SEC;

  if (ui.activeTab === 'tabChart') renderChart();
  updateLiveUi();
  if (state.inPosition && state.livePct <= -99) cashOut(true);

  playerAcc += dt;
  if (playerAcc >= 5) {
    playerAcc = 0;
    state.playerCount = Math.max(800, state.playerCount + ((Math.random() * 7) | 0) - 3);
    const el = document.getElementById('livePlayersCount');
    if (el) el.textContent = state.playerCount.toLocaleString('sv-SE');
  }

  tickLiveTrades(dt);
}

export function startEngine() {
  lastTs = 0;
  tickAcc = 0;
  if (raf) cancelAnimationFrame(raf);
  raf = requestAnimationFrame(loop);
}
