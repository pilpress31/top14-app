// src/utils/season.ts

/**
 * Calcule la saison en cours basée sur la date actuelle
 * La saison de rugby Top 14 va de septembre à juin
 * 
 * Exemples :
 * - Décembre 2025 → "2025-2026"
 * - Août 2025 → "2024-2025" (saison précédente pas encore finie)
 * - Septembre 2025 → "2025-2026" (nouvelle saison commence)
 */
export function getCurrentSeason(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11

  // Si on est entre janvier et août inclus → saison précédente
  // (ex: Janvier 2026 → saison 2025-2026)
  if (month < 8) { // Janvier = 0, Août = 7
    return `${year - 1}-${year}`;
  }
  
  // Si on est entre septembre et décembre → nouvelle saison
  // (ex: Septembre 2025 → saison 2025-2026)
  return `${year}-${year + 1}`;
}

/**
 * Formatte une saison pour affichage
 * @param season - Saison au format "2025-2026"
 * @returns Saison formatée "Saison 2025-2026"
 */
export function formatSeason(season: string): string {
  return `Saison ${season}`;
}

/**
 * Liste toutes les saisons disponibles (pour dropdowns, etc.)
 * @param startYear - Année de début (par défaut 2020)
 * @returns Array de saisons ["2025-2026", "2024-2025", ...]
 */
export function getAvailableSeasons(startYear: number = 2020): string[] {
  const currentSeason = getCurrentSeason();
  const [currentEndYear] = currentSeason.split('-').map(Number);
  
  const seasons: string[] = [];
  for (let year = currentEndYear; year >= startYear; year--) {
    seasons.push(`${year - 1}-${year}`);
  }
  
  return seasons;
}
