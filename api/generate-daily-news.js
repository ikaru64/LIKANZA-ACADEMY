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
const { generateDailySummary } = require('../lib/gemini');
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

    const {title, summary} = await generateDailySummary(articles);

    const sources = articles.map(a => ({title: a.title, link: a.link, source: a.source}));
    const todayISO = new Date().toISOString().slice(0, 10);

    const sql = getSql();
    await ensureDailyNewsTable(sql);
    await sql`
      INSERT INTO daily_news (news_date, title, summary, sources)
      VALUES (${todayISO}, ${title}, ${summary}, ${JSON.stringify(sources)})
      ON CONFLICT (news_date) DO UPDATE
      SET title = EXCLUDED.title, summary = EXCLUDED.summary, sources = EXCLUDED.sources
    `;

    res.status(200).json({
      ok: true,
      date: todayISO,
      title,
      articleCount: articles.length,
      feedErrors: feedErrors.length ? feedErrors : undefined
    });
  } catch(err){
    res.status(500).json({error: err.message});
  }
};
