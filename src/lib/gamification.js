// ============================================================
// MODULE : gamification.js
// Streaks & badges. Recalcul complet depuis l'historique des paris,
// déclenché à la résolution des matchs (Top 14 / Pro D2 / HCup).
//
// Exporté :
//   - BADGES                          : config des badges (extensible)
//   - mettreAJourStreakEtBadges(ids)  : recalcule + persiste pour ces users
//
// Le recalcul est COMPLET et idempotent : pas de dérive possible, et un
// rejeu (ex. correction d'un résultat) se corrige tout seul.
//
// Règle de streak (validée avec Yoan) :
//   - on parcourt les matchs résolus dans l'ordre (resolved_at, toutes
//     compétitions confondues) ;
//   - pour chaque match : nbWon = nombre de lignes gagnées du match ;
//   - nbWon >= 1  -> la série continue, +nbWon (un double tout gagné = +2,
//                    un double à moitié gagné = +1) ;
//   - nbWon == 0  -> la série est cassée (retour à 0).
//   streak_courante = série en cours ; streak_record = max historique.
//
// Volume : paris_gagnes_total = nombre de lignes 'won' (chaque ligne compte).
// ============================================================

// ─── Catalogue des badges ────────────────────────────────────
// type 'volume' : seuil sur paris_gagnes_total
// type 'streak' : seuil sur streak_record
// Pour ajouter un badge : ajouter une entrée ici, rien d'autre à toucher.
const BADGES = [
  // Volume — nombre de paris gagnés
  { code: 'wins_1',     type: 'volume', seuil: 1,   label: 'Première victoire', description: 'Remporter son premier pari' },
  { code: 'wins_10',    type: 'volume', seuil: 10,  label: 'Apprenti parieur',  description: '10 paris gagnés' },
  { code: 'wins_25',    type: 'volume', seuil: 25,  label: 'Parieur confirmé',  description: '25 paris gagnés' },
  { code: 'wins_50',    type: 'volume', seuil: 50,  label: 'Fin connaisseur',   description: '50 paris gagnés' },
  { code: 'wins_100',   type: 'volume', seuil: 100, label: 'Expert du pari',    description: '100 paris gagnés' },
  { code: 'wins_250',   type: 'volume', seuil: 250, label: 'Légende',           description: '250 paris gagnés' },
  // Séries — meilleure streak atteinte
  { code: 'streak_3',   type: 'streak', seuil: 3,   label: 'Sur sa lancée',     description: 'Série de 3 paris gagnés' },
  { code: 'streak_5',   type: 'streak', seuil: 5,   label: 'En feu',            description: 'Série de 5 paris gagnés' },
  { code: 'streak_10',  type: 'streak', seuil: 10,  label: 'Série royale',      description: 'Série de 10 paris gagnés' },
  { code: 'streak_20',  type: 'streak', seuil: 20,  label: 'Intouchable',       description: 'Série de 20 paris gagnés' },
];

// ─── Sources de paris : une entrée par table de paris ────────
// dateField : colonne timestamp de résolution utilisée pour l'ordre.
// deletedField : colonne de soft-delete à exclure (null si absente).
const SOURCES_PARIS = [
  { table: 'user_bets',      dateField: 'resolved_at', deletedField: null },
  { table: 'user_bets_d2',   dateField: 'resolved_at', deletedField: null },
  { table: 'user_bets_hcup', dateField: 'resolved_at', deletedField: 'deleted' },
];

