import { resizeChart, renderChart } from './chart.js';
import { bindTradingControls } from './trading.js';
import { seedHistory, startEngine } from './engine.js';
import { initChat } from './chat.js';
import { initLeaderboard } from './leaderboard.js';
import { bindShareControls } from './share.js';
import { bindUiControls } from './ui.js';
import { initStats } from './stats.js';

seedHistory();
bindUiControls();
bindTradingControls();
bindShareControls();
initChat();
initLeaderboard();
initStats();
resizeChart();
window.addEventListener('resize', resizeChart);
renderChart();
startEngine();

if (window.matchMedia('(display-mode: standalone)').matches) {
  document.documentElement.classList.add('standalone');
}
