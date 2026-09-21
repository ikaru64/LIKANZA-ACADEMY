/* ============================================================
   Pré-lancement (2026-09-21), P0 — synchronisation du compte : la version
   la plus récente l'emporte, jamais un ancien appareil qui écrase un compte
   plus récent, jamais de perte silencieuse (copie locale avant tout
   remplacement), jamais un échec présenté comme une réussite.
   Serveur simulé en mémoire (aucun réseau réel).
   ============================================================ */
const { createSuite } = require('./support/assert');
const { loadFormationsPage, flush } = require('./support/load-page');

const t = createSuite('sync-freshness');

function makeServer(initialData, opts = {}){
  const server = {data: initialData, posts: [], failGet: !!opts.failGet, failPost: !!opts.failPost};
  server.fetchImpl = async (url, options = {}) => {
    if(options.method === 'POST'){
      if(server.failPost) return {ok: false, status: 500, json: async () => ({})};
      server.data = JSON.parse(options.body);
      server.posts.push(server.data);
      return {ok: true, status: 200, json: async () => ({ok: true})};
    }
    if(server.failGet) throw new Error('réseau coupé');
    return {ok: true, status: 200, json: async () => ({data: server.data})};
  };
  return server;
}

async function loadDevice(server, {marker, syncedTs, updatedAt, local = {}}){
  const page = loadFormationsPage({fetchImpl: server.fetchImpl});
  const {window} = page;
  // laisse d'abord s'exécuter l'init de la page (DOMContentLoaded, asynchrone dans jsdom) — sans jeton,
  // sa synchronisation automatique est un no-op ; l'état du "device" est posé ensuite.
  await flush(80);
  // état local du "device" (après le chargement, pour ne pas être écrasé par l'init de la page)
  window.localStorage.setItem('likanza-auth-user', JSON.stringify({name: 'T', syncToken: 'tok'}));
  Object.entries(local).forEach(([k, v]) => window.localStorage.setItem(k, JSON.stringify(v)));
  if(marker) window.localStorage.setItem('likanza-sync-last-at', JSON.stringify('2026-09-01T00:00:00.000Z'));
  else window.localStorage.removeItem('likanza-sync-last-at');
  window.localStorage.setItem('likanza-sync-synced-ts', JSON.stringify(syncedTs || 0));
  window.localStorage.setItem('likanza-progress-updated-at', JSON.stringify(updatedAt || 0));
  const statusEl = window.document.createElement('p');
  statusEl.id = 'progressSyncStatus';
  window.document.body.appendChild(statusEl);
  return {...page, statusEl};
}
const read = (window, key) => JSON.parse(window.localStorage.getItem(key));

