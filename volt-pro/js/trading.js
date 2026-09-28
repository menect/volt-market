import {
  state, askPrice, bidPrice, MAX_STAKE, MAX_PROFIT, MIN_STAKE
} from './state.js';
import { MONEY, signedMoney, signedPct, pnlColor } from './format.js';
import { updateStatsView } from './stats.js';
import { poffWin, showLiquidated } from './celebration.js';
import { recordUserTrade } from './leaderboard.js';
import { snapCamera } from './chart.js';

const els = {};

function cacheEls() {
  els.buy = document.getElementById('buyBtn');
  els.dca = document.getElementById('dcaBtn');
  els.sell = document.getElementById('sellBtn');
  els.minus = document.getElementById('stakeMinusBtn');
  els.plus = document.getElementById('stakePlusBtn');
  els.row = document.getElementById('actionRow');
  els.price = document.getElementById('priceDisplay');
  els.change = document.getElementById('changeDisplay');
  els.gav = document.getElementById('gavDisplay');
  els.stake = document.getElementById('stakeDisplay');
  els.profit = document.getElementById('peakDisplay');
  els.pnl = document.getElementById('pnlDisplay');
  els.input = document.getElementById('stakeInput');
}

function moneyStake(n) {
  return `$${Number(n).toFixed(2)}`;
}

function stepUp(n) {
  if (n < 9) return n + 2;
  if (n < 10) return 10;
  if (n < 20) return Math.min(20, n + 5);
  return Math.min(MAX_STAKE, n + 10);
}

function stepDown(n) {
  if (n > 20) return Math.max(20, n - 10);
  if (n > 10) return Math.max(10, n - 5);
  if (n > 1) return n <= 3 ? 1 : n === 10 ? 9 : n - 2;
  return MIN_STAKE;
}

function syncStakeUi() {
  const amount = state.stakeAmount;
  if (document.activeElement !== els.input) {
    els.input.value = amount.toFixed(2);
  }
  document.querySelectorAll('[data-stake]').forEach((chip) => {
    chip.classList.toggle('active', Number(chip.dataset.stake) === amount);
  });
  els.minus.disabled = amount <= MIN_STAKE;
  els.plus.disabled = amount >= MAX_STAKE;
  els.buy.textContent = `Buy (${moneyStake(amount)})`;
  els.dca.textContent = `DCA (${moneyStake(amount)})`;
}

function setStake(amount) {
  state.stakeAmount = Math.min(MAX_STAKE, Math.max(MIN_STAKE, Math.round(amount)));
  syncStakeUi();
}

function commitStakeInput() {
  const raw = els.input.value.replace(/[^\d.]/g, '');
  const n = raw === '' ? MIN_STAKE : Number(raw);
  setStake(n);
}

function setPositionUi(open) {
  els.row.classList.toggle('in-position', open);
  els.buy.hidden = open;
  els.dca.hidden = !open;
  els.sell.hidden = !open;
}

function remainingRoom() {
  return Math.max(0, MAX_STAKE - state.totalInvested);
}

function applyFill(amount) {
  const ask = askPrice();
  const newStake = state.totalInvested + amount;
  const newUnits = state.totalShares + amount / ask;
  state.totalInvested = newStake;
  state.totalShares = newUnits;
  state.gav = newStake / newUnits;
}

function idleHeader() {
  els.change.textContent = 'LIVE MARKET • 24/7 STREAM';
  els.change.classList.add('idle');
  els.change.classList.remove('up', 'down');
}

function resetMetrics() {
  els.gav.textContent = '—';
  els.stake.textContent = '—';
  els.profit.textContent = '—';
  els.profit.style.color = '';
  els.pnl.textContent = '0.00%';
  els.pnl.style.color = '';
}

function freezeLastTrade(profit, pct) {
  const c = pnlColor(profit);
  els.profit.textContent = signedMoney(profit);
  els.profit.style.color = c;
  els.pnl.textContent = signedPct(pct);
  els.pnl.style.color = c;
  els.gav.textContent = '—';
  els.stake.textContent = '—';
}

export function buy() {
  const room = remainingRoom();
  const amount = Math.min(state.stakeAmount, room);
  if (amount < MIN_STAKE) return;
  resetMetrics();
  state.inPosition = true;
  state.totalInvested = 0;
  state.totalShares = 0;
  applyFill(amount);
  snapCamera();
  setPositionUi(true);
  updateLiveUi();
}

export function dca() {
  if (!state.inPosition) return;
  const amount = Math.min(state.stakeAmount, remainingRoom());
  if (amount < MIN_STAKE) return;
  applyFill(amount);
  snapCamera();
  updateLiveUi();
}

