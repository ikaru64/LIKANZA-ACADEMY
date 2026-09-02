# Journey Engine — continuité, absence, prérequis, profilage progressif

Documentation interne du chantier "Onboarding intelligent + Adaptive
Journey" (31/08-01/09/2026), phases 5 à 7. Couvre tout ce qui adapte
l'expérience **après** l'onboarding, en continu, à partir de l'activité
réelle — sans système d'événements générique (voir `docs/likanza-continuity.md`
§6 : ce choix de conception préexistant n'a pas été remis en cause). Voir
`docs/onboarding.md` pour le questionnaire lui-même et
`docs/recommendation-engine.md` pour l'écran de bilan et le panneau de
personnalisation.

## 1. Continuité de la mission du jour (phase 5)

Avant ce chantier, `pickMissions`/`MISSION_TEMPLATES` étaient une rotation
100% déterministe (seed = jour de l'année), sans jamais consulter
`getLastPosition()` (Continuité phase 6) — un cours commencé la veille
n'avait aucune priorité sur la rotation aléatoire.

`MISSION_TEMPLATES['terminer-lecon'].build()` consulte désormais
`getLastPosition()` en premier : si une position réelle existe et pointe
vers un cours pas encore terminé, la mission propose de le reprendre
exactement au bon chapitre (`cours.html#<id>:<chapitre-slug>`, adressage par
chapitre réouvert dans le chantier Continuité). Sans position pertinente
(jamais commencé, ou déjà terminé), repli identique au comportement
d'origine : le premier cours non terminé de `COURS_CATALOG`, dans l'ordre du
catalogue.

## 2. Écart réel depuis la dernière visite + salutation honnête (phase 5)

`checkDailyStreak()` (data.js) calcule désormais `g.lastGapDays` — l'écart
réel en jours depuis `lastVisit`, **avant** de l'écraser. `null` à la toute
première visite (jamais un écart fabriqué). Ce champ vit sur l'objet
`fzr-gamification` comme `streak`/`streakFreezes`, pas une clé séparée.

`WELCOME_PHRASES` (data.js) a été scindé :
- `WELCOME_PHRASES_DEFAULT` — le cas courant.
- `WELCOME_PHRASES_RETOUR` — seulement piochées quand `lastGapDays >= 2` (les
  2 phrases sonnant "retour" pouvaient auparavant tomber au hasard, y
  compris pour une visite normale le lendemain — un faux signal).

Pour une vraie absence longue (`lastGapDays >= 7`), un message honnête et
spécifique prend le dessus dans `renderDashboardHeader`, **même sur la
personnalisation par objectif** (le seul cas où ce chantier a fait primer un
signal sur un autre dans la salutation) :

```
Ça faisait ${g.lastGapDays} jours — reprenons tranquillement, à ton rythme.
```

Toujours le vrai nombre de jours, jamais arrondi ni inventé ; jamais
culpabilisant ("tu as raté X jours", "où étais-tu passé ?" — exclus
explicitement par le prompt d'origine).

## 3. Bandeau de re-onboarding léger (phase 3, documenté ici car il vit dans
`renderDashboardHeader` aux côtés des mécanismes ci-dessus)

Distinct du bandeau historique "Nouveau sur Likanza ?" (`!getPositioningResult()`,
pour qui n'a **jamais** fait le test). Le nouveau bandeau
("Nouveau : objectif principal & projets") cible qui a **déjà** fait le
test, mais avec une version antérieure à `ONBOARDING_VERSION`
(`docs/onboarding.md` §4). "Plus tard" persiste
`fzr-reonboarding-dismissed-version` — jamais reproposé pour cette version
précise, sans bloquer une resollicitation légitime à la prochaine évolution
du questionnaire.

## 4. Prérequis conditionnels (phase 6)

Avant ce chantier, 2 endroits affichaient systématiquement une liste de
prérequis `LIBRARY.prerequis`, quel que soit ce que l'utilisateur savait déjà
(`bibliotheque.js`, chaque notion ; `games/finance.js`, simulateur DCF —
liste codée en dur).

`renderPrerequisNudge(prerequisTerms, opts)` (data.js) : filtre via
`matchQuizCategorieForTerme()` (Continuité phase 3, réutilisée telle quelle)
+ `getConceptMastery()`. Un prérequis reste affiché si :
- aucune catégorie de quiz ne lui correspond (rien à mesurer — jamais
  supposer "déjà su" sans preuve réelle), **ou**
- sa maîtrise réelle est encore au stade le plus faible (`decouvert`).

Dès `compris` ou mieux, il disparaît silencieusement. Si plus aucun
prérequis ne reste pertinent, aucun bloc n'est affiché du tout. Reste une
simple liste de liens informative — rien n'était bloquant avant, rien ne
l'est devenu.

## 5. Profilage progressif (phase 7)

Un seul point d'ancrage comportemental, pas un système d'événements
générique : une session de Défis **terminée** (`recordQuizCompletion`),
choisie plutôt que le *début* de session car plus conservatrice (moins de
faux signaux qu'un simple clic).

```
recordQuizCompletion(categorie)
  └─ categorieDomainKey(categorie) résout un vrai domaine
      └─ domaine pas déjà déclaré (interest/goal) et pas déjà refusé
          └─ fzr-inferred-interest-signals[domainKey]++
```

`getPendingInterestSuggestion()` ne renvoie un domaine qu'une fois
`INFERRED_INTEREST_CONFIRM_THRESHOLD` (3) sessions atteintes — un seul à la
fois, jamais une liste. `renderDashboardHeader` affiche alors un bandeau
("On dirait que ça t'intéresse") : accepter écrit un vrai
`profile.interests[domainKey] = true` (même mécanisme que le reste du
site — jamais un second champ "intérêt inféré" affiché ailleurs) ; refuser
persiste `fzr-inferred-interest-dismissed` **à vie**, jamais reproposé pour
ce domaine.

**Règle d'arbitrage stricte, vérifiée à deux endroits** (à l'écriture du
signal, puis à nouveau à la lecture de la suggestion) : l'explicite prime
toujours sur l'inféré. Un domaine déjà déclaré n'est jamais compté ; s'il
devient explicite par un autre chemin (ex. le panneau de personnalisation,
`docs/recommendation-engine.md` §3) entre-temps, la suggestion en attente
pour ce domaine ne peut plus jamais s'afficher.

## 6. Hors scope de ce chantier (avec raison)

- Numeric weighted recommendation scoring + mode debug — l'engine
  recommandation reste branch-based (if/else priorité), pas score-based
  (voir `docs/likanza-continuity.md` §4).
- Sélecteur "combien de temps as-tu aujourd'hui" — indépendant, chantier à
  part.
- Bus d'événements générique — cohérent avec l'absence déjà actée
  (`docs/likanza-continuity.md` §6) ; chaque nouveau signal reste une
  écriture ciblée dans sa propre clé.
