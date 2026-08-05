# ARCHITECTURE.md — Likanza Academy

Ce document décrit l'architecture actuelle (statique) et l'architecture
future (avec backend) de Likanza Academy. La section marché/données financières
en direct, plus détaillée, est traitée à part dans la dernière section.

---

## Version statique actuelle

Likanza Academy est aujourd'hui un site **100% statique** : 13 fichiers `.html`
autonomes (CSS et JS intégrés dans chaque page), aucun serveur applicatif,
aucune base de données.

### Composants

- **HTML** : structure sémantique par page, navigation partagée, menu mobile,
  fil d'Ariane.
- **CSS** : un design system commun (variables de couleur, thèmes clair/sombre,
  composants réutilisables), dupliqué dans chaque page pour l'autonomie.
- **JavaScript** : trois blocs par page — données (`data.js`), fonctions
  partagées (`app.js`), puis logique spécifique à la page. Ces trois fichiers
  source existent séparément dans le dossier de travail et sont ensuite
  copiés dans chaque page.
- **`localStorage` / `sessionStorage`** : toute la personnalisation
  (progression, FinPoints, favoris, thème, session admin...) est stockée
  uniquement sur l'appareil du visiteur.
- **Calculs locaux** : tous les simulateurs (intérêts composés, budget,
  crédit, DCA, comparateur de scénarios...) s'exécutent entièrement dans le
  navigateur, sans appel réseau.
- **Données manuelles** : missions, actualités, questions de quiz sont des
  tableaux JavaScript écrits à la main (éditables via `admin.html` ou
  directement dans `data.js`).

### Ce que cette architecture permet

- Hébergement gratuit (Netlify, GitHub Pages, Cloudflare Pages).
- Aucune maintenance serveur, aucune facture d'infrastructure.
- Fonctionnement hors ligne une fois la page chargée (sauf polices Google
  Fonts).

### Ce que cette architecture ne permet pas

- Aucune donnée partagée entre visiteurs (chacun a sa propre progression,
  invisible des autres).
- Aucune vraie sécurité de l'espace admin (le mot de passe est visible dans
  le code source, voir `README.md` section 11).
- Aucune donnée de marché réellement en direct.
- Aucun compte utilisateur réel, aucune synchronisation multi-appareils.
- Aucun paiement réel possible.

---

## Version future avec backend

Passer à une version connectée nécessiterait, dans les grandes lignes :

### Authentification

- Un service d'authentification réel (ex. e-mail + mot de passe haché avec
  bcrypt/argon2, ou fournisseur OAuth).
- Des sessions sécurisées (cookies HttpOnly + Secure, ou JWT à courte durée
  de vie avec rotation).
- Une protection des routes d'administration côté serveur (jamais seulement
  côté client).

### Base de données

- Une base (PostgreSQL, MySQL ou équivalent) pour : comptes utilisateurs,
  progression, FinPoints, badges, articles, cours, banque de questions,
  watchlists, favoris.
- Une couche de migration pour faire évoluer le schéma sans perdre de
  données.

### API

- Des routes REST (ou GraphQL) pour lire/écrire ces données depuis le
  front-end, par exemple :
  - `/api/auth/login`, `/api/auth/logout`
  - `/api/progress`, `/api/finpoints`
  - `/api/articles`, `/api/courses`, `/api/quiz-bank`
  - `/api/market/*` (voir section dédiée plus bas)
- Validation stricte des entrées, limitation de fréquence (rate limiting),
  logs sans données sensibles.

### Administration sécurisée

- Rôles utilisateurs (admin / éditeur / lecteur).
- Actions d'administration systématiquement vérifiées côté serveur, jamais
  seulement masquées côté client.
- Historique des modifications (qui a changé quoi, et quand).

### Stockage cloud

- Sauvegarde de la progression par utilisateur, accessible depuis n'importe
  quel appareil après connexion.
- Export/import toujours proposés à l'utilisateur pour qu'il garde la main
  sur ses données.

