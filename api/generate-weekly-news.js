/* ============================================================
   LIKANZA ACADEMY — Fonction serverless Vercel : /api/generate-weekly-news
   Déclenchée une fois par semaine par Vercel Cron (voir vercel.json).
   Pour chaque catégorie (WEEKLY_CATEGORY_FEEDS), lit un vrai flux RSS
   dédié, fait rédiger un article de synthèse par Gemini (sans invention
   de faits — voir lib/gemini.js) et enregistre le résultat dans Neon
   (lib/db.js, table weekly_news). La page Actualités lit ensuite ce
   résultat via /api/weekly-news ; elle ne rappelle jamais Gemini ni les
   flux RSS elle-même.

   Protégée par CRON_SECRET (même mécanisme que generate-daily-news.js).
   ============================================================ */

const { WEEKLY_CATEGORY_FEEDS } = require('../lib/news-sources');
const { fetchFeedItems } = require('../lib/rss');
const { generateCategoryArticle } = require('../lib/gemini');
const { getSql, ensureWeeklyNewsTable } = require('../lib/db');

function mondayOfWeek(date){
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay(); // 0 = dimanche ... 6 = samedi
  const diff = (day === 0 ? -6 : 1) - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

function estimateReadingTime(article){
  const words = (article.resume + ' ' + article.points.join(' ') + ' ' + article.pourquoi).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200)) + ' min';
}

module.exports = async (req, res) => {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers['authorization'];
  if(cronSecret && authHeader !== `Bearer ${cronSecret}`){
    res.status(401).json({error: 'Unauthorized'});
    return;
  }

  const weekStart = mondayOfWeek(new Date());
  const sql = getSql();
  const results = [];
  const errors = [];

  try {
    await ensureWeeklyNewsTable(sql);

    for(const entry of WEEKLY_CATEGORY_FEEDS){
      try {
        const items = await fetchFeedItems(entry.feed, 12);
        if(items.length === 0) throw new Error('Flux vide');

        const article = await generateCategoryArticle(entry.categorie, items);
        const sourceName = entry.feed.name.split(' — ')[0];
        const lien = items[0].link;
        const sources = items.map(a => ({title: a.title, link: a.link}));

        await sql`
          INSERT INTO weekly_news (week_start, categorie, slug, titre, resume, points, pourquoi, impact, lecture, source, lien, sources)
          VALUES (${weekStart}, ${entry.categorie}, ${entry.slug}, ${article.titre}, ${article.resume},
                  ${JSON.stringify(article.points)}, ${article.pourquoi}, ${JSON.stringify(article.impact)},
                  ${estimateReadingTime(article)}, ${sourceName}, ${lien}, ${JSON.stringify(sources)})
          ON CONFLICT (week_start, categorie) DO UPDATE
          SET titre = EXCLUDED.titre, resume = EXCLUDED.resume, points = EXCLUDED.points,
              pourquoi = EXCLUDED.pourquoi, impact = EXCLUDED.impact, lecture = EXCLUDED.lecture,
              source = EXCLUDED.source, lien = EXCLUDED.lien, sources = EXCLUDED.sources
        `;
        results.push(entry.categorie);
      } catch(catErr){
        errors.push(`${entry.categorie} : ${catErr.message}`);
      }
    }

    res.status(errors.length && results.length === 0 ? 502 : 200).json({
      ok: results.length > 0,
      weekStart,
      generated: results,
      errors: errors.length ? errors : undefined
    });
  } catch(err){
    res.status(500).json({error: err.message});
  }
};