// ------------------------------------------------------------
// Calcule streak_courante / streak_record / paris_gagnes_total
// à partir de la liste brute des paris résolus d'UN utilisateur.
// Chaque pari : { match_id, status, resolved_at }.
// ------------------------------------------------------------
function calculerProfil(paris) {
  // Regrouper les lignes par match (un match = plusieurs lignes possibles).
  const matchs = new Map(); // match_id -> { date, won, lost }
  let parisGagnes = 0;

  for (const p of paris) {
    if (p.status !== 'won' && p.status !== 'lost') continue;
    if (p.status === 'won') parisGagnes++;

    const cle = String(p.match_id);
    if (!matchs.has(cle)) {
      matchs.set(cle, { date: p.resolved_at, won: 0, lost: 0 });
    }
    const m = matchs.get(cle);
    if (p.status === 'won') m.won++;
    else m.lost++;
    // On garde la date de résolution la plus ancienne du match (toutes
    // les lignes d'un match partagent normalement le même resolved_at).
    if (p.resolved_at && (!m.date || p.resolved_at < m.date)) {
      m.date = p.resolved_at;
    }
  }

  // Ordre chronologique des matchs (date, puis match_id pour déterminisme).
  const ordonnes = [...matchs.entries()].sort((a, b) => {
    const da = a[1].date || '';
    const db = b[1].date || '';
    if (da !== db) return da < db ? -1 : 1;
    return a[0] < b[0] ? -1 : 1;
  });

  let courante = 0;
  let record = 0;
  for (const [, m] of ordonnes) {
    if (m.won >= 1) {
      courante += m.won;            // la série continue
      if (courante > record) record = courante;
    } else {
      courante = 0;                 // aucun gain sur ce match -> cassée
    }
  }

  return {
    streak_courante: courante,
    streak_record: record,
    paris_gagnes_total: parisGagnes,
  };
}

// ------------------------------------------------------------
// Recalcule streak + badges pour une liste d'utilisateurs et
// persiste le résultat. À appeler après résolution des paris.
//   supabase : client Supabase (clé service)
//   userIds  : tableau d'uuid (doublons et null tolérés)
// ------------------------------------------------------------
async function mettreAJourStreakEtBadges(supabase, userIds) {
  const ids = [...new Set((userIds || []).filter(Boolean))];
  if (ids.length === 0) return;

  // 1. Charger tous les paris résolus de ces users, toutes tables.
  const parisParUser = new Map(); // user_id -> [paris]
  for (const id of ids) parisParUser.set(id, []);

  for (const src of SOURCES_PARIS) {
    let query = supabase
      .from(src.table)
      .select(`user_id, match_id, status, ${src.dateField}`)
      .in('user_id', ids)
      .in('status', ['won', 'lost']);
    if (src.deletedField) query = query.eq(src.deletedField, false);

    const { data, error } = await query;
    if (error) {
      console.error(`⚠️ gamification : lecture ${src.table} échouée :`, error.message);
      continue; // on dégrade : un user aura un profil partiel plutôt qu'une exception
    }
    for (const row of data || []) {
      const liste = parisParUser.get(row.user_id);
      if (liste) {
        liste.push({
          match_id: row.match_id,
          status: row.status,
          resolved_at: row[src.dateField],
        });
      }
    }
  }

  // 2. Pour chaque user : calculer le profil, persister, détecter les badges.
  const maintenant = new Date().toISOString();
  for (const id of ids) {
    const profil = calculerProfil(parisParUser.get(id) || []);

    // 2a. Upsert du profil de jeu.
    const { error: errUpsert } = await supabase
      .from('user_gamification')
      .upsert(
        { user_id: id, ...profil, updated_at: maintenant },
        { onConflict: 'user_id' }
      );
    if (errUpsert) {
      console.error(`⚠️ gamification : upsert profil ${id} :`, errUpsert.message);
      continue;
    }

    // 2b. Badges franchis -> insertion (ON CONFLICT DO NOTHING).
    const badgesAtteints = BADGES.filter(b =>
      b.type === 'volume' ? profil.paris_gagnes_total >= b.seuil
        : b.type === 'streak' ? profil.streak_record >= b.seuil
          : false
    );
    if (badgesAtteints.length > 0) {
      const lignes = badgesAtteints.map(b => ({
        user_id: id,
        badge_code: b.code,
        unlocked_at: maintenant,
      }));
      // ignoreDuplicates : ne réécrit pas unlocked_at d'un badge déjà obtenu.
      const { error: errBadges } = await supabase
        .from('user_badges')
        .upsert(lignes, { onConflict: 'user_id,badge_code', ignoreDuplicates: true });
      if (errBadges) {
        console.error(`⚠️ gamification : badges ${id} :`, errBadges.message);
      }
    }
  }
}

export { BADGES, mettreAJourStreakEtBadges };
