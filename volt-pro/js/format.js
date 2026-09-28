export const MONEY = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2
});

export const MONEY_INT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});

export function signedMoney(n) {
  const abs = MONEY.format(Math.abs(n));
  return n >= 0 ? `+${abs}` : `-${abs}`;
}

export function signedPct(n) {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

export function pnlColor(n) {
  return n >= 0 ? '#00C076' : '#FF3B30';
}
