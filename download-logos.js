// download-logos.js
// Télécharge les logos en SVG depuis Wikipédia/Commons
// Version ESM

import fs from "fs";
import fetch from "node-fetch";
import path from "path";

const targetDir = "C:/Python313/Top14/Projets/top14-app/public/logos";
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const clubs = [
  // --- TOP 14 ---
  { name: "toulouse", url: "https://upload.wikimedia.org/wikipedia/fr/5/5d/Stade_Toulousain_logo.svg" },
  { name: "clermont", url: "https://upload.wikimedia.org/wikipedia/fr/9/9a/ASM_Clermont_Auvergne_logo.svg" },
  { name: "la-rochelle", url: "https://upload.wikimedia.org/wikipedia/fr/7/7d/Stade_Rochelais_logo.svg" },
  { name: "racing92", url: "https://upload.wikimedia.org/wikipedia/fr/3/3a/Racing_92_logo.svg" },
  { name: "ubb", url: "https://upload.wikimedia.org/wikipedia/fr/4/4a/Union_Bordeaux_Bègles_logo.svg" },
  { name: "toulon", url: "https://upload.wikimedia.org/wikipedia/fr/6/6a/Rugby_Club_Toulonnais_logo.svg" },
  { name: "castres", url: "https://upload.wikimedia.org/wikipedia/fr/0/0e/Castres_Olympique_logo.svg" },
  { name: "pau", url: "https://upload.wikimedia.org/wikipedia/fr/5/54/Logo_Section_paloise_B%C3%A9arn_Pyr%C3%A9n%C3%A9es_2021.svg" },
  { name: "bayonne", url: "https://upload.wikimedia.org/wikipedia/fr/1/1b/Logo_Aviron_Bayonnais_Rugby_-_2022.svg" },
  { name: "perpignan", url: "https://upload.wikimedia.org/wikipedia/fr/2/2f/USAP_logo.svg" },
  { name: "montpellier", url: "https://upload.wikimedia.org/wikipedia/fr/1/1f/Montpellier_H%C3%A9rault_Rugby_logo.svg" },
  { name: "lyon", url: "https://upload.wikimedia.org/wikipedia/fr/2/25/Lyon_olympique_universitaire.svg" },
  { name: "paris", url: "https://upload.wikimedia.org/wikipedia/fr/0/0f/Logo_Stade_fran%C3%A7ais_PR_2018.svg" },
  { name: "agen", url: "https://upload.wikimedia.org/wikipedia/fr/3/3e/SU_Agen_logo.svg" },

  // --- PRO D2 ---
  { name: "vannes", url: "https://upload.wikimedia.org/wikipedia/fr/7/74/Logo_RC_Vannes_-_2022.svg" },
  { name: "rouen", url: "https://upload.wikimedia.org/wikipedia/fr/8/8e/Logo_Rouen_Normandie_Rugby_-_2019.svg" },
  { name: "soyaux-angouleme", url: "https://upload.wikimedia.org/wikipedia/fr/6/60/Logo_Soyaux_Angoul%C3%AAme_XV_Charente_-_2024.svg" },
  { name: "tarbes", url: "https://upload.wikimedia.org/wikipedia/fr/e/e0/Logo_Stado_Tarbes_Pyr%C3%A9n%C3%A9es_Rugby_-_2017.svg" },
  { name: "biarritz", url: "https://upload.wikimedia.org/wikipedia/fr/4/4d/Biarritz_Olympique_logo.svg" },
  { name: "colomiers", url: "https://upload.wikimedia.org/wikipedia/fr/3/3a/Colomiers_Rugby_logo.svg" },
  { name: "grenoble", url: "https://upload.wikimedia.org/wikipedia/fr/7/7c/FC_Grenoble_Rugby_logo.svg" },
  { name: "oyonnax", url: "https://upload.wikimedia.org/wikipedia/fr/9/9f/Oyonnax_Rugby_logo.svg" },
  { name: "nevers", url: "https://upload.wikimedia.org/wikipedia/fr/0/0d/USON_Nevers_Rugby_logo.svg" },
  { name: "carcassonne", url: "https://upload.wikimedia.org/wikipedia/fr/8/8a/US_Carcassonne_logo.svg" },
  { name: "aurillac", url: "https://upload.wikimedia.org/wikipedia/fr/5/5a/Stade_Aurillacois_logo.svg" },
  { name: "provence", url: "https://upload.wikimedia.org/wikipedia/fr/6/6a/Provence_Rugby_logo.svg" },
  { name: "massy", url: "https://upload.wikimedia.org/wikipedia/fr/2/2e/RC_Massy_Essonne_logo.svg" },
  { name: "valence-romans", url: "https://upload.wikimedia.org/wikipedia/fr/4/4a/Valence_Romans_Dr%C3%B4me_Rugby_logo.svg" },
  { name: "narbonne", url: "https://upload.wikimedia.org/wikipedia/fr/1/1a/RC_Narbonne_logo.svg" },
  { name: "albi", url: "https://upload.wikimedia.org/wikipedia/fr/3/3f/SC_Albi_logo.svg" }
];

async function downloadLogo({ name, url }) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Téléchargement impossible (${res.status})`);
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(path.join(targetDir, `${name}.svg`), buffer);
    console.log(`✅ Téléchargé : ${name}.svg`);
  } catch (err) {
    console.error(`❌ Erreur pour ${name}: ${err.message}`);
  }
}

(async () => {
  for (const club of clubs) {
    await downloadLogo(club);
  }
})();
