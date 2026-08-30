# Carte des relations de contenu — Likanza Academy

Complément à `likanza-continuity.md` (chantier Continuité, 30/08/2026). Décrit
comment chaque type de contenu du site se relie réellement aux autres
aujourd'hui, pour faciliter l'ajout futur de contenu sans casser ou dupliquer
une relation existante. Chaque flèche ci-dessous cite la fonction/le champ
réel qui l'implémente — jamais une relation aspirationnelle non codée.

## Vue d'ensemble

```
                    LIBRARY (terme, ~262 entrées)
                         │  prerequis[] (concept graph)
                         │
      ┌──────────────────┼──────────────────┬──────────────────┐
      │                  │                  │                  │
      ▼                  ▼                  ▼                  ▼
  COURS_CATALOG      DOMAINS          BUSINESS_PROBLEMS    ACTUALITÉS
  .libraryTermes[]   .quizCategories   .libraryTermes[]    (findArticleConcepts,
  (fin de cours)     (~40% recoupe                          détection textuelle)
                      LIBRARY.terme)
      │                  │
      │                  ▼
      │            MENTAL_CHALLENGES / QUIZ_BANK_FULL
      │            .categorie (= DOMAINS.quizCategories)
      │
      ▼
  Chapitres (blocs "outil" → Lab/Business Lab, "approfondir" → LIBRARY)
```

## Relations par type de contenu

### Concept (LIBRARY.terme)
- **→ Concept** : `prerequis[]` (dépendance pédagogique, acyclique, vérifiée).
- **→ Cours** : `COURS_CATALOG[].libraryTermes[]` (référence directe, rendue en
  fin de cours par `renderCourseLibraryLinks`).
- **→ Catégorie de quiz** : pont partiel via `findLibraryEntryForCategorie()` /
  `findLibraryThemeForCategorie()` (~40% exact, le reste explicitement non
  ponté plutôt que forcé).
- **→ Actualité** : `findArticleConcepts(article)` — détection textuelle dans
  l'autre sens (l'article référence le concept, jamais l'inverse).
- **→ Bibliothèque (thème)** : `LIBRARY.categorie` (14 valeurs réelles), rendu
  par `bibliotheque.js` (`#theme:X`).

### Cours (COURS_CATALOG)
- **→ Concept** : `libraryTermes[]` (voir ci-dessus).
- **→ Cours** : `prerequis[]` (dépendance cours-à-cours, **système séparé** du
  `prerequis` de LIBRARY — ne jamais confondre les deux).
- **→ Catégorie de quiz** : `quizCategories[]`, consommé par `renderCoursQuiz`
  (validation de fin de cours) et par le rattachement domaine
  (`coursDomainKey`).
- **→ Outil (Lab/Business Lab)** : bloc de chapitre `type:'outil'`
  (`renderCourseBlock`), lien réel vers un calculateur existant — jamais un
  embed d'état JS live.
- **→ Défi** : lien "Te tester" en fin de cours vers `defis.html?cat=<categorie>`.
- **→ Reprise de position** : `fzr-last-position` (le cours et son chapitre
  exact), voir `renderCourseIntro`/`renderContinueWidget`.

### Défi / Mini-jeu (MENTAL_CHALLENGES, QUIZ_BANK_FULL)
- **→ Catégorie de quiz** : `categorie` (même espace que `DOMAINS.quizCategories`).
- **→ Domaine** : `domain` (`MENTAL_CHALLENGES`) — doit correspondre à
  `DOMAINS[].mentalChallengeDomain`, valeurs réelles :
  `Finance personnelle, Bourse, Business, Économie, Immobilier, Crypto`.
- **→ Skill Graph** : chaque réponse alimente `fzr-quiz-stats` via
  `recordAnswer`, jamais un score parallèle.
- **→ Concept (LIBRARY)** : `conceptsTested[]` — texte libre pédagogique
  descriptif, **pas** un vrai lien de graphe (seulement ~2% recoupent un
  `terme` exact) : ne jamais s'appuyer dessus pour une recommandation
  automatisée, seulement pour l'affichage humain.

### Laboratoire / Business Lab
- **→ Concept (LIBRARY)** : `renderCourseLibraryLinks([...])` inline par
  calculateur (ex. widget "Unit Economics" → CAC, LTV, Marge brute...).
