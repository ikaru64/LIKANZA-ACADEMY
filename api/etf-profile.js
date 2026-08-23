/* ============================================================
   LIKANZA ACADEMY — Fonction serverless Vercel : /api/etf-profile
   Profil réel d'un fonds/ETF (frais, composition, encours) pour la
   fiche marché (marche.html, assetType 'etf'). Utilise
   lib/yahoo.js:fetchFundProfile — même mécanisme cookie+crumb que
   /api/company-profile, moins stable que les autres routes Yahoo du
   site (endpoint non public/non documenté). Cache CDN pour limiter
   la fréquence des appels.

   Requête  : GET /api/etf-profile?symbol=SPY          (un seul symbole,
                  réponse = objet direct)
              GET /api/etf-profile?symbols=SPY,CW8.PA   (jusqu'à 15, taille
                  du catalogue ETF_CATALOG côté site)
   Réponse  : {family, categoryName, legalType, expenseRatio, totalAssets,
               yield, holdings:[{symbol,name,weight}], sectorWeightings:[...],
               allocation:{stock,bond,cash,other,preferred,convertible}|null}
   ou, en mode batch : { updatedAt, funds:[...], errors:[...] }
   Vérifié en direct (2026-08-23) : la disponibilité est réellement inégale
   selon le domicile du fonds (ETF US vs UCITS EU) — chaque champ absent
   reste null, jamais un repli inventé. La page appelante affiche alors
   "Donnée indisponible" pour ce champ précis, jamais pour la fiche entière.
   ============================================================ */

const { fetchFundProfile, getYahooCrumb } = require('../lib/yahoo');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const singleSymbol = (req.query && req.query.symbol || '').trim();
  const rawSymbols = (req.query && req.query.symbols || '').trim();
  const isBatch = !!rawSymbols;
  const symbols = [...new Set((isBatch ? rawSymbols : singleSymbol).split(',').map(s => s.trim()).filter(Boolean))].slice(0, 15);

  if(symbols.length === 0){
    res.setHeader('Cache-Control', 'no-store');
    res.status(400).json({error: 'Symbole manquant'});
    return;
  }

  try {
    const crumbCtx = await getYahooCrumb(); // un seul crumb partagé pour toute la requête, même en mode batch
    const settled = await Promise.allSettled(symbols.map(s => fetchFundProfile(s, crumbCtx)));
    const funds = [];
    const errors = [];
    settled.forEach((r, i) => {
      if(r.status === 'fulfilled') funds.push({symbol: symbols[i], ...r.value});
      else errors.push(`${symbols[i]} : ${r.reason && r.reason.message ? r.reason.message : String(r.reason)}`);
    });

    if(funds.length === 0){
      res.setHeader('Cache-Control', 'no-store');
      res.status(502).json({error: 'Aucun profil disponible', errors});
      return;
    }

    res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');
    if(!isBatch) res.status(200).json(funds[0]);
    else res.status(200).json({updatedAt: new Date().toISOString(), funds, errors});
  } catch(err){
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({error: err.message});
  }
};
