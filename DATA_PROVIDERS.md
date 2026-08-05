# DATA_PROVIDERS.md — Likanza Academy

Ce document liste les fournisseurs de données à évaluer pour faire passer Likanza Academy
du mode démonstration à un mode connecté (`MARKET_DATA_MODE = "live"`).

**Aucun de ces fournisseurs n'est connecté actuellement.** Toutes les valeurs
affichées sur le site sont soit des données de démonstration, soit des dernières
clôtures recherchées manuellement à une date donnée (voir le statut affiché sur
chaque donnée : `DEMO`, `LAST CLOSE`, ou `UNAVAILABLE`).

Avant d'intégrer un fournisseur, vérifier systématiquement :
- les droits de redistribution et d'affichage public ;
- les limites d'usage commercial ;
- l'attribution obligatoire (nom du fournisseur visible) ;
- le délai imposé sur les données (real-time vs delayed) ;
- le nombre de requêtes autorisées et leur coût ;
- les conditions spécifiques aux données de marché en temps réel (souvent plus
  strictes et plus chères que les données différées).

## Actions, indices, ETF

| Fournisseur | Délai | Attribution requise | Limites (offre gratuite) | Coût (payant) |
|---|---|---|---|---|
| Twelve Data | Différé sur l'offre gratuite | Oui | ~8 requêtes/min | À partir de ~30 €/mois |
| Alpha Vantage | Différé | Oui | 25 requêtes/jour (gratuit) | Variable |
| Finnhub | Temps réel selon plan | Oui | Quota limité (gratuit) | Variable |
| Bourse Direct / Euronext (données officielles) | Variable | Oui, licence dédiée | Contrat à négocier | Sur devis |

## Cryptomonnaies

| Fournisseur | Délai | Attribution requise | Limites (offre gratuite) |
|---|---|---|---|
| CoinGecko API | Quasi temps réel | Oui | Quota généreux en gratuit |
| CoinMarketCap API | Quasi temps réel | Oui | Quota limité en gratuit |
| Binance API (marché public) | Temps réel | Oui | Rate limit strict |

## Devises (Forex)

| Fournisseur | Délai | Attribution requise |
|---|---|---|
| exchangerate.host | Quotidien à quasi temps réel | Oui |
| Twelve Data (Forex) | Selon plan | Oui |

## Matières premières

| Fournisseur | Délai | Attribution requise |
|---|---|---|
| Twelve Data (Commodities) | Différé | Oui |
| Metals-API (or, argent) | Différé | Oui |

## Actualités financières

| Fournisseur | Restrictions |
|---|---|
| Flux RSS des médias (Les Echos, Reuters, etc.) | Résumé autorisé, jamais de copie intégrale ; toujours lier vers l'article original |
| NewsAPI.org | Usage commercial limité en offre gratuite |
| GNews | Quota limité |

## Calendrier économique

| Fournisseur | Notes |
|---|---|
| Trading Economics API | Payant pour un usage commercial |
| Investing.com (pas d'API officielle publique) | Ne pas scraper sans autorisation explicite |

## Règles générales pour Likanza Academy

1. Ne jamais afficher un statut `LIVE` ou `REAL-TIME` sans un abonnement qui le
   garantit contractuellement.
2. Toujours afficher la source, la date et l'heure de mise à jour à côté de
   chaque donnée.
3. En cas de doute sur une licence, utiliser `LAST CLOSE` ou `DEMO` plutôt que
   de sur-promettre.
4. Prévoir un mécanisme de repli (fallback) : si un fournisseur est en panne ou
   en quota dépassé, afficher clairement l'indisponibilité plutôt qu'une
   ancienne valeur non datée.
