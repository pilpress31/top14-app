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
  'STADE NIÇOIS': { logo: '/logos/nice.svg', name: 'Nice' },
  'STADE NIÇOIS RUGBY': { logo: '/logos/nice.svg', name: 'Nice' },
  'STADE NICOIS': { logo: '/logos/nice.svg', name: 'Nice' },        // sans cédille (au cas où)
  'STADE NICOIS RUGBY': { logo: '/logos/nice.svg', name: 'Nice' },  // sans cédille (au cas où)


  // ════════════════════════════════════════════════════════════
  //  ALIASES SANS ACCENTS (robustesse encodage Windows/JSON)
  // ════════════════════════════════════════════════════════════

  'UNION BORDEAUX BEGLES':         { logo: '/logos/ubb.svg', name: 'Bordeaux' },
  'UNION BORDEAUX-BEGLES':         { logo: '/logos/ubb.svg', name: 'Bordeaux' },
  'BORDEAUX BEGLES':               { logo: '/logos/ubb.svg', name: 'Bordeaux' },
  'BEGLES-BORDEAUX':               { logo: '/logos/ubb.svg', name: 'Bordeaux' },

  'MONTPELLIER HERAULT RUGBY':     { logo: '/logos/montpellier.svg', name: 'Montpellier' },
  'MONTPELLIER HERAULT':           { logo: '/logos/montpellier.svg', name: 'Montpellier' },

  'STADE FRANCAIS PARIS':          { logo: '/logos/paris.svg', name: 'Stade Français' },
  'STADE FRANCAIS':                { logo: '/logos/paris.svg', name: 'Stade Français' },

  'AS BEZIERS HERAULT':            { logo: '/logos/beziers.svg', name: 'Béziers' },
  'AS BEZIERS':                    { logo: '/logos/beziers.svg', name: 'Béziers' },
  'BEZIERS':                       { logo: '/logos/beziers.svg', name: 'Béziers' },

  // ════════════════════════════════════════════════════════════
  //  PALMARÈS HISTORIQUE — clubs anciens
  // ════════════════════════════════════════════════════════════

  'FC LOURDES':                    { logo: '/logos/lourdes.svg', name: 'Lourdes' },
  'LOURDES':                       { logo: '/logos/lourdes.svg', name: 'Lourdes' },

  'US COLOMIERS':                  { logo: '/logos/colomiers.svg', name: 'Colomiers' },

  'STADE TARBES':                  { logo: '/logos/tarbes.svg', name: 'Tarbes' },
  'STADO TARBES':                  { logo: '/logos/tarbes.svg', name: 'Tarbes' },

  'NICE RUGBY':                    { logo: '/logos/nice.svg', name: 'Nice' },

  'BAGNÈRES':                      { logo: '/logos/bagneres.svg', name: 'Bagnères' },
  'BAGNERES':                      { logo: '/logos/bagneres.svg', name: 'Bagnères' },
  'MAZAMET':                       { logo: '/logos/mazamet.svg', name: 'Mazamet' },
  'COGNAC':                        { logo: '/logos/cognac.svg', name: 'Cognac' },
  'CARCASSONNE':                   { logo: '/logos/carcassonne.svg', name: 'Carcassonne' },
  'US CARCASSONNE':                { logo: '/logos/carcassonne.svg', name: 'Carcassonne' },
  'FC LYON':                       { logo: '/logos/fclyon.svg', name: 'FC Lyon' },
  'STADE BORDELAIS':               { logo: '/logos/stadebordelais.svg', name: 'Stade Bordelais' },
  'SCUF':                          { logo: '/logos/scuf.svg', name: 'SCUF Paris' },
  'LA VOULTE':                     { logo: '/logos/lavoulte.svg', name: 'La Voulte' },
  'QUILLAN':                       { logo: '/logos/quillan.svg', name: 'Quillan' },
  'LÉZIGNAN':                      { logo: '/logos/lezignan.svg', name: 'Lézignan' },
  'LEZIGNAN':                      { logo: '/logos/lezignan.svg', name: 'Lézignan' },
  'CARMAUX':                       { logo: '/logos/carmaux.svg', name: 'Carmaux' },
  'SC VIENNE':                     { logo: '/logos/scvienne.svg', name: 'SC Vienne' },
  'VIENNE':                        { logo: '/logos/scvienne.svg', name: 'SC Vienne' },

  // ════════════════════════════════════════════════════════════
  //  CLUBS HISTORIQUES 2e DIVISION (1925-2000)
  //  Logos générés dans logos_historiques_d2/
  // ════════════════════════════════════════════════════════════

  // — 1925-1939 —
  'AS MONTFERRAND':                { logo: '/logos/as_montferrand.svg', name: 'AS Montferrand' },
  'NAC ROANNE':                    { logo: '/logos/nac_roanne.svg', name: 'NAC Roanne' },
  'AS BORTOISE':                   { logo: '/logos/as_bortoise.svg', name: 'AS Bortoise' },
  'UA LIBOURNE':                   { logo: '/logos/ua_libourne.svg', name: 'UA Libourne' },
  'CS VILLEFRANCHE-SUR-SAÔNE':     { logo: '/logos/cs_villefranche.svg', name: 'CS Villefranche' },
  'STADE NANTAIS':                 { logo: '/logos/stade_nantais.svg', name: 'Stade Nantais' },
  'STADE POITEVIN':                { logo: '/logos/stade_poitevin.svg', name: 'Stade Poitevin' },
  'SC DECAZEVILLE':                { logo: '/logos/sc_decazeville.svg', name: 'SC Decazeville' },
  'AVENIR VALENCIEN':              { logo: '/logos/avenir_valencien.svg', name: 'Avenir Valencien' },
  'US BRESSANE':                   { logo: '/logos/us_bressane.svg', name: 'US Bressane' },

  // — 1948-1963 —
  'STADOCESTE TARBAIS':            { logo: '/logos/stadoceste_tarbais.svg', name: 'Stadoceste Tarbais' },
  'SC GRAULHET':                   { logo: '/logos/sc_graulhet.svg', name: 'SC Graulhet' },
  'CASG PARIS':                    { logo: '/logos/casg_paris.svg', name: 'CASG Paris' },
  'AVENIR ATURIN RUGBY':           { logo: '/logos/avenir_aturin.svg', name: 'Avenir Aturin' },
  'SO CHAMBÉRY':                   { logo: '/logos/so_chambery.svg', name: 'SO Chambéry' },
  'STADE CADURCIEN':               { logo: '/logos/stade_cadurcien.svg', name: 'Stade Cadurcien' },
  'US BERGERAC':                   { logo: '/logos/us_bergerac.svg', name: 'US Bergerac' },
  'AS SAINT-JUNIEN':               { logo: '/logos/as_saint_junien.svg', name: 'AS Saint-Junien' },
  'GS FIGEAC':                     { logo: '/logos/gs_figeac.svg', name: 'GS Figeac' },
  'STADE LANGONNAIS':              { logo: '/logos/stade_langonnais.svg', name: 'Stade Langonnais' },

  // — 1966-1982 —
  'SAINT-JEAN-DE-LUZ OLYMPIQUE':   { logo: '/logos/saint_jean_de_luz.svg', name: 'St-Jean-de-Luz' },
  'PARIS UNIVERSITÉ CLUB':         { logo: '/logos/paris_universite_club.svg', name: 'Paris UC' },
  'STADE RUTHÉNOIS':               { logo: '/logos/stade_ruthenois.svg', name: 'Stade Ruthénois' },
  'CA CASTELSARRASIN':             { logo: '/logos/ca_castelsarrasin.svg', name: 'CA Castelsarrasin' },
  'US VICQUOISE':                  { logo: '/logos/us_vicquoise.svg', name: 'US Vicquoise' },
  'SA CONDOM':                     { logo: '/logos/sa_condom.svg', name: 'SA Condom' },
  'US MONTÉLIMAR':                 { logo: '/logos/us_montelimar.svg', name: 'US Montélimar' },
  'SA HAGETMAUTIEN':               { logo: '/logos/sa_hagetmautien.svg', name: 'SA Hagetmautien' },
  'US SALLES':                     { logo: '/logos/us_salles.svg', name: 'US Salles' },
  'STADE MONTLUÇONNAIS':           { logo: '/logos/stade_montluconnais.svg', name: 'Stade Montluçonnais' },

  // — 1983-1998 —
  'BLAGNAC SCR':                   { logo: '/logos/blagnac_scr.svg', name: 'Blagnac SCR' },
  'SC MAZAMET':                    { logo: '/logos/mazamet.svg', name: 'Mazamet' },
  'FCS RUMILLY':                   { logo: '/logos/fcs_rumilly.svg', name: 'FCS Rumilly' },
  'RC VICHY':                      { logo: '/logos/rc_vichy.svg', name: 'RC Vichy' },
  'ASPTT PARIS':                   { logo: '/logos/asptt_paris.svg', name: 'ASPTT Paris' },
  'FLEURY OLYMPIQUE':              { logo: '/logos/fleury_olympique.svg', name: 'Fleury Olympique' },
  'CÉRET SPORTIF':                 { logo: '/logos/ceret_sportif.svg', name: 'Céret Sportif' },
  'PEYREHORADE SPORTS':            { logo: '/logos/peyrehorade_sports.svg', name: 'Peyrehorade' },
  'STADE PISCENOIS':               { logo: '/logos/stade_piscenois.svg', name: 'Stade Piscenois' },
  'US TOURS':                      { logo: '/logos/us_tours.svg', name: 'US Tours' },

  // — Compléments —
  'US CARMAUX':                    { logo: '/logos/us_carmaux.svg', name: 'US Carmaux' },
  'RRC NICE':                      { logo: '/logos/nice.svg', name: 'Nice' },
  'USA LIMOGES':                   { logo: '/logos/limoges.svg', name: 'Limoges' },
  'US COGNAC':                     { logo: '/logos/cognac.svg', name: 'Cognac' },
  'UA GAILLAC':                    { logo: '/logos/gaillac.svg', name: 'Gaillac' },
  'ENTENTE QUILLAN-ESPERAZA':      { logo: '/logos/quillan.svg', name: 'Quillan' },
  'FC LÉZIGNAN':                   { logo: '/logos/lezignan.svg', name: 'Lézignan' },
  'LA VOULTE SPORTIF':             { logo: '/logos/lavoulte.svg', name: 'La Voulte' },
  'STADE BORDELAIS UC':            { logo: '/logos/stadebordelais.svg', name: 'Stade Bordelais' },
  'STADE BEAUMONTOIS':             { logo: '/logos/stade_beaumontois.svg', name: 'Stade Beaumontois' },
  'RACING CLUB DE FRANCE':         { logo: '/logos/racing92.svg', name: 'Racing Club de France' },
  'RACING MÉTRO 92':               { logo: '/logos/racing92.svg', name: 'Racing 92' },
  'OLYMPIQUE DE CARMAUX':          { logo: '/logos/carmaux.svg', name: 'Carmaux' },
  'STADE AUTO LYONNAIS':           { logo: '/logos/fclyon.svg', name: 'Stade Lyonnais' },

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

  // 🆕 Premiership historique (clubs disparus, relégués ou en faillite)
  'WASPS': { logo: '/logos/wasps.svg', name: 'Wasps' },
  'LONDON WASPS': { logo: '/logos/wasps.svg', name: 'Wasps' },
  'WASPS RUGBY': { logo: '/logos/wasps.svg', name: 'Wasps' },

  'NEWCASTLE': { logo: '/logos/newcastle.svg', name: 'Newcastle' },
  'NEWCASTLE FALCONS': { logo: '/logos/newcastle.svg', name: 'Newcastle' },

  'LEEDS': { logo: '/logos/leeds.svg', name: 'Leeds' },
  'LEEDS TYKES': { logo: '/logos/leeds.svg', name: 'Leeds' },
  'LEEDS CARNEGIE': { logo: '/logos/leeds.svg', name: 'Leeds' },

  'LONDON IRISH': { logo: '/logos/london-irish.svg', name: 'London Irish' },

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

  // 🆕 Pays de Galles : franchises actuelles + historiques
  'DRAGONS': { logo: '/logos/dragons.svg', name: 'Dragons' },
  'DRAGONS RUGBY': { logo: '/logos/dragons.svg', name: 'Dragons' },
  'NEWPORT GWENT DRAGONS': { logo: '/logos/dragons.svg', name: 'Dragons' },

  'BRIDGEND': { logo: '/logos/bridgend.svg', name: 'Bridgend' },
  'EBBW VALE': { logo: '/logos/ebbw-vale.svg', name: 'Ebbw Vale' },

  // Écosse
  'EDINBURGH': { logo: '/logos/edinburgh.svg', name: 'Edinburgh' },
  'EDINBURGH RUGBY': { logo: '/logos/edinburgh.svg', name: 'Edinburgh' },

  'GLASGOW': { logo: '/logos/glasgow.svg', name: 'Glasgow' },
  'GLASGOW WARRIORS': { logo: '/logos/glasgow.svg', name: 'Glasgow' },

  // 🆕 Écosse historique
  'BORDER REIVERS': { logo: '/logos/border-reivers.svg', name: 'Border Reivers' },

  // Italie
  'BENETTON': { logo: '/logos/benetton.svg', name: 'Benetton' },
  'BENETTON RUGBY': { logo: '/logos/benetton.svg', name: 'Benetton' },
  'BENETTON TREVISO': { logo: '/logos/benetton.svg', name: 'Benetton' },

  // 🆕 Italie : franchise actuelle Zebre + clubs historiques
  'ZEBRE': { logo: '/logos/zebre.svg', name: 'Zebre' },
  'ZEBRE PARMA': { logo: '/logos/zebre.svg', name: 'Zebre' },

  'CALVISANO': { logo: '/logos/calvisano.svg', name: 'Calvisano' },
  "L'AQUILA": { logo: '/logos/laquila.svg', name: "L'Aquila" },
  'MILAN': { logo: '/logos/milan.svg', name: 'Milan' },
  'PARMA': { logo: '/logos/parma.svg', name: 'Parma' },
  'PETRARCA': { logo: '/logos/petrarca.svg', name: 'Petrarca' },
  'ROMA': { logo: '/logos/roma.svg', name: 'Roma' },

  // Afrique du Sud
  'BULLS': { logo: '/logos/bulls.svg', name: 'Bulls' },
  'VODACOM BULLS': { logo: '/logos/bulls.svg', name: 'Bulls' },

  'SHARKS': { logo: '/logos/sharks.svg', name: 'Sharks' },
  'CELL C SHARKS': { logo: '/logos/sharks.svg', name: 'Sharks' },

  'STORMERS': { logo: '/logos/stormers.svg', name: 'Stormers' },
  'DHL STORMERS': { logo: '/logos/stormers.svg', name: 'Stormers' },

  // 🆕 Roumanie
  'FARUL CONSTANȚA': { logo: '/logos/farul-constanta.svg', name: 'Farul Constanța' },
  'FARUL CONSTANTA': { logo: '/logos/farul-constanta.svg', name: 'Farul Constanța' }, // sans cédille
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