### Paiements (si Premium est un jour commercialisé)

- Un prestataire de paiement existant (Stripe ou équivalent), jamais de
  système de paiement fait maison.
- Conformité DSP2/3D Secure pour les paiements en Europe.
- Aucune donnée bancaire stockée directement par Likanza Academy.

### Professeur IA connecté

- Un vrai modèle de langage appelé via une API, avec la clé conservée
  uniquement côté serveur.
- Un système de cache et de limitation de quota pour maîtriser les coûts.
- Une distinction claire, y compris dans les réponses générées, entre faits
  établis, explications rapportées par des sources, hypothèses et absence de
  cause certaine — jamais de conseil financier personnalisé présenté comme
  tel.

### Newsletter

- Un prestataire d'envoi d'e-mails transactionnels, avec gestion du
  consentement (opt-in) et désabonnement en un clic.

---

## Focus : données de marché en direct

Le principe reste : **le navigateur ne doit jamais appeler directement un
fournisseur de données avec une clé API.** Il doit toujours passer par un
backend Likanza Academy, seul dépositaire des clés (en variables d'environnement).

```
Navigateur (Likanza Academy) → Backend Likanza Academy → Fournisseurs de données
```

Voir `DATA_PROVIDERS.md` pour la liste des fournisseurs envisagés (actions,
indices, crypto, devises, matières premières, actualités) avec leurs
contraintes de licence, de délai et de coût.

### Schéma normalisé (contrat entre backend et interface)

```json
{
  "symbol": "AIR.PA",
  "name": "Airbus",
  "assetType": "stock",
  "price": 145.60,
  "currency": "EUR",
  "change": 1.20,
  "changePercent": 0.83,
  "timestamp": "2026-08-01T10:24:31+02:00",
  "source": "PROVIDER_NAME",
  "status": "DELAYED",
  "delayMinutes": 15
}
```

Statuts possibles : `LIVE`, `REAL-TIME`, `DELAYED`, `LAST_CLOSE`, `MANUAL`,
`DEMO`, `UNAVAILABLE`. Ne jamais afficher `LIVE` sans un abonnement qui le
garantit contractuellement.

### Cache et quotas

Cache serveur avec durée de vie adaptée par type de donnée, compteur de
requêtes par fournisseur, backoff exponentiel en cas d'erreur, invalidation
manuelle sur demande de l'utilisateur ("Actualiser").

---

## Variables d'environnement nécessaires (exemple, à adapter)

```
DATABASE_URL=
JWT_SECRET=
SESSION_SECRET=
MARKET_DATA_MODE=demo            # "demo" ou "live"
TWELVEDATA_API_KEY=
COINGECKO_API_KEY=
NEWSAPI_API_KEY=
AI_TEACHER_API_KEY=
EMAIL_PROVIDER_API_KEY=
STRIPE_SECRET_KEY=
CACHE_REDIS_URL=
LOG_LEVEL=info
```

## Étapes pour passer de la version statique à une version avec backend

1. Choisir une stack backend (ex. Node.js/Express ou équivalent) et une base
   de données.
2. Mettre en place l'authentification et les sessions avant toute autre
   fonctionnalité connectée.
3. Migrer les données actuelles de `data.js` vers la base (script de
   migration à écrire).
4. Exposer les routes API nécessaires, une fonctionnalité à la fois
   (progression, puis articles, puis quiz...).
5. Adapter le front-end pour appeler l'API au lieu de lire les tableaux
   JavaScript locaux, en gardant `localStorage` comme repli hors-ligne si
   souhaité.
6. Ajouter les fournisseurs de données de marché en dernier, une fois le
   reste stable, en respectant strictement leurs licences.
7. N'introduire un système de paiement qu'une fois tout le reste audité et
   stable.

Tant que ces étapes ne sont pas réalisées, Likanza Academy doit rester présenté
comme une démonstration statique, sans jamais prétendre à une sécurité ou une
donnée temps réel qu'il ne peut pas réellement fournir.
