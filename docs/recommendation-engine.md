# Recommendation Engine — écran de bilan & panneau de personnalisation

Documentation interne du chantier "Onboarding intelligent + Adaptive
Journey" (31/08-01/09/2026), phases 4 et 8. Ce document couvre ce que ce
chantier a changé dans la logique de recommandation existante — pour
l'infrastructure partagée (`renderPourquoiToggle`, `pickWeakestMasteryCategory`,
`getNextStepSuggestion`...), voir `docs/likanza-continuity.md` §4, non
dupliquée ici. Voir aussi `docs/onboarding.md` (le questionnaire) et
`docs/journey-engine.md` (continuité/absence/prérequis/profilage).

## 1. Une seule action prioritaire sur le bilan (phase 4)

Avant : `renderResults` (`test-positionnement.js`) affichait **tous** les
`LEARNING_PATHS` correspondant aux objectifs cochés, à plat, sans
hiérarchie — un utilisateur avec 3 objectifs voyait 3 cartes de parcours
sans indication de laquelle commencer.

Ordre de priorité (aucune deuxième logique inventée, réutilise l'existant) :

```
1. primaryGoal (docs/onboarding.md §2), si un parcours lui correspond
2. getProfileTopDomainKeys() — objectifs puis intérêts, déjà utilisée par
   pickPrimaryDomainRecommendation (data.js) — jamais un second ordre de
   priorité dupliqué
3. matchedPaths[0] (repli)
```

Résultat : un seul parcours mis en avant, au plus 2 alternatives repliées
sous "Autres parcours possibles". `renderPourquoiToggle` (Continuité phase
2, réutilisé tel quel) explique le choix avec les vrais signaux ayant
motivé la priorisation — jamais une justification générique.

`"general"` (objectif sans domaine réel) ne génère toujours aucun parcours
fantôme — comportement hérité, non modifié par cette phase.

## 2. Chapitres testés (couverture, pas une liste de cas)

- 1 seul objectif coché → un seul parcours correspondant → forcément
  prioritaire, aucune section "alternatives".
- Plusieurs objectifs, `primaryGoal` résolu → son parcours toujours en tête,
  même si un autre objectif a été coché en premier.
- 3 objectifs réels + `"general"` → jamais plus de 2 alternatives affichées,
  quel que soit le nombre de vrais parcours correspondants.

Voir `test-onboarding-phase4-single-primary-path.js` et les personas
"Investisseur"/"Mixte" de `test-onboarding-phase9-personas-integration.js`
(scratchpad de test, pas commité au dépôt du site).

## 3. Panneau de personnalisation étendu (phase 8)

`renderPersonalizationPanel` (Continuité phase 8) — **étendu, pas dupliqué** :

- **Objectif principal** : affiché en lecture seule dans la carte "Mes
  objectifs" existante ; un `<select>` éditable apparaît uniquement quand
  **plusieurs** objectifs sont réellement cochés (`checkedGoals.length > 1`)
  — avec un seul objectif coché, il n'y a rien à arbitrer entre plusieurs
  choix, donc aucun contrôle fabriqué. Le sélecteur ne propose jamais un
  objectif non coché par l'utilisateur.
- **Projets de vie** : nouvelle carte "Mes projets de vie" (visible
  seulement si `getLifeProjects().length > 0` — jamais une carte vide
  fabriquée), réutilise `getLifeProjects()`/`LIFE_PROJECT_CATEGORY_META`
  (Continuité phase 4 / Onboarding phase 2). Lien "Gérer mes projets →" vers
  `laboratoire.html#tab-budget-epargne` — exactement la même destination que
  le widget Dashboard `life-projects`, jamais un second éditeur créé pour ce
  chantier.
- **Réinitialisation** : efface désormais aussi `primaryGoal`/`subGoal` en
  plus de `interests`/`learningStyle`/`goals`/`objectif` — ces deux champs
  sont dérivés des objectifs, il serait incohérent de les garder après avoir
  effacé les objectifs eux-mêmes. L'XP/progression réelle reste, comme
  avant, strictement intacte.

## 4. Hors scope de ce chantier (avec raison)

- Scoring numérique pondéré pour classer les parcours — l'ordre de priorité
  ci-dessus reste branch-based (if/else), cohérent avec le reste du moteur
  de recommandation (`docs/likanza-continuity.md` §4).
- `renderNextStepRecommendation` (widget Dashboard `next-step`, devient
  inerte une fois tous les domaines évalués) — limite déjà connue et
  documentée avant ce chantier, non corrigée ici (nécessiterait de revoir sa
  logique de fond).
