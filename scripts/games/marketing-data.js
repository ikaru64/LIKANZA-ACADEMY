/* ============================================================
   LIKANZA ACADEMY — Le funnel Marketing
   8 étapes (Attention → Intérêt → Visite → Lead → Conversion →
   Client → Rétention → Recommandation), chacune avec une vraie
   métrique, sa formule standard quand elle existe, et un exemple
   conceptuel générique. `caseTag`, quand renseigné, relie l'étape à
   un vrai cas déjà sourcé dans BUSINESS_CASES (business-cases-data.js)
   via un tag partagé — jamais un nouvel exemple chiffré inventé pour
   l'occasion. Laissé à `null` quand aucun cas étudié n'illustre
   vraiment cette étape précise.
   ============================================================ */

const MARKETING_FUNNEL = [
  {
    id: 'attention', titre: 'Attention', icon: '👀',
    definition: "Capter l'attention d'une personne qui ne te connaît pas encore, au milieu de tout ce qui sollicite déjà son attention chaque jour.",
    metrique: 'Impressions / Portée (reach)',
    formule: null,
    exemple: "Une publicité, un post sur les réseaux sociaux, un article qui remonte dans les recherches, ou simplement le bouche-à-oreille sont des canaux d'attention.",
    exerciceQuestion: "Où se trouve réellement ton client potentiel avant même de chercher une solution à son problème ?",
    caseTag: 'differenciation'
  },
  {
    id: 'interet', titre: 'Intérêt', icon: '✨',
    definition: "Faire qu'une personne qui a vu ton message s'y attarde et veuille en savoir plus, au lieu de continuer à faire défiler.",
    metrique: 'Taux de clic (CTR)',
    formule: 'CTR = (Clics ÷ Impressions) × 100',
    exemple: "Un titre qui nomme précisément le problème du lecteur capte plus l'intérêt qu'un slogan vague.",
    exerciceQuestion: "Qu'est-ce qui, dans ton message, parle vraiment du problème de la personne plutôt que de ton produit ?",
    caseTag: 'differenciation'
  },
  {
    id: 'visite', titre: 'Visite', icon: '🚪',
    definition: "La personne arrive réellement sur ton site, ta page ou ton point de vente — l'intérêt se transforme en action concrète.",
    metrique: 'Visiteurs uniques, taux de rebond',
    formule: 'Taux de rebond = (Visites sans action ÷ Visites totales) × 100',
    exemple: "Un taux de rebond élevé signale souvent un décalage entre ce que le message promettait et ce que la page montre réellement.",
    exerciceQuestion: "Est-ce que ta page d'arrivée tient exactement la promesse du message qui a amené la visite ?",
    caseTag: null
  },
  {
    id: 'lead', titre: 'Lead', icon: '📇',
    definition: "La personne laisse un moyen de la recontacter (email, téléphone) — elle n'est pas encore cliente, mais elle a montré un vrai intérêt.",
    metrique: 'Taux de génération de leads',
    formule: 'Taux de leads = (Leads ÷ Visiteurs) × 100',
    exemple: "Un contenu utile offert en échange d'un email est un moyen courant de transformer un visiteur en lead.",
    exerciceQuestion: "Qu'est-ce que tu pourrais offrir qui vaut vraiment la peine, pour quelqu'un, de te laisser un contact ?",
    caseTag: 'premiers-clients'
  },
  {
    id: 'conversion', titre: 'Conversion', icon: '💳',
    definition: "Le moment où la personne achète réellement — l'étape où beaucoup de visiteurs intéressés n'avancent finalement pas.",
    metrique: 'Taux de conversion',
    formule: 'Taux de conversion = (Ventes ÷ Visiteurs ou Leads) × 100',
    exemple: "Un prix mal calibré, un parcours d'achat trop long ou un manque de confiance sont des causes fréquentes de conversion faible.",
    exerciceQuestion: "À quelle étape précise du parcours d'achat les gens abandonnent-ils, et pourquoi à ton avis ?",
    caseTag: 'conversion'
  },
  {
    id: 'client', titre: 'Client', icon: '🤝',
    definition: "La personne devient officiellement cliente — mais l'acquérir a un coût réel, qu'il faut connaître pour juger si le modèle tient.",
    metrique: 'CAC (coût d\'acquisition client)',
    formule: 'CAC = Dépenses marketing et commerciales ÷ Nouveaux clients acquis',
    exemple: "Un CAC élevé n'est pas un problème en soi s'il reste inférieur à ce que rapporte ce client sur la durée (voir LTV, testable dans Business Lab).",
    exerciceQuestion: "Est-ce que tu connais précisément combien te coûte l'acquisition d'un client, canal par canal ?",
    caseTag: null
  },
  {
    id: 'retention', titre: 'Rétention', icon: '🔁',
    definition: "Le client revient, réachète ou continue son abonnement — l'étape qui détermine si l'acquisition fait vraiment croître le business.",
    metrique: 'Taux de rétention / Churn',
    formule: 'Churn = (Clients perdus sur la période ÷ Clients au début de la période) × 100',
    exemple: "Une entreprise peut acquérir beaucoup de clients et stagner quand même si elle en perd autant qu'elle en gagne.",
    exerciceQuestion: "Est-ce que tu sais à quel moment précis tes clients arrêtent d'acheter ou de s'engager ?",
    caseTag: 'retention'
  },
  {
    id: 'recommandation', titre: 'Recommandation', icon: '📣',
    definition: "Le client parle de toi à d'autres — la seule étape du funnel qui fait travailler quelqu'un d'autre que toi pour attirer de nouveaux clients.",
    metrique: 'NPS (Net Promoter Score) ou taux de parrainage',
    formule: 'NPS = % de promoteurs − % de détracteurs',
    exemple: "Certains modèles (marketplaces notamment) grandissent en partie parce que d'anciens clients deviennent eux-mêmes une source d'acquisition.",
    exerciceQuestion: "Si un client satisfait voulait te recommander aujourd'hui, aurait-il un moyen simple et concret de le faire ?",
    caseTag: 'effet-reseau'
  }
];
