/* ============================================================
   LIKANZA ACADEMY — Fonction serverless Vercel : /api/generate-daily-news
   Déclenchée une fois par jour par Vercel Cron (voir vercel.json).
   Lit de vraies actus financières (lib/rss.js + lib/news-sources.js),
   les fait résumer par Gemini (lib/gemini.js, sans invention de faits —
   voir la consigne dans lib/gemini.js), et enregistre le résultat dans
   Neon (lib/db.js). La page Actualités lit ensuite ce résultat via
   /api/daily-news, elle ne rappelle jamais Gemini ni les flux RSS.

   Protégée par CRON_SECRET (vérification du header Authorization que
   Vercel envoie automatiquement sur les invocations cron — voir doc
   Vercel Cron Jobs).
   ============================================================ */

const { RSS_FEEDS } = require('../lib/news-sources');
const { fetchFeedItems } = require('../lib/rss');
const { generateDailySummary, filterSourcesUsed } = require('../lib/gemini');
const { getSql, ensureDailyNewsTable } = require('../lib/db');

module.exports = async (req, res) => {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers['authorization'];
  if(!cronSecret || authHeader !== `Bearer ${cronSecret}`){
    res.status(401).json({error: 'Unauthorized'});
    return;
  }

  try {
    const settled = await Promise.allSettled(RSS_FEEDS.map(f => fetchFeedItems(f, 6)));
    let articles = [];
    const feedErrors = [];
    settled.forEach((r, i) => {
      if(r.status === 'fulfilled') articles = articles.concat(r.value);
      else feedErrors.push(`${RSS_FEEDS[i].name} : ${r.reason.message}`);
    });

    if(articles.length === 0){
      res.status(502).json({error: 'Aucun flux RSS accessible', feedErrors});
      return;
    }

    const {items: rawItems} = await generateDailySummary(articles);

    // Chaque item ne garde que les sources qu'il a RÉELLEMENT citées
    // (filterSourcesUsed, lib/gemini.js) — jamais le pool RSS brut entier,
    // et la corroboration (2+ flux distincts) est calculée en code, jamais
    // une auto-évaluation Gemini.
    const items = rawItems
      .map(it => {
        const {sources, sourceCount, corroborated} = filterSourcesUsed(articles, it.sourcesUsed);
        return {title: it.title, summary: it.summary, sources, sourceCount, corroborated};
      })
      .filter(it => it.sources.length > 0); // un item sans source réellement attribuée n'est jamais publié

    if(items.length === 0){
      res.status(502).json({error: "Gemini n'a attribué aucune source valide à ses résumés"});
      return;
    }

    // title/summary/sources (colonnes historiques) dérivés mécaniquement des
    // items pour compatibilité — jamais un second contenu Gemini séparé à
    // maintenir en double.
    const title = 'Récap du jour';
    const summary = items.map(it => it.title).join(' · ');
    const seenLinks = new Set();
    const allSources = [];
    items.forEach(it => it.sources.forEach(s => { if(!seenLinks.has(s.link)){ seenLinks.add(s.link); allSources.push(s); } }));

    const todayISO = new Date().toISOString().slice(0, 10);

    const sql = getSql();
    await ensureDailyNewsTable(sql);
    await sql`
      INSERT INTO daily_news (news_date, title, summary, sources, items)
      VALUES (${todayISO}, ${title}, ${summary}, ${JSON.stringify(allSources)}, ${JSON.stringify(items)})
      ON CONFLICT (news_date) DO UPDATE
      SET title = EXCLUDED.title, summary = EXCLUDED.summary, sources = EXCLUDED.sources, items = EXCLUDED.items
    `;

    res.status(200).json({
      ok: true,
      date: todayISO,
      itemCount: items.length,
      articleCount: articles.length,
      feedErrors: feedErrors.length ? feedErrors : undefined
    });
  } catch(err){
    res.status(500).json({error: err.message});
  }
};
