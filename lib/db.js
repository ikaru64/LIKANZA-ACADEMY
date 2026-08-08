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

module.exports = { getSql, ensureDailyNewsTable };
