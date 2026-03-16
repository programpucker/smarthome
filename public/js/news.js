/* ════════════════════════════════════════════════════════════
   news.js — News Panel, Popup, Filters
   ════════════════════════════════════════════════════════════ */

const News = (() => {

  // ── Time formatting ───────────────────────────────────────────
  function timeAgo(dateStr) {
    const now  = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = Math.floor((now - then) / 1000);
    if (isNaN(diff) || diff < 0) return 'just now';
    if (diff < 60)   return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  function formatUTC(dateStr) {
    try {
      return new Date(dateStr).toUTCString().replace(' GMT', 'Z').split(' ').slice(1).join(' ');
    } catch { return dateStr || '—'; }
  }

  // ── Source CSS class ──────────────────────────────────────────
  function sourceClass(source) {
    return `source-${source.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}`;
  }

  // ── Render news list ──────────────────────────────────────────
  function renderList(articles, onSelect) {
    const list = document.getElementById('news-list');
    const countEl = document.getElementById('article-count');

    if (!articles || articles.length === 0) {
      list.innerHTML = '<div class="error-state">NO ARTICLES FOUND<br>CHECK NETWORK CONNECTION</div>';
      if (countEl) countEl.textContent = '0 ARTICLES';
      return;
    }

    if (countEl) countEl.textContent = `${articles.length} ARTICLES`;

    list.innerHTML = articles.map(a => `
      <div class="news-card" data-id="${a.id}">
        <div class="news-card__meta">
          <span class="news-card__source ${sourceClass(a.source)}">${a.source.toUpperCase()}</span>
          <span class="news-card__time">${timeAgo(a.publishedAt)}</span>
        </div>
        <div class="news-card__region">${(a.region || 'GLOBAL').toUpperCase()}</div>
        <div class="news-card__title">${escapeHtml(a.title)}</div>
      </div>
    `).join('');

    // Click handlers
    list.querySelectorAll('.news-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        const article = articles.find(a => a.id === id);
        if (article && onSelect) onSelect(article);
      });
    });
  }

  // ── Show popup ────────────────────────────────────────────────
  function showPopup(article) {
    const popup = document.getElementById('news-popup');
    document.getElementById('popup-source').textContent = article.source.toUpperCase();
    document.getElementById('popup-source').className = `popup-source ${sourceClass(article.source)}`;
    document.getElementById('popup-time').textContent = formatUTC(article.publishedAt);
    document.getElementById('popup-title').textContent = article.title;
    document.getElementById('popup-region').textContent =
      `▸ ${(article.region || 'GLOBAL').toUpperCase()}  ·  LAT ${Number(article.lat).toFixed(2)}°  LNG ${Number(article.lng).toFixed(2)}°`;
    document.getElementById('popup-summary').textContent =
      article.summary || '(No summary available)';
    document.getElementById('popup-link').href = article.url;
    popup.style.display = 'block';
  }

  function hidePopup() {
    document.getElementById('news-popup').style.display = 'none';
  }

  // ── Populate source filter ────────────────────────────────────
  function populateSourceFilter(articles) {
    const select = document.getElementById('filter-source');
    const sources = [...new Set(articles.map(a => a.source))].sort();
    const current = select.value;
    // Keep "ALL SOURCES" option, rebuild rest
    while (select.options.length > 1) select.remove(1);
    sources.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s; opt.textContent = s.toUpperCase();
      select.appendChild(opt);
    });
    if (sources.includes(current)) select.value = current;
  }

  // ── Status bar update ─────────────────────────────────────────
  function updateStatus(articles, fetchedAt, sourcesActive) {
    const lastEl = document.getElementById('last-update');
    const cntEl  = document.getElementById('status-count');
    const srcEl  = document.getElementById('status-sources');

    if (lastEl && fetchedAt) {
      try {
        lastEl.textContent = new Date(fetchedAt).toUTCString().split(' ').slice(1, 5).join(' ');
      } catch { lastEl.textContent = fetchedAt; }
    }
    if (cntEl) cntEl.textContent = articles.length;
    if (srcEl) srcEl.textContent = (sourcesActive || []).length;
  }

  // ── Countdown timer ───────────────────────────────────────────
  let countdownInterval = null;

  function startCountdown(seconds, onDone) {
    if (countdownInterval) clearInterval(countdownInterval);
    let remaining = seconds;
    const el = document.getElementById('next-refresh');

    function tick() {
      if (!el) return;
      const m = String(Math.floor(remaining / 60)).padStart(1, '0');
      const s = String(remaining % 60).padStart(2, '0');
      el.textContent = `${m}:${s}`;
      if (remaining <= 0) {
        clearInterval(countdownInterval);
        if (onDone) onDone();
      }
      remaining--;
    }
    tick();
    countdownInterval = setInterval(tick, 1000);
  }

  // ── HTML escape ───────────────────────────────────────────────
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return { renderList, showPopup, hidePopup, populateSourceFilter, updateStatus, startCountdown, timeAgo };
})();
