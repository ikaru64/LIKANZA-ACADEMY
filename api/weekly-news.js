/* ============================================================
   LIKANZA ACADEMY — Fonction serverless Vercel : /api/weekly-news
   Sert les articles de la semaine la plus récente générée par
   /api/generate-weekly-news (lecture seule, aucun appel RSS ni Gemini
   ici). Utilisée par la page Actualités et le teaser accueil.

   Réponse : { weekStart, articles: [{categorie, slug, titre, resume,
   points, pourquoi, impact, lecture, source, lien, sources, aSurveiller,
   accordSources}, ...] } — aSurveiller/accordSources absents des articles
   générés avant ce champ : toujours un tableau vide / null par défaut,
   jamais undefined (voir lib/db.js pour la migration ALTER TABLE).
   ============================================================ */

const { getSql, ensureWeeklyNewsTable } = require('../lib/db');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  try {
    const sql = getSql();
    await ensureWeeklyNewsTable(sql);

    const latest = await sql`SELECT MAX(week_start) AS week_start FROM weekly_news`;
    const weekStart = latest[0] && latest[0].week_start;
    if(!weekStart){
      res.setHeader('Cache-Control', 'no-store');
      res.status(404).json({error: 'Aucun article disponible pour le moment'});
      return;
    }

    const rows = await sql`
      SELECT categorie, slug, titre, resume, points, pourquoi, impact, lecture, source, lien, sources, a_surveiller, accord_sources, created_at
      FROM weekly_news
      WHERE week_start = ${weekStart}
      ORDER BY categorie ASC
    `;

    // 30 min de cache CDN : le contenu ne change qu'une fois par semaine.
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
    res.status(200).json({
      weekStart,
      articles: rows.map(r => ({
        categorie: r.categorie, slug: r.slug, titre: r.titre, resume: r.resume,
        points: r.points, pourquoi: r.pourquoi, impact: r.impact,
        lecture: r.lecture, source: r.source, lien: r.lien, sources: r.sources,
        aSurveiller: r.a_surveiller || [], accordSources: r.accord_sources || null,
        generatedAt: r.created_at
      }))
    });
  } catch(err){
    res.setHeader('Cache-Control', 'no-store');
    res.status(500).json({error: err.message});
  }
};
