'use strict';

const express = require('express');
const cors = require('cors');
const path = require('path');
const { fetchAll, SOURCES } = require('./src/newsService');

const app = express();
const PORT = process.env.PORT || 3000;
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

let cache = { data: null, ts: 0 };

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/news', async (req, res) => {
  try {
    const now = Date.now();
    if (cache.data && (now - cache.ts) < CACHE_TTL) {
      return res.json(cache.data);
    }
    const articles = await fetchAll();
    cache = { data: { articles, fetchedAt: new Date().toISOString(), sources: SOURCES.map(s => s.name) }, ts: now };
    res.json(cache.data);
  } catch (err) {
    console.error('[server] /api/news error:', err.message);
    res.status(500).json({ error: 'Failed to fetch news', articles: [] });
  }
});

app.listen(PORT, () => {
  console.log(`\n  ◈ GLOBAL INTEL SYSTEM`);
  console.log(`  ─────────────────────────────────`);
  console.log(`  Server running at http://localhost:${PORT}`);
  console.log(`  API endpoint: http://localhost:${PORT}/api/news\n`);
});
