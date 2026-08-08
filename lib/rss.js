/* ============================================================
   LIKANZA ACADEMY — Helper partagé : lecture de flux RSS réels
   Utilisé par api/generate-daily-news.js pour lire de vraies actus
   financières avant résumé par l'IA. Placé hors de api/ pour ne
   pas devenir une route Vercel (même convention que lib/yahoo.js).
   ============================================================ */

const { XMLParser } = require('fast-xml-parser');

const FETCH_HEADERS = {'User-Agent':'Mozilla/5.0 (compatible; LikanzaAcademy/1.0)'};

function textOf(val){
  if(val === undefined || val === null) return '';
  if(typeof val === 'object') return textOf(val['#text']);
  return String(val).trim();
}

function stripHtml(html){
  return textOf(html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&eacute;/g, 'é').replace(/&egrave;/g, 'è')
    .replace(/\s+/g, ' ')
    .trim();
}

// Lit un flux RSS réel et renvoie ses items les plus récents (déjà triés
// par la source, convention RSS standard). Aucune donnée inventée : si le
// flux est indisponible, l'erreur remonte à l'appelant.
async function fetchFeedItems(feed, maxItems = 6){
  const resp = await fetch(feed.url, {headers: FETCH_HEADERS});
  if(!resp.ok) throw new Error(`${feed.name} : HTTP ${resp.status}`);
  const xml = await resp.text();
  const parser = new XMLParser({ignoreAttributes: true});
  const json = parser.parse(xml);
  const rawItems = json.rss && json.rss.channel && json.rss.channel.item;
  const items = Array.isArray(rawItems) ? rawItems : (rawItems ? [rawItems] : []);
  return items.slice(0, maxItems).map(it => ({
    title: textOf(it.title),
    link: textOf(it.link),
    summary: stripHtml(it.description).slice(0, 400),
    source: feed.name
  })).filter(it => it.title && it.link);
}

module.exports = { fetchFeedItems };
