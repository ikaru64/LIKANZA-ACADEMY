# README.md — Likanza Academy

Likanza Academy est une plateforme pédagogique statique (HTML/CSS/JS, sans backend)
pour apprendre la finance : missions par niveau, défis, simulateurs gratuits,
bibliothèque, actualités résumées et progression locale.

## 1. Comment ouvrir le site

Chaque page est un fichier `.html` autonome (CSS et JS intégrés dedans). Pour
tester en local, ouvre `index.html` dans un navigateur, ou héberge le dossier
entier sur un service gratuit comme Netlify Drop, GitHub Pages ou Cloudflare
Pages. Aucune installation, aucun serveur, aucune dépendance externe requise.

## 2. Accéder à l'administration de démonstration

Ouvre `admin.html` et connecte-toi avec :

- Identifiant : `admin` (non vérifié, indicatif)
- Mot de passe : `likanza2026`

**Important** — change ce mot de passe avant de partager le lien de ton site
(voir section 10). Ce n'est qu'une protection locale, pas une vraie sécurité
(voir `ARCHITECTURE.md`).

## 3. Comment modifier les données du site

Le contenu (missions, actualités) est défini dans `data.js`, entre des repères
`// ===EXPORT:...:START===` / `// ===EXPORT:...:END===`. Deux façons de le
modifier :

**A. Depuis l'espace admin (recommandé)** : `admin.html` permet d'éditer les
missions et les actualités directement dans le navigateur, puis d'exporter un
fichier `data.js` à jour via le bouton "Télécharger data.js". Envoie ce
fichier pour republication (voir section 7), ou remplace-le toi-même si tu es
à l'aise avec ça (attention : comme chaque page a son code intégré, il faut
alors recopier le nouveau contenu dans chaque page, pas seulement dans un
fichier `data.js` séparé).

**B. Directement dans le code** : ouvre `data.js`, repère `COURSES` ou
`NEWS_DATA`, et modifie les objets JavaScript directement. Respecte la
structure existante (mêmes clés).

## 4. Comment ajouter un article

Dans `admin.html`, section "Actualités" → "Ajouter une actualité". Renseigne
titre, catégorie, résumé, points clés (un par ligne), pourquoi c'est
important, impact potentiel, source, lien original, date et temps de lecture.

## 5. Comment ajouter un cours (une mission)

Dans `admin.html`, section "Missions" → choisis le niveau → "Ajouter une
mission". Renseigne un titre et un contenu.

## 6. Comment ajouter une question de quiz

Pour l'instant, l'ajout de questions se fait directement dans `data.js`, dans
le tableau `QUIZ_BANK_FULL` (repéré par `// ===EXPORT:QUIZ_BANK:START===`).
Respecte cette structure :

```js
{
  id: "quiz-etf-004",
  niveau: "debutant", // "debutant", "intermediaire" ou "avance"
  categorie: "ETF",
  type: "qcm", // "qcm", "vraifaux", "situation" ou "calcul"
  question: "...",
  choix: ["...", "...", "...", "..."],
  bonneReponse: 1, // index de la bonne réponse dans "choix"
  explication: "..."
}
```

Un éditeur dédié aux questions dans `admin.html` est prévu mais pas encore
construit (voir les limites en section 9).

## 7. Comment sauvegarder ou restaurer les contenus

- Dans `admin.html`, le bouton "Télécharger data.js" génère une sauvegarde
  complète et à jour de tes missions et actualités.
- Le bouton "Réinitialiser mes modifications" repart des données d'origine.
- Pour republier un `data.js` modifié sur le site réellement hébergé, il faut
  soit me le transmettre pour régénération des pages, soit recopier
  manuellement son contenu dans le bloc `<script>` correspondant de chaque
  fichier `.html` (plus technique).

## 8. Quelles données sont stockées dans localStorage

Tout est stocké uniquement sur l'appareil de chaque visiteur, jamais partagé :

