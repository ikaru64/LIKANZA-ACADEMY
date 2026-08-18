/* ============================================================
   LIKANZA ACADEMY — Fonction serverless Vercel : /api/company-profile
   Description réelle d'une société (secteur, industrie, effectif,
   résumé d'activité) ET fondamentaux réels (PER, marges, croissance,
   valorisation...) pour la fiche action détaillée et le Comparateur.
   Utilise lib/yahoo.js:fetchCompanyProfile — mécanisme cookie+crumb
   testé en direct avant intégration, mais moins stable que les autres
   routes Yahoo du site (endpoint non public/non documenté). Cache CDN
   pour limiter la fréquence des appels.

   Requête  : GET /api/company-profile?symbol=AAPL         (un seul symbole,
                  réponse = objet direct, rétro-compatible avec l'usage existant)
              GET /api/company-profile?symbols=AI.PA,TTE.PA (jusqu'à 8, Comparateur/
                  Fiches actions — 8 = taille fixe de STOCKS_DEMO)
   Réponse  : { sector, industry, website, employees, summary,
                fundamentals:{asOfDate, source, fields:{...|null}} }
   ou, en mode batch : { updatedAt, companies:[...], errors:[...] }
   Jamais de description ou de fondamental inventé — un champ absent de la
   réponse Yahoo reste `null`, la page appelante affiche alors "Donnée
   indisponible ou non suffisamment fiable".
   ============================================================ */

const { fetchCompanyProfile, getYahooCrumb } = require('../lib/yahoo');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const singleSymbol = (req.query && req.query.symbol || '').trim();
  const rawSymbols = (req.query && req.query.symbols || '').trim();
  const isBatch = !!rawSymbols;
  const symbols = [...new Set((isBatch ? rawSymbols : singleSymbol).split(',').map(s => s.trim()).filter(Boolean))].slice(0, 8);

  if(symbols.length === 0){
    res.setHeader('Cache-Control', 'no-store');
    res.status(400).json({error: 'Symbole manquant'});
    return;
  }

  try {
    const crumbCtx = await getYahooCrumb(); // un seul crumb partagé pour toute la requête, même en mode batch
    const settled = await Promise.allSettled(symbols.map(s => fetchCompanyProfile(s, crumbCtx)));
    const companies = [];
    const errors = [];
    settled.forEach((r, i) => {
      if(r.status === 'fulfilled') companies.push({symbol: symbols[i], ...r.value});
      else errors.push(`${symbols[i]} : ${r.reason && r.reason.message ? r.reason.message : String(r.reason)}`);
    });

    if(companies.length === 0){
      res.setHeader('Cache-Control', 'no-store');
      res.status(502).json({error: 'Aucun profil disponible', errors});
      return;
    }

    res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');
    if(!isBatch) res.status(200).json(companies[0]);
    else res.status(200).json({updatedAt: new Date().toISOString(), companies, errors});
  } catch(err){
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({error: err.message});
  }
};
