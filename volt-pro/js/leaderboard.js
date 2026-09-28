import { state, ui } from './state.js';
import { signedMoney, signedPct, pnlColor } from './format.js';

const NAMES = ['Erik_A', 'Satoshi_Swe', 'MoonWalker', 'Clara_Tradr', 'VoltWhale', 'NovaJay', 'HexPulse'];

const BOARDS = {
  today: [
    { rank: 1, name: 'MoonWalker', profit: 18400, pct: 45.2, trades: 14 },
    { rank: 2, name: 'Erik_A', profit: 12100, pct: 28.6, trades: 9 },
    { rank: 3, name: 'HexPulse', profit: 8950, pct: 62.1, trades: 18 },
    { rank: 4, name: 'Satoshi_Swe', profit: 6300, pct: 15.4, trades: 5 },
    { rank: 5, name: 'Clara_Tradr', profit: 4100, pct: 12.0, trades: 4 }
  ],
  month: [
    { rank: 1, name: 'Erik_A', profit: 64200, pct: 188.1, trades: 71 },
    { rank: 2, name: 'MoonWalker', profit: 51800, pct: 142.4, trades: 58 },
    { rank: 3, name: 'VoltWhale', profit: 39600, pct: 97.0, trades: 40 },
    { rank: 4, name: 'Clara_Tradr', profit: 27400, pct: 81.2, trades: 33 },
    { rank: 5, name: 'NovaJay', profit: 19800, pct: 54.6, trades: 29 }
  ],
  year: [
    { rank: 1, name: 'Erik_A', profit: 142500, pct: 482.4, trades: 124 },
    { rank: 2, name: 'Satoshi_Swe', profit: 98200, pct: 310.1, trades: 89 },
    { rank: 3, name: 'MoonWalker', profit: 64100, pct: 215.8, trades: 62 },
    { rank: 4, name: 'Clara_Tradr', profit: 42000, pct: 184.2, trades: 45 },
    { rank: 5, name: 'VoltWhale', profit: 29800, pct: 112.0, trades: 31 }
  ]
};

const liveTrades = [];
let acc = 0;
let list;

function rowBoard(item) {
  const row = document.createElement('div');
  row.className = 'lb-item';
  row.innerHTML = '';

  const rank = document.createElement('div');
  rank.className = `lb-rank rank-${item.rank}`;
  rank.textContent = String(item.rank);

  const info = document.createElement('div');
  info.className = 'lb-user-info';
  const name = document.createElement('div');
  name.className = 'lb-username';
  name.textContent = item.name;
  const trades = document.createElement('div');
  trades.className = 'lb-trades-count num';
  trades.textContent = `${item.trades} trades`;
  info.append(name, trades);

  const values = document.createElement('div');
  values.className = 'lb-value-group';
  const profit = document.createElement('div');
  profit.className = 'lb-profit-kr num';
  profit.textContent = signedMoney(item.profit);
  profit.style.color = pnlColor(item.profit);
  const pct = document.createElement('div');
  pct.className = 'lb-profit-pct num';
  pct.textContent = signedPct(item.pct);
  pct.style.color = pnlColor(item.pct);
  values.append(profit, pct);
  row.append(rank, info, values);
  return row;
}

function rowTrade(item) {
  const row = document.createElement('div');
  row.className = 'lb-item trade-row';
  const info = document.createElement('div');
  info.className = 'lb-user-info';
  info.style.marginLeft = '0';
  const name = document.createElement('div');
  name.className = 'lb-username';
  name.textContent = item.name;
  const meta = document.createElement('div');
  meta.className = 'lb-trades-count';
  meta.textContent = 'Entry stake';
  info.append(name, meta);
  const values = document.createElement('div');
  values.className = 'lb-value-group';
  const stake = document.createElement('div');
  stake.className = 'lb-profit-kr num';
  stake.style.color = '#fff';
  stake.textContent = `$${item.stake}`;
  values.append(stake);
  row.append(info, values);
  return row;
}

function render() {
  if (!list) return;
  if (state.leaderboardFilter === 'trades') {
    list.replaceChildren(...liveTrades.map(rowTrade));
    return;
  }
  list.replaceChildren(...BOARDS[state.leaderboardFilter].map(rowBoard));
}

function spawnTrade() {
  const stake = [2, 5, 10, 20, 40, 100][(Math.random() * 6) | 0];
  const pct = (Math.random() * 28) - 10;
  liveTrades.unshift({
    name: NAMES[(Math.random() * NAMES.length) | 0],
    stake,
    pnl: stake * pct / 100,
    pct
  });
  if (liveTrades.length > 12) liveTrades.pop();
  if (state.leaderboardFilter === 'trades' && ui.activeTab === 'tabLeaderboard') render();
}

export function recordUserTrade(stake) {
  liveTrades.unshift({
    name: 'You',
    stake: Math.round(stake),
    pnl: 0,
    pct: 0
  });
  if (liveTrades.length > 12) liveTrades.pop();
  if (state.leaderboardFilter === 'trades') render();
}

export function tickLiveTrades(dt) {
  acc += dt;
  if (acc < 3.2) return;
  acc = 0;
  spawnTrade();
}

export function initLeaderboard() {
  list = document.getElementById('leaderboardList');
  document.querySelectorAll('[data-lb-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.leaderboardFilter = btn.dataset.lbFilter;
      document.querySelectorAll('.lb-filter-btn').forEach((b) => {
        b.classList.toggle('active', b === btn);
      });
      render();
    });
  });
  for (let i = 0; i < 6; i++) spawnTrade();
  render();
}
