// ✅ Script ESM (compatible avec "type": "module")

import fs from 'fs';

const file = './public/data/matchs_historique.json'; // même chemin pour lecture et écriture

try {
  // Lecture du fichier
  const rawData = await fs.promises.readFile(file, 'utf-8');
  const matchs = JSON.parse(rawData);

  // Transformation
  const converted = matchs.map(m => {
    const { score_ht_domicile, score_ht_exterieur, ...rest } = m;
    return {
      ...rest,
      score_ht: {
        domicile: score_ht_domicile ?? 0,
        exterieur: score_ht_exterieur ?? 0
      }
    };
  });

  // Écriture dans le même fichier (écrasement)
  await fs.promises.writeFile(file, JSON.stringify(converted, null, 2), 'utf-8');
  console.log(`✅ Conversion terminée. Fichier écrasé : ${file}`);
} catch (err) {
  console.error('❌ Erreur lors de la conversion :', err);
}
