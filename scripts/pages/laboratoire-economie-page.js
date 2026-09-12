/* ============================================================
   LIKANZA ACADEMY — Laboratoire Macro / Économie (laboratoire-economie.html)
   Extrait de scripts/pages/laboratoire.js (Chantier E, refonte continuité UX
   du 12/09/2026) : ce contenu vivait auparavant comme 8e onglet (tab-economie)
   DANS la page du Laboratoire Personnel, ce qui contredisait le picker de
   labo-financier.html (qui présente déjà Personnel/Professionnel/Économie
   comme 3 univers frères). Extraction pure, aucun changement de logique :
   ce bloc ne dépendait déjà d'aucun état local à laboratoire.js (LAB_TABS,
   labActiveTab...), uniquement de fonctions globales déjà réelles
   (data.js/historical-data.js) — voir le commentaire de chaque fonction
   ci-dessous pour ses dépendances déjà existantes.
   ============================================================ */
// ============================================================
// ---------- Laboratoire économique (tab-economie, section 4 du prompt
// "Extension intelligente des domaines") : scénarios qualitatifs de choc
// macro. Jamais une prédiction chiffrée — chaque effet explique son
// mécanisme, jamais un simple "X monte donc Y baisse" (section 30). 4 des
// 5 scénarios du prompt (taux, inflation, chômage, droits de douane) ;
// dépenses publiques en phase suivante, jamais un onglet à moitié rempli
// pour atteindre un chiffre rond. ----------
// ============================================================
const ECO_LAB_SCENARIOS = [
  {
    id: 'taux-hausse',
    icon: '🏦',
    titre: 'La banque centrale augmente son taux directeur de 1 point',
    hypotheses: "Hausse isolée de 1 point de pourcentage, toutes choses égales par ailleurs — dans la réalité, plusieurs variables évoluent en même temps (croissance, anticipations déjà présentes dans les prix, contexte international).",
    effets: [
      {domaine: 'Obligations', effet: 'Le prix des obligations déjà émises baisse généralement.', mecanisme: "Une obligation existante verse un coupon fixe, décidé à son émission. Si les nouvelles obligations offrent un coupon plus élevé (aligné sur le nouveau taux), l'ancienne devient relativement moins attractive : son prix doit baisser pour offrir à un nouvel acheteur un rendement comparable."},
      {domaine: 'Actions', effet: 'Peut peser sur certaines valorisations, plus particulièrement les entreprises à forte croissance attendue.', mecanisme: "La valorisation d'une action reflète en théorie l'actualisation de ses bénéfices futurs ; un taux d'actualisation plus élevé réduit la valeur actuelle de bénéfices lointains. L'effet varie fortement selon le secteur, l'endettement de l'entreprise et si la hausse était déjà anticipée par le marché."},
      {domaine: 'Immobilier', effet: "Le crédit devient plus cher, ce qui peut réduire la capacité d'emprunt des acheteurs.", mecanisme: "Les taux des nouveaux crédits immobiliers suivent généralement, avec un délai, l'évolution du taux directeur. À mensualité égale, un taux plus élevé réduit le capital empruntable — ce qui peut peser sur la demande et donc sur les prix."},
      {domaine: 'Crédit', effet: 'Le coût de tout nouvel emprunt (consommation, entreprise) augmente.', mecanisme: "Les banques répercutent en partie la hausse du taux directeur sur leurs propres taux, avec une ampleur et un délai qui dépendent de la concurrence bancaire et de leur coût de refinancement sur le marché interbancaire."}
    ],
    limites: "Scénario simplifié et isolé : dans la réalité, l'ampleur et la rapidité de ces effets dépendent fortement du contexte (croissance déjà forte ou faible, niveau de dette, anticipations déjà intégrées dans les prix)."
  },
  {
    id: 'inflation-choc',
    icon: '📉',
    titre: "L'inflation passe de 2 % à 6 %",
    hypotheses: "Choc d'inflation isolé — sans présumer de la réaction de la banque centrale ni de sa durée (une inflation temporaire et une inflation durablement ancrée n'ont pas les mêmes conséquences).",
    effets: [
      {domaine: 'Pouvoir d\'achat', effet: 'Le pouvoir d\'achat de l\'épargne non rémunérée diminue.', mecanisme: "Si les prix augmentent de 6 %/an et qu'une épargne rapporte 2 %, son rendement réel (rendement nominal moins inflation) devient négatif : le montant affiché augmente, mais ce qu'il permet d'acheter diminue."},
      {domaine: 'Banque centrale', effet: 'Incite généralement la banque centrale à relever ses taux directeurs pour contenir l\'inflation.', mecanisme: "La plupart des banques centrales ciblent une inflation proche de 2 %/an. Un écart important les pousse typiquement à durcir leur politique monétaire (hausse des taux) pour freiner la demande — avec les effets décrits dans le scénario \"hausse des taux\" ci-dessus."},
      {domaine: 'Obligations', effet: 'Le rendement réel des obligations à taux fixe déjà émises se dégrade.', mecanisme: "Un coupon fixe perd de sa valeur réelle si l'inflation augmente, puisqu'il achète de moins en moins de biens et services au fil du temps — sauf pour les obligations indexées sur l'inflation, conçues spécifiquement pour ce risque."},
      {domaine: 'Salaires & entreprises', effet: "Les entreprises dont les coûts augmentent plus vite que leurs prix de vente voient leurs marges se compresser.", mecanisme: "Toutes les entreprises ne peuvent pas répercuter une hausse de coûts sur leurs prix de vente au même rythme (pouvoir de fixation des prix inégal selon le secteur et la concurrence) — d'où des effets très hétérogènes d'un secteur à l'autre."}
    ],
    limites: "L'ampleur des effets dépend fortement de si le choc est perçu comme temporaire (ex. lié à l'énergie) ou durable, et de la crédibilité de la banque centrale à le contenir — deux éléments impossibles à connaître à l'avance avec certitude."
  },
  {
    id: 'chomage-hausse',
    icon: '💼',
    titre: 'Le chômage augmente fortement',
    hypotheses: "Hausse marquée et rapide du taux de chômage, sans présumer de sa cause (choc externe, ralentissement conjoncturel, restructuration sectorielle...).",
    effets: [
      {domaine: 'Consommation', effet: 'La consommation des ménages tend à ralentir.', mecanisme: "Une hausse du chômage réduit le revenu agrégé des ménages et augmente l'incertitude sur l'emploi futur, ce qui pousse généralement à une épargne de précaution plus élevée et des achats différés, notamment pour les biens durables."},
      {domaine: 'Banque centrale', effet: 'Peut inciter la banque centrale à assouplir sa politique monétaire (baisse des taux), selon son mandat.', mecanisme: "Certaines banques centrales (comme la Fed) ont un double mandat stabilité des prix + emploi maximum ; une hausse du chômage peut alors peser en faveur d'une baisse des taux pour soutenir l'activité — sauf si l'inflation reste elle-même élevée, ce qui crée un arbitrage difficile."},
      {domaine: 'Immobilier', effet: 'La demande de logements peut se tasser, en particulier dans les secteurs/régions les plus touchés.', mecanisme: "L'achat d'un logement dépend fortement de la stabilité perçue des revenus futurs (nécessaire pour obtenir un crédit et s'engager sur 15-25 ans) : une hausse du chômage rend les banques plus prudentes sur l'octroi de crédit et les ménages plus hésitants à s'engager."},
      {domaine: 'Entreprises', effet: 'Le risque de crédit (impayés, défauts) augmente pour les entreprises exposées à la consommation.', mecanisme: "Une baisse de la consommation et des revenus des ménages réduit le chiffre d'affaires des entreprises qui en dépendent le plus directement (commerce, services), ce qui peut fragiliser leur capacité à rembourser leurs propres dettes."}
    ],
    limites: "L'ampleur de ces effets dépend du secteur touché, de la rapidité de la hausse, et des filets de sécurité sociale en place (assurance chômage) qui amortissent en partie le choc sur la consommation."
  },
  {
    id: 'droits-douane',
    icon: '🚢',
    titre: 'Un pays impose 20 % de droits de douane sur ses importations',
    hypotheses: "Mesure isolée et unilatérale, sans présumer de la réaction des pays visés (aucune mesure de rétorsion supposée dans ce scénario de base) ni du secteur précis concerné.",
    effets: [
      {domaine: 'Prix & consommateurs', effet: 'Les prix des produits importés visés augmentent généralement pour les consommateurs du pays qui impose la taxe.', mecanisme: "Le droit de douane est payé à l'entrée du territoire par l'importateur, qui répercute tout ou partie de ce coût sur son prix de vente final. La part réellement répercutée dépend du pouvoir de négociation entre l'exportateur (qui peut baisser sa marge) et l'importateur/consommateur local."},
      {domaine: 'Entreprises nationales concurrentes', effet: 'Les entreprises locales produisant des biens équivalents peuvent gagner en compétitivité-prix face aux produits importés désormais plus chers.', mecanisme: "En rendant les produits étrangers relativement plus chers, le droit de douane réduit la pression concurrentielle sur les producteurs nationaux du même secteur — un effet protecteur, mais qui ne dit rien de leur efficacité ou innovation réelle."},
      {domaine: 'Importations / exportations', effet: 'Le volume d\'importations du bien visé tend à diminuer.', mecanisme: "Un prix plus élevé réduit mécaniquement la quantité demandée, selon la sensibilité des acheteurs au prix (élasticité) : plus il existe des alternatives locales ou d'autres pays fournisseurs non taxés, plus la baisse des importations visées sera marquée."},
      {domaine: 'Devise', effet: 'L\'effet sur le taux de change du pays qui impose la mesure est ambigu et dépend du contexte.', mecanisme: "Une baisse des importations peut réduire la demande de devise étrangère (soutien à la monnaie locale), mais des mesures de rétorsion ou une perte de confiance des investisseurs peuvent jouer en sens inverse — aucun effet mécanique unique ne s'impose ici."},
      {domaine: 'Inflation', effet: 'Peut contribuer à une hausse générale des prix si les biens visés sont largement consommés ou utilisés comme intrants par d\'autres entreprises.', mecanisme: "Quand les biens taxés sont des composants utilisés dans d'autres chaînes de production locales (voir Chaînes d'approvisionnement), leur surcoût se propage aux produits finaux qui en dépendent, au-delà du seul bien directement visé par la taxe."}
    ],
    limites: "Ce scénario isole l'effet d'une mesure unilatérale et ignore volontairement les mesures de rétorsion possibles du ou des pays visés (qui peuvent imposer leurs propres droits de douane en retour), ainsi que les effets de plus long terme sur les chaînes d'approvisionnement mondiales."
  }
];

