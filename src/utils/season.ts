// src/utils/season.ts

/**
 * Calcule la saison en cours basée sur la date actuelle.
 * Seuil de bascule : août — les matchs de la nouvelle saison sont créés dès août.
 *
 * Exemples :
 * - Décembre 2025 → "2025-2026"
 * - Août 2025     → "2025-2026" (nouvelle saison)
 * - Juillet 2025  → "2024-2025" (saison précédente)
 *
 * Doit rester aligné sur la fonction SQL get_saison_courante().
 */
export function getSaisonCourante(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  return month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

/**
 * Formatte une saison pour affichage.
 * @param season - Saison au format "2025-2026"
 * @returns Saison formatée "Saison 2025-2026"
 */
export function formatSeason(season: string): string {
  return `Saison ${season}`;
}

/**
 * Liste toutes les saisons disponibles (pour dropdowns, etc.).
 * @param startYear - Année de début (par défaut 2020)
 */
export function getAvailableSeasons(startYear: number = 2020): string[] {
  const currentSeason = getSaisonCourante();
  const [currentEndYear] = currentSeason.split('-').map(Number);
  const seasons: string[] = [];
  for (let year = currentEndYear; year >= startYear; year--) {
    seasons.push(`${year - 1}-${year}`);
  }
  return seasons;
}

