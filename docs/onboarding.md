# Onboarding intelligent — Likanza Academy

Documentation interne du chantier "Onboarding intelligent + Adaptive Journey"
(31/08-01/09/2026). Audit (3 agents) publié en artifact "Onboarding
intelligent" ; ce document décrit `test-positionnement.js`/`.html` après les
9 phases du chantier. Voir aussi `docs/journey-engine.md` (continuité/
absence/prérequis/profilage progressif) et `docs/recommendation-engine.md`
(logique de recommandation sur l'écran de bilan et le panneau de
personnalisation) — ce document se concentre sur le questionnaire lui-même.

**Principe directeur** : avant ce chantier, l'onboarding était un
questionnaire fixe à 4 étapes, 100% déclaratif, zéro branchement. L'objectif
n'était pas de le remplacer par une IA conversationnelle, mais d'ajouter un
petit nombre de branchements réels (là où une vraie réponse change utilement
la suite) sans jamais transformer le test en interrogatoire — les nouvelles
étapes ne posent une question que quand elle a une vraie réponse à proposer.

## 1. Étapes (ordre réel, conditionnel)

```
Objectifs (posGoals, toujours)
  │
  ├─ >1 objectif coché → Objectif principal (posPrimaryGoal, phase 1)
  │
  ├─ objectif principal résolu ∈ {stockMarket, business, personalFinance}
  │     → Sous-objectif adaptatif (posSubGoal, phase 1, POSITIONING_SUBGOALS)
  │
  ├─ Projet concret ? (posProject, phase 2, skippable)
  │     └─ catégorie réelle choisie → Horizon approximatif (posProjectHorizon, phase 2)
  │
  Centres d'intérêt (posInterests, toujours)
  Niveaux déclarés par domaine (posLevels, toujours)
  Manière d'apprendre + confort au risque (posStyle, toujours)
        │
        ▼
  Bilan (posResults) — voir docs/recommendation-engine.md
```

`computeTotalSteps()` recalcule le nombre réel d'étapes à chaque changement
de réponse — le compteur "X / N" affiché reste honnête, jamais une précision
fictive calculée sur le pire cas.

Un utilisateur qui coche un seul objectif sans sous-question adaptative
disponible (`crypto`, `realEstate`, `economics`, `general`) traverse
exactement les 4 étapes historiques — le chantier n'a strictement rien
ajouté pour ce cas.

## 2. Objectif principal + sous-objectif adaptatif (phase 1)

- `primaryGoal` : résolu automatiquement (`goalKeys[0]`) s'il n'y a qu'un
  seul objectif coché ; sinon un choix explicite est demandé (`posPrimaryGoal`).
  Jamais deviné autrement.
- `POSITIONING_SUBGOALS` (app.js, juste après `POSITIONING_GOALS`) : un vrai
  jeu de sous-questions seulement pour les 3 domaines où le prompt d'origine
  en fournissait des exemples concrets (`stockMarket`, `business`,
  `personalFinance`) — jamais une question fabriquée pour les autres
  domaines. Étendre `POSITIONING_SUBGOALS` à un nouveau domaine est le seul
  geste nécessaire pour lui donner, lui aussi, une question adaptative.
- Les deux valeurs sont écrites dans `fzr-profile` (`primaryGoal`, `subGoal`)
  et `fzr-positioning-result`, jamais un troisième champ séparé.

## 3. Capture de projet minimal (phase 2)

Étape volontairement minimale : catégorie + horizon approximatif, **jamais**
un montant ni une date exacte à l'onboarding (le prompt d'origine l'exclut
explicitement).

- Restreint aux 7 vraies `LIFE_PROJECT_CATEGORIES` (immobilier/entreprise/
  mariage/voyage/etudes/famille/autre, voir `docs/likanza-continuity.md` §1
  côté Context Engine / Projets de vie). Une idée de projet qui ne
  correspond à aucune vraie catégorie tombe honnêtement sous "Autre", jamais
  une catégorie inventée.
- `LIFE_PROJECT_HORIZONS` (data.js, 6 buckets : "moins de 6 mois" → "je ne
  sais pas encore") : nouveau champ optionnel `horizonApprox` sur
  `saveLifeProject()`. `dateCible` reste `null` — jamais une date précise
  fabriquée à partir d'un bucket approximatif.
- Écrit directement via `saveLifeProject()` (Continuité phase 4) : aucun
  second système de projets, le widget Dashboard `project-skill-gap` et le
  panneau de personnalisation (`docs/recommendation-engine.md` §3) voient le
  projet immédiatement, sans code de pont supplémentaire.

## 4. Version du questionnaire + pont vers le quiz approfondi (phase 3)

- `ONBOARDING_VERSION` (data.js, juste après `getPositioningResult()`) —
  vit dans data.js et non dans `test-positionnement.js` car il doit être
  lisible sur **chaque page** (le bandeau de re-onboarding, voir
  `docs/journey-engine.md` §2, vit dans `renderDashboardHeader`). Incrémenter
  cette constante (jamais ailleurs) est le seul geste nécessaire pour
  resurfacer l'invitation à un utilisateur déjà onboardé, la prochaine fois
  qu'une évolution du questionnaire le justifie.
- Écran de bilan : un vrai bouton "Faire le diagnostic →" vers
  `quiz-approfondi.html?domaine=<primaryGoal>` apparaît uniquement quand un
  objectif principal est résolu vers un vrai domaine — avant ce chantier,
  seule une phrase en prose mentionnait le quiz approfondi, sans lien direct.

## 5. Ce qui reste délibérément hors de ce fichier

- Le quiz approfondi (`quiz-approfondi.js`) reste **non-adaptatif au sein
  d'une session** — décision déjà actée avant ce chantier (le rendre
  adaptatif rendrait l'évaluation de niveau circulaire), non rouverte.
- Aucun sélecteur "combien de temps as-tu aujourd'hui" n'a été ajouté — hors
  scope explicite de ce chantier (indépendant de la compréhension de
  l'utilisateur, chantier à part entière).
- Le comportement du bilan (parcours recommandé, explicabilité) est
  documenté dans `docs/recommendation-engine.md`, pas ici.
