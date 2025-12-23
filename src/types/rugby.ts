// ✅ Type structuré pour les scores (utile pour mi-temps)
export interface Score {
  domicile: number;
  exterieur: number;
}

// ✅ Match futur (structure JSON Excel)
export interface Match {
  id: string | number;
  date: string;                 // format ISO
  saison: string;
  journee: number;

  // Équipes
  equipe_domicile: string;
  equipe_exterieure: string;

  // ✅ Scores (peuvent être null si pas encore calculés)
  score_domicile: number | null;
  score_exterieur: number | null;
  score_ht_domicile?: number | null;
  score_ht_exterieur?: number | null;
  
  // ✅ Confiance
  confiance_ft?: number | null;
  confiance_ht?: number | null;
  
  // ✅ Objet score pour compatibilité
  score_ht?: Score | null;
}

// ✅ Match historique avec résultats réels
export interface MatchHistorique {
  id: string | number;
  date: string;
  saison: string;
  journee: number;
  equipe_domicile: string;
  equipe_exterieure: string;
  score_domicile: number;
  score_exterieur: number;
  score_ht: Score;              // regroupé en objet Score
  vainqueur?: string;           // optionnel
}

// ✅ Statistiques par équipe (issues du JSON statique)
export interface EquipeStats {
  rang: number;
  equipe: string;
  points_classement?: number;  // Points officiels du championnat
  saison?: string;
  matchs_joues: number;
  victoires: number;
  nuls: number;
  defaites: number;
  points_pour: number;
  points_contre: number;
  differentiel: number;
  points_moy_pour?: number;
  points_moy_contre?: number;
  taux_victoires?: number;
  pct_victoires_domicile?: number;
  pct_victoires_exterieur?: number;
  serie_en_cours?: string;
  victoires_consecutives?: number;
  defaites_consecutives?: number;
  regularite?: number;
  forme?: string[]; // ['V', 'V', 'D', 'V', 'N']
}

// ✅ Configuration globale de l’application
export interface ConfigApp {
  version: string;
  derniere_mise_a_jour: string;
  nombre_matchs_historique: number;
  nombre_matchs_futurs: number;
  nombre_equipes: number;
}
