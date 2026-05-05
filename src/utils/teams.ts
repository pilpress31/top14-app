// ============================================================
// teams.ts — Mapping équipes → logos
// ============================================================
// Top 14, Pro D2, et Champions Cup (HCup)
// Tous les noms sont en MAJUSCULES car la fonction getTeamData
// fait un .toUpperCase() avant la lookup.
// ============================================================

export const TEAMS_DATA = {

  // ════════════════════════════════════════════════════════════
  //  TOP 14 (équipes françaises de l'élite)
  // ════════════════════════════════════════════════════════════

  'STADE TOULOUSAIN': { logo: '/logos/toulouse.svg', name: 'Toulouse' },
  'TOULOUSE': { logo: '/logos/toulouse.svg', name: 'Toulouse' },

  'UNION BORDEAUX BÈGLES': { logo: '/logos/ubb.svg', name: 'Bordeaux' },
  'BORDEAUX BÈGLES': { logo: '/logos/ubb.svg', name: 'Bordeaux' },
  'UNION BORDEAUX-BÈGLES': { logo: '/logos/ubb.svg', name: 'Bordeaux' },
  'BORDEAUX-BÈGLES': { logo: '/logos/ubb.svg', name: 'Bordeaux' },
  'BORDEAUX': { logo: '/logos/ubb.svg', name: 'Bordeaux' }, // ← alias HCup
  'UBB': { logo: '/logos/ubb.svg', name: 'Bordeaux' },

  'LA ROCHELLE': { logo: '/logos/la-rochelle.svg', name: 'La Rochelle' },
  'STADE ROCHELAIS': { logo: '/logos/la-rochelle.svg', name: 'La Rochelle' },

  'RACING 92': { logo: '/logos/racing92.svg', name: 'Racing 92' },
  'RACING': { logo: '/logos/racing92.svg', name: 'Racing 92' },

  'ASM CLERMONT': { logo: '/logos/clermont.svg', name: 'Clermont' },
  'CLERMONT AUVERGNE': { logo: '/logos/clermont.svg', name: 'Clermont' },
  'ASM CLERMONT AUVERGNE': { logo: '/logos/clermont.svg', name: 'Clermont' },
  'CLERMONT': { logo: '/logos/clermont.svg', name: 'Clermont' }, // ← alias HCup
  'ASM': { logo: '/logos/clermont.svg', name: 'Clermont' },

  'CASTRES OLYMPIQUE': { logo: '/logos/castres.svg', name: 'Castres' },
  'CASTRES': { logo: '/logos/castres.svg', name: 'Castres' },

  'MONTPELLIER HR': { logo: '/logos/montpellier.svg', name: 'Montpellier' },
  'MONTPELLIER': { logo: '/logos/montpellier.svg', name: 'Montpellier' },
  'MONTPELLIER HÉRAULT RUGBY': { logo: '/logos/montpellier.svg', name: 'Montpellier' },

  'STADE FRANÇAIS': { logo: '/logos/paris.svg', name: 'Stade Français' },
  'STADE FRANÇAIS PARIS': { logo: '/logos/paris.svg', name: 'Stade Français' },

  'LYON': { logo: '/logos/lyon.svg', name: 'Lyon' },
  'LOU RUGBY': { logo: '/logos/lyon.svg', name: 'Lyon' },
  'LYON OU': { logo: '/logos/lyon.svg', name: 'Lyon' },

  'TOULON': { logo: '/logos/toulon.svg', name: 'Toulon' },
  'RC TOULON': { logo: '/logos/toulon.svg', name: 'Toulon' },

  'PERPIGNAN': { logo: '/logos/perpignan.svg', name: 'Perpignan' },
  'USA PERPIGNAN': { logo: '/logos/perpignan.svg', name: 'Perpignan' },
  'USAP': { logo: '/logos/perpignan.svg', name: 'Perpignan' },

  'BAYONNE': { logo: '/logos/bayonne.svg', name: 'Bayonne' },
  'AVIRON BAYONNAIS': { logo: '/logos/bayonne.svg', name: 'Bayonne' },

  'PAU': { logo: '/logos/pau.svg', name: 'Pau' },
  'SECTION PALOISE': { logo: '/logos/pau.svg', name: 'Pau' },

  'AGEN': { logo: '/logos/agen.svg', name: 'Agen' },
  'SU AGEN': { logo: '/logos/agen.svg', name: 'Agen' },

  // ════════════════════════════════════════════════════════════
  //  PRO D2
  // ════════════════════════════════════════════════════════════

  'US DAX': { logo: '/logos/dax.svg', name: 'Dax' },
  'DAX': { logo: '/logos/dax.svg', name: 'Dax' },
  'US DAX RUGBY': { logo: '/logos/dax.svg', name: 'Dax' },

  'MONT DE MARSAN': { logo: '/logos/mont-de-marsan.svg', name: 'Mont-de-Marsan' },
  'STADE MONTOIS': { logo: '/logos/mont-de-marsan.svg', name: 'Mont-de-Marsan' },
  'STADE MONTOIS RUGBY': { logo: '/logos/mont-de-marsan.svg', name: 'Mont-de-Marsan' },
  'MONT-DE-MARSAN': { logo: '/logos/mont-de-marsan.svg', name: 'Mont-de-Marsan' },

  'BOURGOIN': { logo: '/logos/bourgoin.svg', name: 'Bourgoin-Jallieu' },
  'BOURGOIN-JALLIEU': { logo: '/logos/bourgoin.svg', name: 'Bourgoin-Jallieu' },
  'CS BOURGOIN-JALLIEU': { logo: '/logos/bourgoin.svg', name: 'Bourgoin-Jallieu' },
  'CSBJ': { logo: '/logos/bourgoin.svg', name: 'Bourgoin-Jallieu' },

  'AUCH': { logo: '/logos/auch.svg', name: 'Auch' },
  'RC AUCH': { logo: '/logos/auch.svg', name: 'Auch' },

  'BRIVE': { logo: '/logos/brive.svg', name: 'Brive' },
  'CA BRIVE': { logo: '/logos/brive.svg', name: 'Brive' },

  'VANNES': { logo: '/logos/vannes.svg', name: 'Vannes' },
  'RC VANNES': { logo: '/logos/vannes.svg', name: 'Vannes' },

  'BIARRITZ': { logo: '/logos/biarritz.svg', name: 'Biarritz' },
  'BIARRITZ OLYMPIQUE': { logo: '/logos/biarritz.svg', name: 'Biarritz' },
  'BIARRITZ OLYMPIQUE PB': { logo: '/logos/biarritz.svg', name: 'Biarritz' },

  'COLOMIERS': { logo: '/logos/colomiers.svg', name: 'Colomiers' },
  'COLOMIERS RUGBY': { logo: '/logos/colomiers.svg', name: 'Colomiers' },

  'FC GRENOBLE': { logo: '/logos/grenoble.svg', name: 'Grenoble' },
  'FC GRENOBLE RUGBY': { logo: '/logos/grenoble.svg', name: 'Grenoble' },
  'GRENOBLE': { logo: '/logos/grenoble.svg', name: 'Grenoble' },

  'OYONNAX': { logo: '/logos/oyonnax.svg', name: 'Oyonnax' },
  'OYONNAX RUGBY': { logo: '/logos/oyonnax.svg', name: 'Oyonnax' },

  'NEVERS': { logo: '/logos/nevers.svg', name: 'Nevers' },
  'USON NEVERS': { logo: '/logos/nevers.svg', name: 'Nevers' },
  'USON NEVERS RUGBY': { logo: '/logos/nevers.svg', name: 'Nevers' },

  'CARCASSONNE': { logo: '/logos/carcassonne.svg', name: 'Carcassonne' },
  'US CARCASSONNE': { logo: '/logos/carcassonne.svg', name: 'Carcassonne' },
  'US CARCASSONNAISE': { logo: '/logos/carcassonne.svg', name: 'Carcassonnaise' },

  'AURILLAC': { logo: '/logos/aurillac.svg', name: 'Aurillac' },
  'STADE AURILLACOIS': { logo: '/logos/aurillac.svg', name: 'Aurillac' },

  'PROVENCE': { logo: '/logos/provence.svg', name: 'Provence' },
  'PROVENCE RUGBY': { logo: '/logos/provence.svg', name: 'Provence' },

  'ROUEN': { logo: '/logos/rouen.svg', name: 'Rouen' },
  'ROUEN NORMANDIE': { logo: '/logos/rouen.svg', name: 'Rouen' },
  'ROUEN NORMANDIE RUGBY': { logo: '/logos/rouen.svg', name: 'Rouen' },

  'SOYAUX-ANGOULÊME': { logo: '/logos/soyaux-angouleme.svg', name: 'Soyaux-Angoulême' },
  'SOYAUX-ANGOULÊME XV': { logo: '/logos/soyaux-angouleme.svg', name: 'Soyaux-Angoulême' },
  'SOYAUX-ANGOULÊME XV CHARENTE': { logo: '/logos/soyaux-angouleme.svg', name: 'Soyaux-Angoulême' },

  'MASSY': { logo: '/logos/massy.svg', name: 'Massy' },
  'RC MASSY': { logo: '/logos/massy.svg', name: 'Massy' },
  'RC MASSY ESSONNE': { logo: '/logos/massy.svg', name: 'Massy' },

  'VALENCE-ROMANS': { logo: '/logos/valence-romans.svg', name: 'Valence Romans' },
  'VALENCE ROMANS': { logo: '/logos/valence-romans.svg', name: 'Valence Romans' },
  'VALENCE ROMANS DRÔME RUGBY': { logo: '/logos/valence-romans.svg', name: 'Valence Romans' },

  'NARBONNE': { logo: '/logos/narbonne.svg', name: 'Narbonne' },
  'RC NARBONNE': { logo: '/logos/narbonne.svg', name: 'Narbonne' },

  'ALBI': { logo: '/logos/albi.svg', name: 'Albi' },
  'SC ALBI': { logo: '/logos/albi.svg', name: 'Albi' },

  'TARBES': { logo: '/logos/tarbes.svg', name: 'Tarbes' },
  'STADO TARBES': { logo: '/logos/tarbes.svg', name: 'Tarbes' },
  'STADO TARBES PYRÉNÉES': { logo: '/logos/tarbes.svg', name: 'Tarbes' },
  'STADO TARBES PYRÉNÉES RUGBY': { logo: '/logos/tarbes.svg', name: 'Tarbes' },

  'BLAGNAC': { logo: '/logos/blagnac.svg', name: 'Blagnac' },
  'BOURG-EN-BRESSE': { logo: '/logos/bourg-en-bresse.svg', name: 'Bourg-en-Bresse' },
  'GAILLAC': { logo: '/logos/gaillac.svg', name: 'Gaillac' },
  'LANNEMEZAN': { logo: '/logos/lannemezan.svg', name: 'Lannemezan' },
  'LIMOGES': { logo: '/logos/limoges.svg', name: 'Limoges' },
  'PÉRIGUEUX': { logo: '/logos/perigueux.svg', name: 'Périgueux' },
  'SAINT-ETIENNE': { logo: '/logos/saint-etienne.svg', name: 'Saint-Étienne' },
  'TYROSSE': { logo: '/logos/tyrosse.svg', name: 'Tyrosse' },

  'BÉZIERS': { logo: '/logos/beziers.svg', name: 'Béziers' },
  'AS BÉZIERS': { logo: '/logos/beziers.svg', name: 'Béziers' },
  'AS BÉZIERS HÉRAULT': { logo: '/logos/beziers.svg', name: 'Béziers' },

  'MONTAUBAN': { logo: '/logos/montauban.svg', name: 'Montauban' },
  'US MONTAUBAN': { logo: '/logos/montauban.svg', name: 'Montauban' },

  'NICE': { logo: '/logos/nice.svg', name: 'Nice' },

  // ════════════════════════════════════════════════════════════
  //  CHAMPIONS CUP — Premiership (Angleterre)
  // ════════════════════════════════════════════════════════════

  'BATH': { logo: '/logos/bath.svg', name: 'Bath' },
  'BATH RUGBY': { logo: '/logos/bath.svg', name: 'Bath' },

  'BRISTOL': { logo: '/logos/bristol.svg', name: 'Bristol' },
  'BRISTOL BEARS': { logo: '/logos/bristol.svg', name: 'Bristol' },

  'EXETER': { logo: '/logos/exeter.svg', name: 'Exeter' },
  'EXETER CHIEFS': { logo: '/logos/exeter.svg', name: 'Exeter' },

  'GLOUCESTER': { logo: '/logos/gloucester.svg', name: 'Gloucester' },
  'GLOUCESTER RUGBY': { logo: '/logos/gloucester.svg', name: 'Gloucester' },

  'HARLEQUINS': { logo: '/logos/harlequins.svg', name: 'Harlequins' },

  'LEICESTER': { logo: '/logos/leicester.svg', name: 'Leicester' },
  'LEICESTER TIGERS': { logo: '/logos/leicester.svg', name: 'Leicester' },

  'NORTHAMPTON': { logo: '/logos/northampton.svg', name: 'Northampton' },
  'NORTHAMPTON SAINTS': { logo: '/logos/northampton.svg', name: 'Northampton' },

  'SALE': { logo: '/logos/sale.svg', name: 'Sale' },
  'SALE SHARKS': { logo: '/logos/sale.svg', name: 'Sale' },

  'SARACENS': { logo: '/logos/saracens.svg', name: 'Saracens' },

  // ════════════════════════════════════════════════════════════
  //  CHAMPIONS CUP — URC : Irlande, Pays de Galles, Écosse, Italie, Afrique du Sud
  // ════════════════════════════════════════════════════════════

  // Irlande
  'LEINSTER': { logo: '/logos/leinster.svg', name: 'Leinster' },
  'LEINSTER RUGBY': { logo: '/logos/leinster.svg', name: 'Leinster' },

  'MUNSTER': { logo: '/logos/munster.svg', name: 'Munster' },
  'MUNSTER RUGBY': { logo: '/logos/munster.svg', name: 'Munster' },

  'ULSTER': { logo: '/logos/ulster.svg', name: 'Ulster' },
  'ULSTER RUGBY': { logo: '/logos/ulster.svg', name: 'Ulster' },

  'CONNACHT': { logo: '/logos/connacht.svg', name: 'Connacht' },
  'CONNACHT RUGBY': { logo: '/logos/connacht.svg', name: 'Connacht' },

  // Pays de Galles
  'CARDIFF': { logo: '/logos/cardiff.svg', name: 'Cardiff' },
  'CARDIFF RUGBY': { logo: '/logos/cardiff.svg', name: 'Cardiff' },
  'CARDIFF BLUES': { logo: '/logos/cardiff.svg', name: 'Cardiff' },

  'OSPREYS': { logo: '/logos/ospreys.svg', name: 'Ospreys' },

  'SCARLETS': { logo: '/logos/scarlets.svg', name: 'Scarlets' },

  // Écosse
  'EDINBURGH': { logo: '/logos/edinburgh.svg', name: 'Edinburgh' },
  'EDINBURGH RUGBY': { logo: '/logos/edinburgh.svg', name: 'Edinburgh' },

  'GLASGOW': { logo: '/logos/glasgow.svg', name: 'Glasgow' },
  'GLASGOW WARRIORS': { logo: '/logos/glasgow.svg', name: 'Glasgow' },

  // Italie
  'BENETTON': { logo: '/logos/benetton.svg', name: 'Benetton' },
  'BENETTON RUGBY': { logo: '/logos/benetton.svg', name: 'Benetton' },
  'BENETTON TREVISO': { logo: '/logos/benetton.svg', name: 'Benetton' },

  // Afrique du Sud
  'BULLS': { logo: '/logos/bulls.svg', name: 'Bulls' },
  'VODACOM BULLS': { logo: '/logos/bulls.svg', name: 'Bulls' },

  'SHARKS': { logo: '/logos/sharks.svg', name: 'Sharks' },
  'CELL C SHARKS': { logo: '/logos/sharks.svg', name: 'Sharks' },

  'STORMERS': { logo: '/logos/stormers.svg', name: 'Stormers' },
  'DHL STORMERS': { logo: '/logos/stormers.svg', name: 'Stormers' },
};

// ============================================================
// Fonction helper : retourne les données d'une équipe
// ============================================================
export function getTeamData(teamName) {
  const normalizedName = teamName?.toUpperCase().trim();
  return TEAMS_DATA[normalizedName] || {
    logo: '/logos/default.svg',
    name: teamName,
  };
}
