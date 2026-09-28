import { state, ui } from './state.js';
import { resizeChart, renderChart } from './chart.js';

export function bindUiControls() {
  document.querySelectorAll('[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      ui.activeTab = btn.dataset.tab;
      document.querySelectorAll('.tab-view').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.nav-item').forEach((n) => n.classList.remove('active'));
      document.getElementById(ui.activeTab).classList.add('active');
      btn.classList.add('active');
      if (ui.activeTab === 'tabChart') {
        resizeChart();
        renderChart();
      }
    });
  });

  document.querySelectorAll('[data-chart-type]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.chartType = btn.dataset.chartType;
      document.getElementById('btnTypeLine').classList.toggle('active', state.chartType === 'line');
      document.getElementById('btnTypeCandle').classList.toggle('active', state.chartType === 'candle');
      renderChart();
    });
  });
}
