# Continuité & personnalisation Likanza Academy

Documentation interne du chantier "Continuité, personnalisation et interconnexion"
(30/08/2026). Audit complet (6 agents) publié en artifact "Continuité Likanza" ;
ce document décrit l'état du code après les 9 phases de ce chantier, pour
faciliter toute extension future.

**Principe directeur de tout ce chantier** : la plupart de l'infrastructure
demandée existait déjà, construite au fil de chantiers précédents (Financial
Lab, Formations, Dashboard) — le travail réel a été de **relier et
dédupliquer** l'existant, combler une poignée de trous réels, jamais de tout
reconstruire depuis zéro.

## 1. User Profile

Il n'existe **pas** un objet "profil" unique — c'est une décision du code déjà
en place, pas un défaut. Quatre systèmes distincts, chacun avec sa propre clé
`localStorage` et son propre accesseur, délibérément séparés :

| Système | Clé | Accesseur | Rôle |
|---|---|---|---|
| Profil déclaratif | `fzr-profile` | `getProfile()` / `saveProfile()` | age, épargne, horizon, risque, objectif, `levels{}`, `interests{}`, `learningStyle{}`, `goals{}` |
| Niveau curriculum | `fzr-level` | `getLevel()` / `setLevelStorage()` | palier de contenu débloqué (debutant→expert) |
| Gamification (XP) | `fzr-gamification` | `getGamification()` / `saveGamification()` | xp, financePoints, streak, badges — mesure l'**engagement**, jamais la compréhension |
| Maîtrise réelle | `fzr-quiz-stats` | `getQuizStats()` → `getSkillMastery()` | dérivé des vraies réponses aux quiz — voir §3 |

Profils métier séparés, chacun avec son propre éditeur complet (jamais dupliqué
ailleurs, seulement résumé — voir compte.html) :
- `fzr-investor-profile` (`games/investor-profile.js`) — risque investisseur à
  6 questions, plus précis que le profil général. Sync **volontairement à sens
  unique** vers `fzr-profile.risque` (jamais l'inverse — voir le commentaire à
  `games/investor-profile.js:114-119`). `renderProfileWidget` (data.js) affiche
  une note informative si les deux divergent, jamais une écriture forcée.
- `fzr-business-profile` (`getBusinessProfile()`/`saveBusinessProfile()`,
  data.js) — modèle économique quantitatif d'entreprise.

**Panneau utilisateur** : `renderPersonalizationPanel` (data.js) + section
"Ma personnalisation Likanza" sur `compte.html` — objectifs (lecture seule,
lien vers le test de positionnement), intérêts/manière d'apprendre
(réellement modifiables, mêmes options que `POSITIONING_INTERESTS`/
`POSITIONING_LEARNING_STYLES`), résumés investisseur/entreprise (lien vers le
vrai éditeur), et un bouton de réinitialisation qui n'efface jamais XP/cours/
quiz.

**Compte cloud** : OAuth (Google, via une app Next Auth séparée,
`likanza-auth.vercel.app`) + endpoint `/api/progress`. Sync en **snapshot
complet**, jamais de fusion champ par champ (`syncProgressWithAccount`,
data.js). Whitelist explicite `PROGRESS_SYNC_KEYS` — toute nouvelle clé de
vraie progression doit y être ajoutée manuellement (voir §7). Règle stricte :
**aucune clé `fzr-context-*` n'y est jamais ajoutée** (voir §5).

## 2. Knowledge Graph

`LIBRARY` (app.js, ~262 entrées) **est** le concept graph — pas une nouvelle
structure à créer. Chaque entrée : `{terme, categorie, niveau, lecture,
simple, detail, avance, exemple, avantages, inconvenients, erreurs,
prerequis?}`. `prerequis` (array de `terme` exacts) forme un graphe de
dépendances vérifié acyclique, rendu par `bibliotheque.js`.

**Quatre espaces de noms de "concept" coexistent**, seulement partiellement
pontés — à connaître avant tout ajout de fonctionnalité liée aux concepts :

