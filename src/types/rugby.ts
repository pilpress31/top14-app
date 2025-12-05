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

  // ✅ Scores fixes issus du fichier Excel
  score_domicile: number;
  score_exterieur: number;
  score_ht_domicile?: number;
  score_ht_exterieur?: number;
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
  equipe: string;
  rang: number;
  elo?: number;                 // optionnel si ton JSON contient encore ce champ
  variation?: number;           // optionnel
}

// ✅ Configuration globale de l’application
export interface ConfigApp {
  version: string;
  derniere_mise_a_jour: string;
  nombre_matchs_historique: number;
  nombre_matchs_futurs: number;
  nombre_equipes: number;
}
