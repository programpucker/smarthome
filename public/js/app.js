/* ════════════════════════════════════════════════════════════
   app.js — Bootstrap, State Management, Auto-Refresh
   ════════════════════════════════════════════════════════════ */

const App = (() => {
  const REFRESH_INTERVAL = 5 * 60; // seconds

  const state = {
    allArticles: [],
    filtered:    [],
    fetchedAt:   null,
    sources:     [],
    filters:     { region: 'all', source: 'all' },
  };

  // ── Filter articles ───────────────────────────────────────────
  function applyFilters() {
    state.filtered = state.allArticles.filter(a => {
      const regionOk = state.filters.region === 'all' || a.region === state.filters.region;
      const sourceOk = state.filters.source === 'all' || a.source === state.filters.source;
      return regionOk && sourceOk;
    });
  }

  // ── Render everything ─────────────────────────────────────────
  function render() {
    applyFilters();
    Globe.update(state.filtered);
    News.renderList(state.filtered, article => News.showPopup(article));
    News.updateStatus(state.filtered, state.fetchedAt, state.sources);
  }

  // ── Fetch news from API ───────────────────────────────────────
  async function fetchNews() {
    try {
      const res = await fetch('/api/news');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      state.allArticles = data.articles || [];
      state.fetchedAt   = data.fetchedAt || new Date().toISOString();
      state.sources     = data.sources || [];
      News.populateSourceFilter(state.allArticles);
      render();
      return true;
    } catch (err) {
      console.error('[app] fetchNews error:', err.message);
      const list = document.getElementById('news-list');
      if (list && state.allArticles.length === 0) {
        list.innerHTML = `<div class="error-state">SIGNAL LOST<br>${err.message}</div>`;
      }
      return false;
    }
  }

  // ── Auto-refresh ──────────────────────────────────────────────
  function scheduleRefresh() {
    News.startCountdown(REFRESH_INTERVAL, async () => {
      await fetchNews();
      scheduleRefresh();
    });
  }

  // ── Wire up filters ───────────────────────────────────────────
  function wireFilters() {
    document.getElementById('filter-region').addEventListener('change', e => {
      state.filters.region = e.target.value;
      render();
    });
    document.getElementById('filter-source').addEventListener('change', e => {
      state.filters.source = e.target.value;
      render();
    });
    document.getElementById('refresh-btn').addEventListener('click', async () => {
      const btn = document.getElementById('refresh-btn');
      btn.textContent = '↻ FETCHING...';
      btn.disabled = true;
      await fetchNews();
      scheduleRefresh();
      btn.textContent = '↻ REFRESH';
      btn.disabled = false;
    });
    document.getElementById('popup-close').addEventListener('click', () => News.hidePopup());
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') News.hidePopup();
    });
  }

  // ── Init ──────────────────────────────────────────────────────
  async function init() {
    await Globe.init(article => News.showPopup(article));
    wireFilters();
    await fetchNews();
    scheduleRefresh();
  }

  // Bootstrap on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { fetchNews, state };
})();
