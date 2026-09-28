export const SPREAD = 0.015;
export const MAX_STAKE = 100;
export const MAX_PROFIT = 10000;
export const MIN_STAKE = 1;
export const STAKE_PRESETS = [5, 10, 20, 100];

export const MAX_POINTS = 140;
export const TICK_SEC = 0.1;

export const ui = {
  activeTab: 'tabChart'
};

export const state = {
  chartType: 'line',
  mid: 20,
  display: 20,
  points: [],
  pushCount: 0,
  tickPhase: 0,
  balance: 0,
  stakeAmount: 1,
  inPosition: false,
  totalInvested: 0,
  totalShares: 0,
  gav: 0,
  liveProfit: 0,
  liveValue: 0,
  livePct: 0,
  playerCount: 1429,
  leaderboardFilter: 'today',
  statsFilter: 'today',
  sharePeriod: 'today',
  lastTrade: null,
  userStats: {
    trades: 0,
    wins: 0,
    totalProfit: 0,
    totalTurnover: 0,
    bestTrade: 0,
    bestDay: 0,
    dayPnl: 0,
    dayTrades: 0,
    dayWins: 0,
    dayTurnover: 0,
    monthPnl: 0,
    monthTrades: 0,
    monthWins: 0,
    monthTurnover: 0,
    yearPnl: 0,
    yearTrades: 0,
    yearWins: 0,
    yearTurnover: 0,
    sessions: [12, -4, 8, 21, -9, 6, 0]
  }
};

export function currentPrice() {
  return state.display;
}

export function askPrice() {
  return currentPrice() * (1 + SPREAD);
}

export function bidPrice() {
  return currentPrice() * (1 - SPREAD);
}
