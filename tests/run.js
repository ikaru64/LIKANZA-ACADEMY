#!/usr/bin/env node
/* ============================================================
   Lanceur minimal — exécute chaque tests/*.test.js dans un process
   séparé (jsdom + toute la mécanique de la page réelle par fichier :
   isoler chaque suite évite qu'un état résiduel de localStorage/Chart
   fuite d'un fichier de test à l'autre) et agrège le résultat. Pas de
   framework de test (Jest/Vitest) : `npm test` reste un simple `node`,
   comme demandé.
   ============================================================ */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const testsDir = __dirname;
const files = fs.readdirSync(testsDir).filter(f => f.endsWith('.test.js')).sort();

if(files.length === 0){
  console.error('Aucun fichier tests/*.test.js trouvé.');
  process.exit(1);
}

let totalFiles = 0, failedFiles = 0;
for(const file of files){
  totalFiles++;
  console.log(`\n=== ${file} ===`);
  try {
    execFileSync(process.execPath, [path.join(testsDir, file)], { stdio: 'inherit' });
  } catch(err){
    failedFiles++;
    console.error(`\n>>> ${file} a échoué (code de sortie ${err.status})`);
  }
}

console.log(`\n${'='.repeat(50)}`);
console.log(`Fichiers de test : ${totalFiles} — échecs : ${failedFiles}`);
process.exit(failedFiles > 0 ? 1 : 0);