| Clé | Contenu |
|---|---|
| `fzr-level` | Niveau choisi (débutant/intermédiaire/avancé/expert) |
| `fzr-progress` | Missions marquées terminées |
| `fzr-gamification` | FinPoints, série, badges débloqués |
| `fzr-activity-log` | Jours d'activité (pour la barre hebdomadaire) |
| `fzr-quiz-stats` | Statistiques par thème, historique des défis |
| `fzr-quiz-points-ledger` | Anti-abus : questions déjà récompensées aujourd'hui |
| `fzr-favorites` | Favoris (articles, actions) |
| `fzr-watchlist` | Watchlist personnelle avec seuils d'alerte |
| `fzr-profile` | Profil de simulation (âge, épargne, horizon, risque) |
| `fzr-theme` / `fzr-lang` | Préférences de thème et de langue |
| `fzr-draft-courses` / `fzr-draft-news` | Brouillons de l'espace admin |
| `sessionStorage: fzr-admin-session` | Session de connexion admin (effacée à la fermeture de l'onglet) |

## 9. Fonctions réellement actives vs. prévues

**Actives dès maintenant** : missions par niveau, bibliothèque, 62 questions
de défi avec sélection niveau/thème/longueur, simulateurs (intérêts composés,
budget, crédit, DCA vs achat unique, objectif d'épargne, comparateur
d'actions), actualités résumées et datées, FinPoints/badges/séries/ligues
(ligues avec profils de démonstration), favoris, watchlist, thème clair/sombre,
traduction FR/EN sur l'accueil, export/réinitialisation des données admin.

**Prévues, pas encore actives** : voir la page publique `avenir.html` — compte
utilisateur réel, synchronisation cloud, professeur IA connecté à une vraie
API, ligues avec de vrais autres joueurs, données de marché automatisées,
Premium.

**Limites connues de cette version** (voir aussi `ARCHITECTURE.md`) :
- Les 34 mini-cours détaillés (objectif, exemple, analogie, mini-quiz par
  cours) décrits dans le cahier des charges ne sont pas encore tous rédigés :
  les missions actuelles restent plus concises.
- L'admin ne permet pas encore d'éditer un cours avec toutes ses sections
  (objectif, analogie, erreurs fréquentes...), ni les questions de quiz, ni
  les textes généraux du site (titres, boutons...) — seulement les missions
  (titre + contenu) et les actualités.
- Pas d'import JSON dans l'admin pour l'instant, seulement l'export.
- Les simulateurs Livret A comparatif, patrimoine net détaillé et épargne de
  précaution dédiée ne sont pas encore construits sous cette forme précise.

## 10. Changer le mot de passe de démonstration

Dans `admin.html`, cherche la ligne :

```js
const ADMIN_DEMO_PASSWORD = "likanza2026";
```

Remplace la valeur par le mot de passe de ton choix, puis republie le
fichier. Fais-le sur chaque page si tu régénères le site toi-même (le mot de
passe n'existe que dans `admin.html`).

## 11. Pourquoi ce mot de passe n'est pas réellement sécurisé

Ce site est 100% statique : tout le code JavaScript, y compris le mot de
passe ci-dessus, est visible par quiconque ouvre le code source de la page
(clic droit → "Afficher le code source"). Il n'y a aucun moyen de cacher un
secret dans du code qui s'exécute entièrement dans le navigateur du visiteur.

Cette protection empêche seulement un visiteur non technique de tomber par
hasard sur l'espace admin. Elle n'empêche pas quelqu'un qui sait lire le code
source d'accéder au contenu — mais rappel : il ne pourrait de toute façon
modifier que son propre brouillon local, jamais changer le vrai site public.

Une vraie protection nécessiterait un backend qui vérifie le mot de passe
côté serveur (jamais transmis en clair, haché), avec une session sécurisée —
voir `ARCHITECTURE.md` pour le détail de cette évolution.