function renderEcoLabScenarios(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  el.innerHTML = ECO_LAB_SCENARIOS.map(s => `
    <details class="card" style="margin-bottom:14px;">
      <summary style="cursor:pointer;list-style:none;">
        <span class="smallcaps">${s.icon} Scénario</span>
        <h3 style="margin:8px 0 0;font-size:17px;">${s.titre}</h3>
      </summary>
      <div style="margin-top:14px;">
        ${renderDataBadge('scenario')}
        <p style="font-size:12.5px;color:var(--text-dim);margin:10px 0 14px;"><strong style="color:var(--text);">Hypothèses :</strong> ${s.hypotheses}</p>
        ${s.effets.map(e => `
          <div style="margin-bottom:12px;padding-left:12px;border-left:2px solid var(--hairline);">
            <p style="font-size:13.5px;font-weight:600;">${e.domaine} <span style="font-weight:400;color:var(--text-dim);">— ${e.effet}</span></p>
            <p style="font-size:12.5px;color:var(--text-dim);margin-top:4px;">${e.mecanisme}</p>
          </div>`).join('')}
        <p class="disclaimer-box" style="margin-top:12px;">${s.limites} Ce scénario est une illustration pédagogique du mécanisme économique, jamais une prédiction sur ce qui va réellement se passer.</p>
      </div>
    </details>`).join('');
}
safeRun('laboratoire économique', () => renderEcoLabScenarios('ecoLabScenarios'));