export function cashOut(liquidated) {
  if (!state.inPosition) return;
  const bid = bidPrice();
  let value = state.totalShares * bid;
  let profit = value - state.totalInvested;
  if (liquidated) {
    profit = -state.totalInvested;
    value = 0;
  } else if (profit > MAX_PROFIT) {
    profit = MAX_PROFIT;
    value = state.totalInvested + MAX_PROFIT;
  }

  const pct = state.totalInvested ? (profit / state.totalInvested) * 100 : 0;
  const stake = state.totalInvested;
  state.lastTrade = { profit, pct, stake, value };
  state.balance += profit;

  state.userStats.trades++;
  if (profit > 0) state.userStats.wins++;
  state.userStats.totalProfit += profit;
  state.userStats.totalTurnover += stake;
  state.userStats.dayPnl += profit;
  state.userStats.dayTrades++;
  state.userStats.dayTurnover += stake;
  if (profit > 0) state.userStats.dayWins++;
  state.userStats.monthPnl += profit;
  state.userStats.monthTrades++;
  state.userStats.monthTurnover += stake;
  if (profit > 0) state.userStats.monthWins++;
  state.userStats.yearPnl += profit;
  state.userStats.yearTrades++;
  state.userStats.yearTurnover += stake;
  if (profit > 0) state.userStats.yearWins++;
  if (profit > state.userStats.bestTrade) state.userStats.bestTrade = profit;
  if (state.userStats.dayPnl > state.userStats.bestDay) {
    state.userStats.bestDay = state.userStats.dayPnl;
  }
  const sessions = state.userStats.sessions;
  sessions[sessions.length - 1] = state.userStats.dayPnl;

  recordUserTrade(stake);
  updateStatsView();

  state.inPosition = false;
  state.totalInvested = 0;
  state.totalShares = 0;
  state.gav = 0;
  state.liveProfit = 0;
  state.liveValue = 0;
  state.livePct = 0;

  setPositionUi(false);
  setStake(MIN_STAKE);
  freezeLastTrade(profit, pct);
  idleHeader();
  els.price.textContent = MONEY.format(state.display);

  if (liquidated) showLiquidated();
  else if (profit > 0) poffWin();
}

function quoteLive() {
  if (!state.inPosition) return;
  const bid = bidPrice();
  let value = state.totalShares * bid;
  let profit = value - state.totalInvested;
  if (profit > MAX_PROFIT) {
    profit = MAX_PROFIT;
    value = state.totalInvested + MAX_PROFIT;
  }
  state.liveValue = value;
  state.liveProfit = profit;
  state.livePct = state.totalInvested ? (profit / state.totalInvested) * 100 : 0;
}

export function updateLiveUi() {
  const mid = state.display;
  els.price.textContent = MONEY.format(mid);

  if (!state.inPosition) {
    if (!els.change.classList.contains('idle')) idleHeader();
    return;
  }

  quoteLive();
  const c = pnlColor(state.liveProfit);
  const up = state.liveProfit >= 0;
  els.change.textContent = `${up ? '▲' : '▼'} ${signedMoney(state.liveProfit)} (${signedPct(state.livePct)}) Active Position`;
  els.change.classList.remove('idle');
  els.change.classList.toggle('up', up);
  els.change.classList.toggle('down', !up);

  els.gav.textContent = MONEY.format(state.gav);
  els.stake.textContent = MONEY.format(state.totalInvested);
  els.profit.textContent = signedMoney(state.liveProfit);
  els.profit.style.color = c;
  els.pnl.textContent = signedPct(state.livePct);
  els.pnl.style.color = c;
  els.sell.textContent = `Cashout (${MONEY.format(state.liveValue)})`;
  els.sell.classList.toggle('is-win', state.liveProfit >= 0);
}

export function bindTradingControls() {
  cacheEls();
  els.buy.addEventListener('click', buy);
  els.dca.addEventListener('click', dca);
  els.sell.addEventListener('click', () => cashOut(false));
  document.querySelectorAll('[data-stake]').forEach((chip) => {
    chip.addEventListener('click', () => setStake(Number(chip.dataset.stake)));
  });
  els.minus.addEventListener('click', () => setStake(stepDown(state.stakeAmount)));
  els.plus.addEventListener('click', () => setStake(stepUp(state.stakeAmount)));
  els.input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitStakeInput();
      els.input.blur();
    }
  });
  els.input.addEventListener('blur', commitStakeInput);
  setPositionUi(false);
  setStake(MIN_STAKE);
  idleHeader();
}
