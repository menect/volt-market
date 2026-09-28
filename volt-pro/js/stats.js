import { state } from './state.js';
import { signedMoney, signedPct, pnlColor } from './format.js';

function sliceStats() {
  const s = state.userStats;
  if (state.statsFilter === 'today') {
    return {
      profit: s.dayPnl,
      turnover: s.dayTurnover,
      trades: s.dayTrades,
      wins: s.dayWins,
      bestDay: s.bestDay
    };
  }
  if (state.statsFilter === 'month') {
    return {
      profit: s.monthPnl,
      turnover: s.monthTurnover,
      trades: s.monthTrades,
      wins: s.monthWins,
      bestDay: s.bestDay
    };
  }
  return {
    profit: s.totalProfit,
    turnover: s.totalTurnover,
    trades: s.trades,
    wins: s.wins,
    bestDay: s.bestDay
  };
}

export function updateStatsView() {
  const s = sliceStats();
  const pct = s.turnover ? (s.profit / s.turnover) * 100 : 0;
  const wr = s.trades ? (s.wins / s.trades) * 100 : 0;

  const profitEl = document.getElementById('stTotalProfit');
  const pctEl = document.getElementById('stTotalPct');
  profitEl.textContent = signedMoney(s.profit);
  profitEl.style.color = pnlColor(s.profit);
  pctEl.textContent = signedPct(pct);
  pctEl.style.color = pnlColor(s.profit);

  document.getElementById('stTotalTrades').textContent = String(s.trades);
  const wrEl = document.getElementById('stWinRate');
  wrEl.textContent = `${wr.toFixed(1)}%`;
  wrEl.style.color = s.trades ? (wr >= 50 ? '#00C076' : '#FF3B30') : '#848E9C';
  const bestEl = document.getElementById('stBestDay');
  bestEl.textContent = s.bestDay ? signedMoney(s.bestDay) : '—';
  bestEl.style.color = pnlColor(s.bestDay || 0);
}

export function initStats() {
  document.querySelectorAll('[data-stats-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.statsFilter = btn.dataset.statsFilter;
      document.querySelectorAll('[data-stats-filter]').forEach((b) => {
        b.classList.toggle('active', b === btn);
      });
      updateStatsView();
    });
  });
  updateStatsView();
}