| Espace de noms | Exemple | Pont vers LIBRARY.terme |
|---|---|---|
| `LIBRARY.terme` | "Taux directeur" | — (la référence) |
| `DOMAINS.quizCategories` | "Bourse", "PIB" | ~40% de recoupement exact ; pont via `findLibraryEntryForCategorie()`/`findLibraryThemeForCategorie()` (data.js, phase 3) |
| `MENTAL_CHALLENGES.conceptsTested` | "biais de récence" | texte libre pédagogique, ~2% de recoupement — jamais un vrai graphe |
| `BUSINESS_CASE_TAG_LABELS` | "cac", "retention" | aucun — espace totalement séparé |

`findLibraryEntryForCategorie(categorie)` (data.js) : correspondance exacte ou
variante parenthésée ("PIB"→"PIB (Produit intérieur brut)"). Retourne `null`
plutôt qu'un terme arbitraire depuis la phase 3 (l'ancien repli "premier terme
du domaine" produisait des liens sans rapport réel).

`findLibraryThemeForCategorie(categorie)` (data.js) : quand la catégorie de
quiz correspond à une catégorie LIBRARY entière (Bourse, Immobilier, Forex,
Gestion du risque, Psychologie de l'investisseur), propose le thème entier
(`bibliotheque.html#theme:X`) plutôt qu'un terme unique arbitraire.

`findArticleConcepts(article)` (data.js, phase 7) : détection textuelle réelle
(mot entier, jamais une sous-chaîne) des termes LIBRARY mentionnés dans un
article d'actualité — les articles viennent d'un flux dynamique
(`/api/weekly-news`), impossible à pré-tagger à la main.

## 3. Skill Graph

Déjà construit, séparé de l'XP dès la conception (voir commentaire à
`data.js:2286-2296` : *"un utilisateur pourrait être 'Analyste' en XP et à un
tout autre niveau de maîtrise réelle en même temps"*).

- `getSkillMastery()` — pct par catégorie de quiz (`weightedCorrect/weightedTotal`
  depuis `fzr-quiz-stats`), buckets `'faible'` (<50%), `'en cours'`, `'maîtrisé'`
  (≥75%). C'est la **source de vérité unique** de la maîtrise — tout code qui a
  besoin de savoir "l'utilisateur est-il faible sur X" doit passer par elle
  (ou par `pickWeakestMasteryCategory`, voir §4), jamais recalculer.
- `getConceptMastery(categorie)` — échelle à 4 paliers `decouvert→compris→
  applique→maitrise`, avec des seuils concrets documentés dans le code
  (data.js, section "concept mastery").
- `computeDomainMastery()` / `computeFinancialIQ()` — agrégats par domaine et
  score global, noms volontairement distincts de `LEVEL_TITLES` (XP).
- Répétition espacée (`fzr-spaced-repetition`, J+7/14/30) et difficulté
  adaptative en session (`startMixedSession`, `opts.livePool`) — déjà branchés
  sur cette même source, rien à changer.

## 4. Recommandations

Neuf widgets "recommandé"/"prochaine étape" existaient, dont quatre
réimplémentaient indépendamment "catégorie la plus faible/en échec" — corrigé
en phase 1 :

- `pickWeakestMasteryCategory(candidateCategories?)` (data.js) — catégorie
  `niveau==='faible'` la plus basse, filtre optionnel. Utilisée par
  `renderRecommandePourToi` (Défis) et `renderBusinessCasRecommande`
  (Business, filtré à `BUSINESS_SKILL_CATEGORIES`).
- `pickTopUnresolvedMistakeCategory()` (data.js) — catégorie avec le plus
  d'erreurs non résolues. Utilisée par `getNextStepSuggestion`,
  `renderDefisARevoir`, `renderMistakesDashboardWidget`.

**Explicabilité** (phase 2) : `renderPourquoiToggle(elId, signals)` — lien
dépliable "Pourquoi cette recommandation ?", rend les vrais signaux déjà
calculés par l'appelant, ne rend rien si `signals` est vide. Utilisé par les
2 widgets basés sur `pickWeakestMasteryCategory`.

**Honnêteté** (phase 2, section 70 du prompt d'origine) : un repli purement
rotatif (aucun signal réel derrière le choix) est labellé "🔎 À découvrir",
jamais "🎯 Recommandé pour toi" — ne jamais prétendre une personnalisation
sans donnée réelle pour la justifier.

**Projets de vie → écart de compétences** (phase 4) : `PROJECT_REQUIRED_CATEGORIES`
(data.js) — table déterministe (jamais une IA) reliant les 7 vraies catégories
de `LIFE_PROJECT_CATEGORIES` à de vraies catégories de quiz.
`getProjectSkillGaps(project)` croise avec `getSkillMastery()`. Widget
Dashboard `project-skill-gap` ("🧭 Pour ton projet").

**Autres widgets restés indépendants** (logique légitimement différente, pas
des doublons) : `renderNextStepRecommendation` (widget `next-step` du
Dashboard, basé sur "domaine sans quiz approfondi complété" — devient inerte
une fois tous les domaines évalués, limite connue, pas corrigée dans ce
chantier) ; `renderDefisParcours` (curriculum statique, pas une recommandation
adaptative).

## 5. Context Engine

Un seul vrai précédent existait avant ce chantier :
`fzr-business-strategy-transfer` (Business Game ↔ Construire son projet),
motif "écrire → naviguer → lire une fois → supprimer". Généralisé en phase 5 :

```js
writeContext(key, payload)   // écrit sous fzr-context-<key>
consumeContext(key)          // lit puis supprime immédiatement, ou null
```

**Règle stricte** : aucune clé `fzr-context-*` n'est jamais ajoutée à
`PROGRESS_SYNC_KEYS` — ce sont des contextes éphémères au sein d'une session
de navigation, jamais destinés à survivre à un rechargement ni à traverser
plusieurs appareils.

Premier cas d'usage réel : cliquer sur le lien d'un bloc `outil` dans un
chapitre de cours écrit un contexte `course-return` (`{url, label}`) ; le
bandeau universel `initCourseReturnBanner()` (exécuté sur **chaque page** via
le `DOMContentLoaded` déjà partagé) l'affiche sur la page de destination,
quelle qu'elle soit — jamais besoin de modifier chaque page de Lab
individuellement pour un nouveau cas d'usage futur. Depuis la réouverture de
l'adressage par chapitre (voir ci-dessous), ce contexte cible directement le
chapitre exact quitté (`cours.html#<id>:<chapitre-slug>`), pas seulement le
cours entier.

**Reprise de position** (phase 6, un système voisin mais distinct — persistant,
pas éphémère) : `fzr-last-position` (`getLastPosition()`/`saveLastPosition()`),
mis à jour à chaque chapitre affiché, toujours contre l'index dans le cours
**entier** (jamais une vue filtrée par format). `renderCourseIntro` propose
"Reprendre au chapitre N →" quand une position réelle et encore pertinente
existe (jamais si le cours est déjà terminé). Widget Dashboard `continue`
("▶ Continuer") — pointe directement vers le bon chapitre depuis la
réouverture de l'adressage par chapitre.

**Adressage par chapitre** (réouvert le 30/08/2026, après avoir été
explicitement laissé hors scope lors d'un chantier précédent) :
`cours.html#<coursId>:<chapitre-slug>` ouvre directement ce chapitre —
`#<coursId>` seul garde son comportement d'avant (écran d'introduction).
`coursCurrentId()`/`coursCurrentChapterSlug()` (cours.js) séparent le hash
sur son premier `:` (un id de cours n'en contient jamais). `renderCoursRich`
prend un paramètre optionnel `targetChapterSlug` : un slug qui ne correspond
à aucun vrai chapitre retombe silencieusement sur l'écran d'introduction,
jamais une erreur. `renderRelatedCourseLink(coursId, chapitreLabel)` construit
une vraie URL de chapitre uniquement quand `chapitreLabel` correspond
EXACTEMENT à un vrai titre de chapitre — jamais une URL fabriquée sur un
intitulé approximatif.

## 6. Journey / Data Flow

```
ACTION UTILISATEUR (quiz répondu, chapitre lu, article ouvert, projet créé...)
        │
        ▼
ÉCRITURE D'ÉTAT RÉELLE (fzr-quiz-stats / fzr-mistakes / fzr-last-position /
                          fzr-life-projects / fzr-profile...)
        │
        ▼
SOURCE DE VÉRITÉ RECALCULÉE À LA DEMANDE (jamais un cache qui se périme) :
  getSkillMastery() · getConceptMastery() · getProjectSkillGaps() ·
  computeArticleRelevanceSignals() · findRecommendationsFor()
        │
        ▼
WIDGET / RECOMMANDATION AFFICHÉ (avec renderPourquoiToggle si des signaux
                                   réels existent)
        │
        ▼
NOUVELLE ACTION UTILISATEUR → boucle
```

Il n'existe pas de "bus d'événements" centralisé (`COURSE_STARTED`,
`QUIZ_COMPLETED`...) — chaque action écrit directement dans sa clé
`localStorage` dédiée, et chaque lecteur relit cette même source à chaque
rendu. C'est un choix cohérent avec la taille réelle du site (site statique
multi-pages, pas d'application SPA) : ajouter un event bus aurait été du
sur-engineering (section 79 du prompt d'origine) sans bénéfice mesurable ici.

## 7. Migrations effectuées

- `fzr-business-strategy-transfer` → `fzr-context-business-strategy` (phase 5,
  via le nouveau Context Engine). Retirée de `PROGRESS_SYNC_KEYS`.
- `PROGRESS_SYNC_KEYS` étendue (phase 9) : `fzr-last-position`,
  `fzr-life-projects`, `fzr-headcount-sim`, `fzr-pricing-sim`,
  `fzr-sales-funnel`, `fzr-valorisation-sim` — de la vraie progression
  utilisateur, oubliée de la whitelist par le passé.
- Aucune migration destructive : chaque nouvelle clé (`fzr-last-position`,
  `fzr-context-*`) coexiste avec l'existant, jamais de remplacement d'une
  structure de données déjà en production.

## 8. Limites connues (assumées, pas des oublis)

- Les 4 systèmes de "niveau" (curriculum/déclaré/XP/maîtrise) restent séparés
  — décision de conception documentée dans le code, pas fusionnée ici.
- ~~`cours.html` n'a aucun adressage par chapitre dans l'URL~~ — **rouvert et
  implémenté le 30/08/2026** à la demande explicite de l'utilisateur :
  `cours.html#<coursId>:<chapitre-slug>` ouvre directement ce chapitre,
  rétrocompatible avec l'ancien format `#<coursId>` seul. Voir §5
  (`renderCourseIntro`, `renderRelatedCourseLink`) — le bandeau "Retour au
  cours" et le widget "Continuer" en bénéficient automatiquement.
- `renderNextStepRecommendation` (widget Dashboard `next-step`) devient
  inerte une fois tous les domaines évalués — connu, non corrigé (nécessiterait
  de revoir sa logique de fond, un chantier à part).
- Aucun opt-out global de la personnalisation (un utilisateur peut
  réinitialiser ses données, mais pas désactiver la logique de recommandation
  elle-même) — un vrai toggle consulté par tous les widgets serait un
  chantier à part entière, plus risqué qu'utile à ce stade.
- Pas de fusion champ par champ dans la sync cloud (toujours un snapshot
  complet) — un chantier backend à part.

## 9. Pour aller plus loin

Voir aussi `docs/content-relationship-map.md` pour la cartographie complète
des relations entre types de contenu (Concept, Cours, Bibliothèque, Défi, Jeu,
Lab, Actualité, Business, Marchés) — utile avant d'ajouter un nouveau type de
contenu ou une nouvelle règle de recommandation.
