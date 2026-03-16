/* ════════════════════════════════════════════════════════════
   globe.js — D3 Azimuthal Equidistant Flat Globe
   ════════════════════════════════════════════════════════════ */

const Globe = (() => {
  let svg, projection, pathGen, worldData;
  let width, height, radius;
  let onDotClick = null;

  const WORLD_TOPO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

  // ── Source dot color map ──────────────────────────────────────
  const SOURCE_COLORS = {
    'BBC':        '#e8923a',
    'Al Jazeera': '#4fc3f7',
    'DW':         '#a0c4ff',
    'NPR':        '#69ff96',
    'France 24':  '#c084fc',
    'Reuters':    '#fbbf24',
  };

  function sourceClass(source) {
    return source.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
  }

  // ── Compute size ─────────────────────────────────────────────
  function computeSize() {
    const container = document.getElementById('globe-container');
    width  = container.clientWidth;
    height = container.clientHeight;
    radius = Math.min(width, height) * 0.42;
  }

  // ── Build projection ─────────────────────────────────────────
  function buildProjection() {
    projection = d3.geoAzimuthalEquidistant()
      .rotate([0, -90])           // center on North Pole
      .scale(radius)
      .translate([width / 2, height / 2])
      .clipAngle(180);
    pathGen = d3.geoPath().projection(projection);
  }

  // ── Draw map layers ──────────────────────────────────────────
  function drawMap() {
    svg.selectAll('*').remove();

    // Outer sphere circle
    svg.append('circle')
      .attr('class', 'globe-sphere')
      .attr('cx', width / 2).attr('cy', height / 2)
      .attr('r', radius);

    // Minor graticule (every 10°)
    const graticule = d3.geoGraticule().step([10, 10]);
    svg.append('path')
      .datum(graticule())
      .attr('class', 'graticule')
      .attr('d', pathGen);

    // Major graticule (every 30°)
    const graticule30 = d3.geoGraticule().step([30, 30]);
    svg.append('path')
      .datum(graticule30())
      .attr('class', 'graticule-major')
      .attr('d', pathGen);

    if (!worldData) return;

    // Countries fill
    svg.append('g').attr('class', 'countries')
      .selectAll('path')
      .data(topojson.feature(worldData, worldData.objects.countries).features)
      .join('path')
      .attr('class', 'country')
      .attr('d', pathGen);

    // Country borders
    svg.append('path')
      .datum(topojson.mesh(worldData, worldData.objects.countries, (a, b) => a !== b))
      .attr('class', 'country-border')
      .attr('d', pathGen);
  }

  // ── Plot news dots ───────────────────────────────────────────
  function plotNews(articles) {
    // Remove existing dots and rings
    svg.selectAll('.news-dot-ring').remove();
    svg.selectAll('.news-dot').remove();

    const dotData = articles.filter(a => {
      const pt = projection([a.lng, a.lat]);
      return pt !== null;
    });

    // Pulse rings (behind dots)
    svg.selectAll('.news-dot-ring')
      .data(dotData, d => d.id)
      .join('circle')
      .attr('class', 'news-dot-ring')
      .attr('cx', d => projection([d.lng, d.lat])[0])
      .attr('cy', d => projection([d.lng, d.lat])[1])
      .attr('r', 4)
      .attr('stroke', d => SOURCE_COLORS[d.source] || '#e8923a')
      .attr('fill', 'none')
      .attr('stroke-width', 1)
      .style('animation-delay', () => `${Math.random() * 2}s`);

    // News dots
    svg.selectAll('.news-dot')
      .data(dotData, d => d.id)
      .join('circle')
      .attr('class', d => `news-dot news-dot--${sourceClass(d.source)}`)
      .attr('cx', d => projection([d.lng, d.lat])[0])
      .attr('cy', d => projection([d.lng, d.lat])[1])
      .attr('r', 4)
      .attr('fill', d => SOURCE_COLORS[d.source] || '#e8923a')
      .style('animation-delay', () => `${Math.random() * 2.5}s`)
      .on('mouseenter', (event, d) => showTooltip(event, d))
      .on('mouseleave', () => hideTooltip())
      .on('click', (event, d) => {
        event.stopPropagation();
        if (onDotClick) onDotClick(d);
      });
  }

  // ── Tooltip ──────────────────────────────────────────────────
  let tooltip;

  function ensureTooltip() {
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.className = 'globe-tooltip';
      document.body.appendChild(tooltip);
    }
  }

  function showTooltip(event, article) {
    ensureTooltip();
    tooltip.innerHTML = `
      <div style="color:var(--accent-orange);font-size:9px;letter-spacing:0.15em;margin-bottom:4px">
        ${article.source.toUpperCase()}
      </div>
      <div style="font-size:10px;line-height:1.4">
        ${article.title.slice(0, 80)}${article.title.length > 80 ? '…' : ''}
      </div>`;
    tooltip.classList.add('visible');
    moveTooltip(event);
  }

  function moveTooltip(event) {
    if (!tooltip) return;
    const x = event.clientX + 14;
    const y = event.clientY - 10;
    tooltip.style.left = `${Math.min(x, window.innerWidth - 240)}px`;
    tooltip.style.top  = `${Math.max(y, 8)}px`;
  }

  function hideTooltip() {
    if (tooltip) tooltip.classList.remove('visible');
  }

  // ── Mouse coordinates ─────────────────────────────────────────
  function setupMouseCoords() {
    const coordEl = document.getElementById('mouse-coords');
    if (!coordEl) return;
    svg.on('mousemove', (event) => {
      const [mx, my] = d3.pointer(event);
      const inv = projection.invert([mx, my]);
      if (inv) {
        const [lng, lat] = inv;
        coordEl.textContent = `LAT ${lat.toFixed(1)}° LNG ${lng.toFixed(1)}°`;
      }
      if (tooltip && tooltip.classList.contains('visible')) {
        moveTooltip(event);
      }
    });
    svg.on('mouseleave', () => {
      coordEl.textContent = 'LAT — LNG —';
      hideTooltip();
    });
  }

  // ── Load world data & init ────────────────────────────────────
  async function init(clickHandler) {
    onDotClick = clickHandler;
    computeSize();
    buildProjection();

    svg = d3.select('#globe-svg');

    try {
      worldData = await d3.json(WORLD_TOPO_URL);
    } catch (e) {
      console.warn('[globe] Could not load world topology:', e.message);
    }

    drawMap();
    setupMouseCoords();

    // Resize handler
    window.addEventListener('resize', () => {
      computeSize();
      buildProjection();
      svg.attr('viewBox', null);
      drawMap();
      // Re-plot current articles
      if (window._currentArticles) plotNews(window._currentArticles);
    });
  }

  // ── Update with new articles ──────────────────────────────────
  function update(articles) {
    window._currentArticles = articles;
    plotNews(articles);
  }

  return { init, update };
})();