- **→ Cours** : `renderRelatedCourseLink(coursId, chapitreLabel)` — pointe vers
  le cours entier (`cours.html#<id>`), jamais un chapitre précis (limite
  d'adressage documentée, assumée).
- **→ Prochaine étape** : `renderNextStepCard`/`getNextStepSuggestion`, le
  widget "prochaine étape" le plus réutilisé du site (39 sites d'appel).
- **→ Contexte de retour** : `writeContext`/`consumeContext` (Context Engine) —
  précédent réel : Business Game → Construire son projet
  (`fzr-context-business-strategy`).

### Business Case / Business Problem
- **→ Tag** : `BUSINESS_CASE_TAG_LABELS` — espace de noms séparé de LIBRARY,
  partagé entre `BUSINESS_CASES.tags[]` et `BUSINESS_PROBLEMS.tag` (le seul
  pont entre les deux structures).
- **→ Concept (LIBRARY)** : `BUSINESS_PROBLEMS.libraryTermes[]` (référence
  directe, contrairement à `BUSINESS_CASES` qui n'en a aucune).
- **→ Outil** : `BUSINESS_PROBLEMS.outil` (`{type:'lab'|'link', ...}`).
- **→ Données réelles** : `BUSINESS_CASES.ticker` (8/12 cas, entreprises encore
  cotées) → `loadCompanyFundamentals()`, utilisé par `analyser-entreprise.js`.

### Actualité (weekly/daily news, flux dynamique)
- **→ Concept (LIBRARY)** : `findArticleConcepts(article)` — seule relation
  calculée à la volée (jamais pré-taguée, le contenu vient d'une API externe).
- **→ Catégorie (thème large)** : `NEWS_CATEGORY_LINKS` (`renderNewsApprofondirLink`),
  4 vraies catégories pontées (Entreprise, Bourse, Crypto, Économie) —
  Géopolitique/Technologie/Matières premières explicitement non pontées,
  aucune catégorie LIBRARY réelle ne leur correspond.
- **→ Personnalisation** : `computeArticleRelevanceSignals(article)` — croise
  les concepts détectés avec `getSkillMastery()` (faiblesse réelle) et
  `getProfile().interests` (intérêt déclaré). Alimente la section "Pour vous"
  d'`actualites.html`.

### Marché (Bourse/Crypto — stocks, ETF, actifs)
- **→ Actualité** : `SECTOR_KEYWORDS`/`findThematicNews` (proximité de
  vocabulaire secteur ↔ actu, jamais une causalité affirmée).
- **→ Concept (LIBRARY)** : `renderWhyDrawer`/`WHY_FIELD_DEFINITIONS` — chaque
  indicateur financier affiché (PER, marge, ROE...) a sa propre explication
  contextuelle, pas un lien direct vers un `terme` LIBRARY (les deux
  vocabulaires ne se recoupent pas toujours exactement).

### Projet de vie (fzr-life-projects)
- **→ Catégorie de quiz** : `PROJECT_REQUIRED_CATEGORIES` (déterministe, 5 des
  7 catégories réelles ont une correspondance ; `etudes`/`autre` volontairement
  vides).
- **→ Recommandation** : `getProjectSkillGaps()` → widget Dashboard
  `project-skill-gap`.
- **→ Ligne du temps** : `computeLifeTimeline()` (dates cibles réelles
  uniquement, jamais extrapolées).

## Espaces de noms à ne jamais confondre

| Espace de noms | Où il vit | Usage |
|---|---|---|
| `LIBRARY.terme` | app.js | Glossaire, concept graph (`prerequis`) |
| `LIBRARY.categorie` (14 valeurs) | app.js | Thème Bibliothèque (`#theme:X`) |
| `DOMAINS.quizCategories` (~50 valeurs) | app.js | Tag de quiz/défi, mastery |
| `DOMAINS.libraryCategories` | app.js | = sous-ensemble de `LIBRARY.categorie` |
| `COURS_CATALOG.prerequis` | app.js | Dépendance cours-à-cours (PAS le concept graph) |
| `BUSINESS_CASE_TAG_LABELS` | business-cases-data.js | Tag problème/cas Business |
| `LIFE_PROJECT_CATEGORIES` (7 valeurs) | data.js | Catégorie de Projet de vie |

## Avant d'ajouter un nouveau type de contenu

1. Vérifier si un lien réel vers LIBRARY est possible (`renderCourseLibraryLinks`,
   existence-check déjà géré) — sinon ne pas fabriquer un lien.
2. Si le contenu est taggé par catégorie de quiz, vérifier qu'elle existe
   réellement dans `DOMAINS.quizCategories` avant de l'utiliser dans une
   recommandation (`pickWeakestMasteryCategory`, `getNextStepSuggestion`...).
3. Ne jamais créer un 5e espace de noms de "concept" — étendre l'un des
   quatre existants (§2 de `likanza-continuity.md`) ou, si vraiment
   nécessaire, documenter explicitement le nouveau pont ici.
