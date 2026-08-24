/* ============================================================
   LIKANZA ACADEMY — Fonction serverless Vercel : /api/daily-news
   Sert le dernier récap quotidien généré par /api/generate-daily-news
   (lecture seule, aucun appel RSS ni Gemini ici). Utilisée par la
   page Actualités (scripts/pages/actualites.js).

   Réponse : { date, title, summary, sources: [{title, link, source}] }
   ou 404 si aucun récap n'a encore été généré.
   ============================================================ */

const { getSql, ensureDailyNewsTable } = require('../lib/db');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  try {
    const sql = getSql();
    await ensureDailyNewsTable(sql);
    const rows = await sql`
      SELECT news_date, title, summary, sources, items, created_at
      FROM daily_news
      ORDER BY news_date DESC
      LIMIT 1
    `;
    if(rows.length === 0){
      res.setHeader('Cache-Control', 'no-store');
      res.status(404).json({error: 'Aucun récap disponible pour le moment'});
      return;
    }
    const row = rows[0];
    // 10 min de cache CDN : le récap ne change qu'une fois par jour, mais
    // on garde une fenêtre courte pour que la génération manuelle se voie vite.
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1800');
    res.status(200).json({
      date: row.news_date,
      title: row.title,
      summary: row.summary,
      sources: row.sources,
      // items : chantier "vraies sources par article" — 3 à 5 actualités
      // distinctes, chacune avec ses sources réellement citées et sa
      // corroboration calculée. Absent (tableau vide) pour toute ligne
      // générée avant ce champ — le frontend replie proprement sur
      // title/summary dans ce cas (voir scripts/pages/actualites.js).
      items: row.items || [],
      generatedAt: row.created_at
    });
  } catch(err){
    res.setHeader('Cache-Control', 'no-store');
    res.status(500).json({error: err.message});
  }
};
