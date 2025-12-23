/**
 * Données des équipes du Top 14 - Logos locaux
 */

export interface TeamData {
  nom: string;
  nomCourt: string;
  ville: string;
  logo: string;
  emoji: string;
  couleur: string;
}

// Mapping des noms d'équipes avec leurs données
const teamsData: Record<string, TeamData> = {
  'Toulouse': {
    nom: 'Stade Toulousain',
    nomCourt: 'Toulouse',
    ville: 'Toulouse',
    logo: '/logos/toulouse.png',
    emoji: '🔴',
    couleur: '#E4002B'
  },
  'La Rochelle': {
    nom: 'Stade Rochelais',
    nomCourt: 'La Rochelle',
    ville: 'La Rochelle',
    logo: '/logos/la-rochelle.png',
    emoji: '⚓',
    couleur: '#FFD700'
  },
  'Bordeaux-Bègles': {
    nom: 'Union Bordeaux-Bègles',
    nomCourt: 'Bordeaux',
    ville: 'Bordeaux',
    logo: '/logos/ubb.png',
    emoji: '🔵',
    couleur: '#003366'
  },
  'Racing 92': {
    nom: 'Racing 92',
    nomCourt: 'Racing',
    ville: 'Nanterre',
    logo: '/logos/racing92.png',
    emoji: '⭐',
    couleur: '#75B2DD'
  },
  'Lyon': {
    nom: 'Lyon Olympique Universitaire',
    nomCourt: 'Lyon',
    ville: 'Lyon',
    logo: '/logos/lyon.png',
    emoji: '🦁',
    couleur: '#C8102E'
  },
  'Clermont': {
    nom: 'ASM Clermont Auvergne',
    nomCourt: 'Clermont',
    ville: 'Clermont-Ferrand',
    logo: '/logos/clermont.png',
    emoji: '🟡',
    couleur: '#FFD100'
  },
  'Toulon': {
    nom: 'RC Toulon',
    nomCourt: 'Toulon',
    ville: 'Toulon',
    logo: '/logos/toulon.png',
    emoji: '⚫',
    couleur: '#000000'
  },
  'Castres': {
    nom: 'Castres Olympique',
    nomCourt: 'Castres',
    ville: 'Castres',
    logo: '/logos/castres.png',
    emoji: '🔵',
    couleur: '#003D7A'
  },
  'Montpellier': {
    nom: 'Montpellier Hérault Rugby',
    nomCourt: 'Montpellier',
    ville: 'Montpellier',
    logo: '/logos/montpellier.png',
    emoji: '🔵',
    couleur: '#002D62'
  },
  'Pau': {
    nom: 'Section Paloise',
    nomCourt: 'Pau',
    ville: 'Pau',
    logo: '/logos/pau.png',
    emoji: '🟢',
    couleur: '#009A44'
  },
  'Bayonne': {
    nom: 'Aviron Bayonnais',
    nomCourt: 'Bayonne',
    ville: 'Bayonne',
    logo: '/logos/bayonne.png',
    emoji: '⚪',
    couleur: '#005EB8'
  },
  'Perpignan': {
    nom: 'USA Perpignan',
    nomCourt: 'Perpignan',
    ville: 'Perpignan',
    logo: '/logos/perpignan.png',
    emoji: '🔴',
    couleur: '#CD1F2A'
  },
  'Stade Français': {
    nom: 'Stade Français Paris',
    nomCourt: 'Stade Français',
    ville: 'Paris',
    logo: '/logos/paris.png',
    emoji: '🌸',
    couleur: '#EA5B9B'
  },
  'Vannes': {
    nom: 'RC Vannes',
    nomCourt: 'Vannes',
    ville: 'Vannes',
    logo: '/logos/vannes.png',
    emoji: '⚫',
    couleur: '#000000'
  }
};

// Alias pour les variations de noms
const aliases: Record<string, string> = {
  'ST': 'Toulouse',
  'Stade Toulousain': 'Toulouse',
  'UBB': 'Bordeaux-Bègles',
  'Bordeaux': 'Bordeaux-Bègles',
  'Union Bordeaux-Bègles': 'Bordeaux-Bègles',
  'Racing': 'Racing 92',
  'LOU': 'Lyon',
  'Lyon OU': 'Lyon',
  'ASM': 'Clermont',
  'Clermont Auvergne': 'Clermont',
  'ASM Clermont': 'Clermont',
  'RCT': 'Toulon',
  'RC Toulon': 'Toulon',
  'CO': 'Castres',
  'Castres Olympique': 'Castres',
  'MHR': 'Montpellier',
  'Montpellier HR': 'Montpellier',
  'Section Paloise': 'Pau',
  'Aviron Bayonnais': 'Bayonne',
  'USAP': 'Perpignan',
  'USA Perpignan': 'Perpignan',
  'SF': 'Stade Français',
  'Stade Français Paris': 'Stade Français',
  'La Rochelle SR': 'La Rochelle',
  'Stade Rochelais': 'La Rochelle'
};

/**
 * Récupère les données d'une équipe à partir de son nom
 */
export function getTeamData(nomEquipe: string): TeamData {
  // Nettoyer le nom (trim, casse)
  const nomClean = nomEquipe.trim();
  
  // Chercher dans les alias
  const nomReel = aliases[nomClean] || nomClean;
  
  // Retourner les données ou des valeurs par défaut
  if (teamsData[nomReel]) {
    return teamsData[nomReel];
  }
  
  // Fallback si équipe inconnue
  return {
    nom: nomEquipe,
    nomCourt: nomEquipe,
    ville: nomEquipe,
    logo: '/logos/default.png',
    emoji: '🏉',
    couleur: '#666666'
  };
}

/**
 * Récupère toutes les équipes
 */
export function getAllTeams(): TeamData[] {
  return Object.values(teamsData);
}

/**
 * Vérifie si une équipe existe
 */
export function teamExists(nomEquipe: string): boolean {
  const nomClean = nomEquipe.trim();
  const nomReel = aliases[nomClean] || nomClean;
  return teamsData[nomReel] !== undefined;
}

export default teamsData;