// ---------- Simulateur "Gouverneur de banque centrale" (tab-economie) : moteur
// pur dans scripts/data.js (initGovernorState/applyGovernorDecision/
// scoreGovernorGame), aucune donnée réelle ici — modèle pédagogique simplifié,
// même esprit que les scénarios qualitatifs ci-dessus (jamais présenté comme
// une prédiction). Historique de parties : likanza-gouverneur-history. ----------
function getGovernorHistory(){ return safeGetJSON('likanza-gouverneur-history', []); }
function saveGovernorResult(entry){
  const history = getGovernorHistory();
  history.unshift(entry);
  safeSetJSON('likanza-gouverneur-history', history.slice(0, 20));
}

function renderGovernorSim(elId){
  const el = document.getElementById(elId);
  if(!el) return;
  let state = null;

  function fmtPt(x){ return `${x >= 0 ? '+' : ''}${x.toFixed(2)} pt`; }

  function renderIntro(){
    el.innerHTML = `
      <p style="color:var(--text-dim);font-size:13px;line-height:1.6;margin-bottom:14px;max-width:70ch;">Tu es gouverneur de banque centrale pendant ${GOVERNOR_ROUNDS} trimestres. À chaque tour, ajuste le taux directeur en réaction à l'inflation et au chômage — l'effet de ta décision ne se voit qu'au tour SUIVANT (délai de transmission réel de la politique monétaire), jamais instantanément. Objectif : rapprocher l'inflation de sa cible (${GOVERNOR_TARGET_INFLATION}%) et le chômage de son niveau "naturel" (${GOVERNOR_NATURAL_UNEMPLOYMENT}%) — un double mandat, comme dans la réalité.</p>
      <div class="disclaimer-box">Modèle pédagogique volontairement simplifié : les chocs et les coefficients de transmission sont illustratifs, jamais une prédiction réelle. Voir le laboratoire économique ci-dessus pour les mécanismes qualitatifs détaillés.</div>
      <button class="btn btn-gold" id="${elId}-start" type="button" style="margin-top:16px;">Prendre mes fonctions</button>`;
    document.getElementById(`${elId}-start`).addEventListener('click', () => { state = initGovernorState(); renderRound(); });
  }

  function renderRound(){
    const s = state;
    const event = GOVERNOR_EVENTS[s.round % GOVERNOR_EVENTS.length];
    const pct = Math.round((s.round / GOVERNOR_ROUNDS) * 100);
    const lastEntry = s.history[s.history.length - 1];

    el.innerHTML = `
      <div class="mono" style="font-size:11px;color:var(--text-dim);display:flex;justify-content:space-between;margin-bottom:6px;">
        <span>Trimestre ${s.round + 1} / ${GOVERNOR_ROUNDS}</span><span>Taux directeur actuel : ${s.tauxDirecteur.toFixed(2)}%</span>
      </div>
      <div class="dash-weekbar" style="width:100%;margin-bottom:16px;"><div class="dash-weekfill" style="width:${pct}%;"></div></div>
      ${lastEntry ? `<p class="disclaimer-box" style="margin-bottom:14px;">Au tour précédent, tu as ${lastEntry.decision >= 0 ? 'monté' : 'baissé'} le taux de ${fmtPt(lastEntry.decision)} (${lastEntry.tauxAvant.toFixed(2)}% → ${lastEntry.tauxApres.toFixed(2)}%). Effet visible ce tour-ci (avec délai).</p>` : ''}
      <div class="card-grid" style="grid-template-columns:repeat(auto-fit,minmax(120px,1fr));margin-bottom:16px;">
        <div class="card"><span class="smallcaps">Inflation</span><div class="result-big" style="font-size:20px;margin-top:6px;color:${Math.abs(s.inflation - GOVERNOR_TARGET_INFLATION) <= 0.5 ? 'var(--emerald)' : 'var(--bordeaux)'};">${s.inflation.toFixed(1)}%</div><p style="font-size:11px;color:var(--text-dim);margin-top:4px;">Cible : ${GOVERNOR_TARGET_INFLATION}%</p></div>
        <div class="card"><span class="smallcaps">Chômage</span><div class="result-big" style="font-size:20px;margin-top:6px;color:${Math.abs(s.chomage - GOVERNOR_NATURAL_UNEMPLOYMENT) <= 0.5 ? 'var(--emerald)' : 'var(--bordeaux)'};">${s.chomage.toFixed(1)}%</div><p style="font-size:11px;color:var(--text-dim);margin-top:4px;">Niveau naturel : ${GOVERNOR_NATURAL_UNEMPLOYMENT}%</p></div>
        <div class="card"><span class="smallcaps">Croissance</span><div class="result-big" style="font-size:20px;margin-top:6px;color:${s.croissance >= 0 ? 'var(--emerald)' : 'var(--bordeaux)'};">${s.croissance >= 0 ? '+' : ''}${s.croissance.toFixed(1)}%</div></div>
      </div>
      <p style="font-size:13px;margin-bottom:14px;">📰 ${event.titre}</p>
      <span class="smallcaps" style="display:block;margin-bottom:8px;">Ta décision sur le taux directeur</span>
      <div style="display:flex;gap:8px;flex-wrap:wrap;" id="${elId}-decisions">
        ${[-1, -0.5, -0.25, 0, 0.25, 0.5, 1].map(d => `<button type="button" class="pill decision-btn" data-delta="${d}">${d > 0 ? '+' : ''}${d}</button>`).join('')}
      </div>`;

    el.querySelectorAll('.decision-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state = applyGovernorDecision(state, +btn.dataset.delta);
        if(state.done) renderBilan(); else renderRound();
      });
    });
  }

  function renderBilan(){
    const s = state;
    const {score, avgLoss, label} = scoreGovernorGame(s);

    tryAwardQuizPoints(`gouverneur-${new Date().toDateString()}`, 15, {usedSimulator: true});
    recordAnswer('Inflation', score >= 550, true, 'intermediaire');
    saveGovernorResult({date: new Date().toISOString(), score, label, history: s.history});

    el.innerHTML = `
      <div class="card">
        <span class="smallcaps">Bilan de mandat</span>
        <div class="result-big" style="margin-top:6px;">${score} / 1000</div>
        <p style="font-size:14px;margin-top:4px;color:${score >= 800 ? 'var(--emerald)' : score >= 550 ? 'var(--gold-bright)' : 'var(--bordeaux)'};">${label}</p>
      </div>
      <p style="font-size:13px;color:var(--text-dim);margin:14px 0;">Ce score mesure l'écart moyen (au carré) entre l'inflation/le chômage observés à chaque tour et leurs cibles (${GOVERNOR_TARGET_INFLATION}% et ${GOVERNOR_NATURAL_UNEMPLOYMENT}%) — plus l'écart cumulé est faible, plus le score est élevé. C'est une version simplifiée du type d'arbitrage que formalisent certaines banques centrales à double mandat (stabilité des prix + emploi).</p>
      <span class="smallcaps" style="display:block;margin-bottom:8px;">Historique du mandat</span>
      <div style="overflow-x:auto;">
        <table class="mono" style="width:100%;font-size:12px;border-collapse:collapse;">
          <thead><tr style="text-align:left;color:var(--text-dim);"><th style="padding:4px 8px;">Trimestre</th><th style="padding:4px 8px;">Taux</th><th style="padding:4px 8px;">Décision</th><th style="padding:4px 8px;">Inflation</th><th style="padding:4px 8px;">Chômage</th></tr></thead>
          <tbody>
            ${s.history.map(h => `<tr style="border-top:1px solid var(--hairline);"><td style="padding:4px 8px;">${h.round + 1}</td><td style="padding:4px 8px;">${h.tauxAvant.toFixed(2)}%</td><td style="padding:4px 8px;">${fmtPt(h.decision)}</td><td style="padding:4px 8px;">${h.inflationAvant.toFixed(1)}%</td><td style="padding:4px 8px;">${h.chomageAvant.toFixed(1)}%</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
      <p class="disclaimer-box" style="margin-top:14px;">Modèle pédagogique simplifié : en réalité, une banque centrale agit avec bien plus d'informations, d'incertitude sur les délais de transmission, et de contraintes (crédibilité, coordination internationale...) que ce moteur illustratif ne peut représenter.</p>
      <button class="btn btn-sm btn-gold" id="${elId}-restart" style="margin-top:10px;">Nouveau mandat</button>
      <div id="${elId}-nextstep"></div>`;
    document.getElementById(`${elId}-restart`).addEventListener('click', renderIntro);
    renderNextStepCard(`${elId}-nextstep`, {domainKey: 'economics'});
  }

  renderIntro();
}
safeRun('simulateur gouverneur de banque centrale', () => renderGovernorSim('governorSim'));