(async () => {
  // ---------- decideSyncAction : table de décision pure ----------
  {
    const {window} = loadFormationsPage();
    const d = window.decideSyncAction;
    t.equal(d({hasCloudData: false, hasSyncedBefore: true, localTs: 5}), 'push', 'compte vide -> push');
    t.equal(d({hasCloudData: true, hasSyncedBefore: false, cloudTs: 9, localTs: 100}), 'pull', "premier appareil connecté -> il hérite du compte (copie locale conservée)");
    t.equal(d({hasCloudData: true, hasSyncedBefore: true, cloudTs: 0, localTs: 5}), 'push', 'compte antérieur à l\'horodatage + appareil déjà synchronisé -> comportement historique (push)');
    t.equal(d({hasCloudData: true, hasSyncedBefore: true, cloudTs: 1000, lastSyncedTs: 1000, localTs: 1000}), 'noop', 'rien n\'a changé des deux côtés -> noop');
    t.equal(d({hasCloudData: true, hasSyncedBefore: true, cloudTs: 1000, lastSyncedTs: 1000, localTs: 3000}), 'push', 'seul le local a changé -> push');
    t.equal(d({hasCloudData: true, hasSyncedBefore: true, cloudTs: 2000, lastSyncedTs: 1000, localTs: 1000}), 'pull', 'seul le compte a changé -> pull');
    t.equal(d({hasCloudData: true, hasSyncedBefore: true, cloudTs: 4000, lastSyncedTs: 1000, localTs: 5000}), 'push', 'vrai conflit : le local est plus récent -> push');
    t.equal(d({hasCloudData: true, hasSyncedBefore: true, cloudTs: 6000, lastSyncedTs: 1000, localTs: 5000}), 'pull', 'vrai conflit : le compte est plus récent -> pull');
  }

  // ---------- Un appareil périmé n'écrase JAMAIS un compte plus récent ----------
  {
    const server = makeServer({'likanza-level': 'expert', __meta: {updatedAt: 2000}});
    const dev = await loadDevice(server, {marker: true, syncedTs: 1000, updatedAt: 1000, local: {'likanza-level': 'debutant'}});
    await dev.window.syncProgressWithAccount();
    t.equal(server.posts.length, 0, "l'appareil périmé n'a RIEN poussé vers le compte plus récent");
    t.equal(server.data['likanza-level'], 'expert', 'le compte est resté intact');
    t.equal(read(dev.window, 'likanza-level'), 'expert', "l'appareil a bien récupéré la version plus récente du compte");
    const backup = read(dev.window, 'likanza-progress-backup');
    t.ok(!!backup && backup.data['likanza-level'] === 'debutant', 'la progression locale remplacée a été conservée dans une copie de sauvegarde (jamais de perte silencieuse)');
    t.ok(dev.statusEl.textContent.includes('copie'), 'le statut informe honnêtement de la copie conservée');
  }

  // ---------- Un appareil avec des modifications plus récentes pousse ----------
  {
    const server = makeServer({'likanza-level': 'debutant', __meta: {updatedAt: 1000}});
    const dev = await loadDevice(server, {marker: true, syncedTs: 1000, updatedAt: 3000, local: {'likanza-level': 'avance'}});
    await dev.window.syncProgressWithAccount();
    t.equal(server.posts.length, 1, "l'appareil aux modifications plus récentes pousse bien vers le compte");
    t.equal(server.data['likanza-level'], 'avance', 'le compte reçoit la version la plus récente');
    t.equal(server.data.__meta.updatedAt, 3000, "la charge utile porte bien l'horodatage de la dernière modification locale");
    t.ok(dev.statusEl.textContent.startsWith('Synchronisé'), 'succès affiché seulement après un vrai succès');
  }

  // ---------- Premier appareil connecté : il hérite du compte, sa progression locale est conservée ----------
  {
    const server = makeServer({'likanza-level': 'intermediaire', __meta: {updatedAt: 1500}});
    const dev = await loadDevice(server, {marker: false, syncedTs: 0, updatedAt: 9000, local: {'likanza-level': 'debutant'}});
    await dev.window.syncProgressWithAccount();
    t.equal(read(dev.window, 'likanza-level'), 'intermediaire', 'le premier appareil connecté hérite du compte');
    t.equal(read(dev.window, 'likanza-progress-backup').data['likanza-level'], 'debutant', 'sa progression locale a été conservée avant le remplacement');
    t.equal(server.posts.length, 0, 'rien de périmé poussé vers le compte');
  }

  // ---------- Compte antérieur à l'horodatage : ancien comportement (push) inchangé ----------
  {
    const server = makeServer({'likanza-level': 'debutant'});
    const dev = await loadDevice(server, {marker: true, syncedTs: 0, updatedAt: 500, local: {'likanza-level': 'avance'}});
    await dev.window.syncProgressWithAccount();
    t.equal(server.posts.length, 1, 'compte sans horodatage : un appareil déjà synchronisé pousse comme avant (rétrocompatible)');
    t.ok(!!server.data.__meta, "le compte reçoit désormais l'horodatage, prêt pour les prochaines comparaisons");
  }

  // ---------- Erreurs réseau : jamais un faux "Synchronisé" ----------
  {
    const server = makeServer({}, {failGet: true});
    const dev = await loadDevice(server, {marker: true, syncedTs: 1, updatedAt: 2, local: {'likanza-level': 'avance'}});
    await dev.window.syncProgressWithAccount();
    t.ok(!dev.statusEl.textContent.startsWith('Synchronisé'), "hors ligne : jamais présenté comme synchronisé");
    t.ok(dev.statusEl.textContent.includes('restent sur cet appareil'), 'hors ligne : le message précise que les données restent locales');
    t.equal(server.posts.length, 0, 'aucun push tenté sans connexion');
  }
  {
    const server = makeServer({'likanza-level': 'debutant', __meta: {updatedAt: 1000}}, {failPost: true});
    const dev = await loadDevice(server, {marker: true, syncedTs: 1000, updatedAt: 3000, local: {'likanza-level': 'avance'}});
    await dev.window.syncProgressWithAccount();
    t.ok(dev.statusEl.textContent.includes('Sauvegarde momentanément impossible'), "échec d'écriture serveur : message explicite, jamais un faux succès");
    t.equal(read(dev.window, 'likanza-sync-synced-ts'), 1000, "un push échoué ne marque jamais l'instantané comme synchronisé");
  }

  // ---------- Relance périodique : jamais de push aveugle sur un compte plus récent ----------
  {
    const server = makeServer({'likanza-level': 'expert', __meta: {updatedAt: 2000}});
    const dev = await loadDevice(server, {marker: true, syncedTs: 1000, updatedAt: 1000, local: {'likanza-level': 'debutant'}});
    await dev.window.runProgressSyncHeartbeat();
    t.equal(server.posts.length, 0, 'la relance périodique ne pousse jamais un état périmé sur un compte plus récent');
    t.equal(read(dev.window, 'likanza-level'), 'debutant', 'rien n\'est remplacé en cours de session');
    t.ok(dev.statusEl.textContent.includes('plus récente'), "l'utilisateur est informé qu'une version plus récente existe");
  }

  // ---------- Suivi des modifications locales ----------
  {
    const server = makeServer(null);
    const dev = await loadDevice(server, {marker: true, syncedTs: 0, updatedAt: 0});
    const {window} = dev;
    window.localStorage.setItem('likanza-progress-updated-at', '0');
    window.localStorage.setItem('likanza-thème-non-synchronisé', '"x"');
    t.equal(read(window, 'likanza-progress-updated-at'), 0, 'écrire une clé hors PROGRESS_SYNC_KEYS ne compte pas comme une modification de progression');
    window.localStorage.setItem('likanza-life-projects', '[]'); // écriture DIRECTE (comme les 26 sites historiques)
    t.ok(read(window, 'likanza-progress-updated-at') > 0, 'une écriture directe localStorage.setItem sur une clé de progression met bien à jour la fraîcheur locale');
    window.localStorage.setItem('likanza-progress-updated-at', '0');
    window.applyProgressSnapshot({'likanza-level': 'avance', __meta: {updatedAt: 777}});
    t.equal(read(window, 'likanza-progress-updated-at'), 777, "restaurer depuis le compte n'est jamais compté comme une modification locale (la fraîcheur devient celle du compte)");
    t.ok(!('__meta' in window.localStorage) && window.localStorage.getItem('__meta') === null, "__meta n'est jamais écrit comme une clé de progression");
  }

  // ---------- Récupérer la copie locale ----------
  {
    const server = makeServer({'likanza-level': 'expert', __meta: {updatedAt: 2000}});
    const dev = await loadDevice(server, {marker: true, syncedTs: 1000, updatedAt: 1000, local: {'likanza-level': 'debutant'}});
    await dev.window.syncProgressWithAccount();
    t.equal(read(dev.window, 'likanza-level'), 'expert', 'précondition : le compte a remplacé le local');
    t.ok(dev.window.restoreLocalProgressBackup(), 'la copie locale conservée peut être récupérée');
    t.equal(read(dev.window, 'likanza-level'), 'debutant', 'la progression de cet appareil est bien revenue');
    t.ok(read(dev.window, 'likanza-progress-updated-at') > 2000, 'la copie récupérée devient la modification locale la plus récente (donc poussée à la prochaine synchro)');
  }

  const summary = t.summary();
  console.log(`\n${t.name} : ${summary.total - summary.failed}/${summary.total} OK`);
  process.exit(summary.failed > 0 ? 1 : 0);
})();
