/* ============================================================
   LIKANZA ACADEMY — Helper partagé : connexion Neon (récap quotidien)
   Réutilise le DATABASE_URL déjà provisionné pour likanza-auth.
   Table dédiée (daily_news), aucune autre donnée de l'app d'auth
   n'est lue ni modifiée depuis ce site.
   ============================================================ */

const { neon } = require('@neondatabase/serverless');

function getSql(){
  if(!process.env.DATABASE_URL) throw new Error('DATABASE_URL manquant');
  return neon(process.env.DATABASE_URL);
}

async function ensureDailyNewsTable(sql){
  await sql`
    CREATE TABLE IF NOT EXISTS daily_news (
      id SERIAL PRIMARY KEY,
      news_date DATE UNIQUE NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      sources JSONB NOT NULL DEFAULT '[]',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
}

// Un article de fond par catégorie, renouvelé chaque semaine (voir
// api/generate-weekly-news.js). week_start = lundi de la semaine concernée.
// a_surveiller/accord_sources ajoutées après coup (ALTER, pas seulement
// CREATE) : la table existe déjà en production depuis le premier chantier
// actualités, CREATE TABLE IF NOT EXISTS seul ne les ajouterait jamais.
async function ensureWeeklyNewsTable(sql){
  await sql`
    CREATE TABLE IF NOT EXISTS weekly_news (
      id SERIAL PRIMARY KEY,
      week_start DATE NOT NULL,
      categorie TEXT NOT NULL,
      slug TEXT NOT NULL,
      titre TEXT NOT NULL,
      resume TEXT NOT NULL,
      points JSONB NOT NULL DEFAULT '[]',
      pourquoi TEXT NOT NULL,
      impact JSONB NOT NULL DEFAULT '[]',
      lecture TEXT NOT NULL,
      source TEXT NOT NULL,
      lien TEXT NOT NULL,
      sources JSONB NOT NULL DEFAULT '[]',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(week_start, categorie)
    )
  `;
  await sql`ALTER TABLE weekly_news ADD COLUMN IF NOT EXISTS a_surveiller JSONB NOT NULL DEFAULT '[]'`;
  await sql`ALTER TABLE weekly_news ADD COLUMN IF NOT EXISTS accord_sources TEXT`;
}

module.exports = { getSql, ensureDailyNewsTable, ensureWeeklyNewsTable };
