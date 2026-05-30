// ============================================
// ONGLET « MES LIGUES » — Ligues privées
// Liste des ligues du joueur, création, adhésion par code/lien,
// et classement par points d'une ligue sélectionnée.
// ============================================
import { useState, useEffect, useCallback } from 'react';
import {
  Shield, Plus, LogIn, Trophy, Users, Share2, Copy, Trash2,
  UserMinus, Pencil, ArrowLeft, X, Loader2, UserPlus, Mail, Check,
  Bell, Clock,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import axios from 'axios';
import { useRealtimeSync } from '../hooks/useRealtimeSync';

const API_BASE = 'https://top14-api-production.up.railway.app';
const MAX_LEAGUES = 5;

interface League {
  id: string;
  nom: string;
  code: string;
  created_by: string;
  created_at: string;
  nb_membres: number;
  est_createur: boolean;
}

interface LigneClassement {
  rang: number;
  user_id: string;
  pseudo: string;
  avatar?: string | null;
  points: number;
  total_pronos: number;
  taux_reussite: number;
}

interface InvitationRecue {
  id: string;
  league_id: string;
  league_nom: string;
  invited_by_pseudo: string;
  created_at: string;
}

interface InvitationEmise {
  id: string;
  pseudo: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  responded_at: string | null;
  last_reminder_at: string | null;
  peut_rappeler: boolean;
}

interface Props {
  codeInvitation?: string | null;   // code transmis par un lien d'invitation
  onCodeConsomme?: () => void;       // appelé une fois le code traité (nettoie l'URL)
  onInvitationsChange?: () => void;  // notifie le parent (pastille de l'onglet)
}

export default function MesLiguesTab({ codeInvitation, onCodeConsomme, onInvitationsChange }: Props) {
  const [userId, setUserId] = useState<string | null>(null);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ texte: string; type: 'ok' | 'err' } | null>(null);
  const [busy, setBusy] = useState(false);

  // Formulaires
  const [nomCreation, setNomCreation] = useState('');
  const [codeAdhesion, setCodeAdhesion] = useState('');
  const [formOuvert, setFormOuvert] = useState<'creer' | 'rejoindre' | null>(null);

  // Vue classement d'une ligue
  const [ligueActive, setLigueActive] = useState<League | null>(null);
  const [classement, setClassement] = useState<LigneClassement[]>([]);
  const [classementLoading, setClassementLoading] = useState(false);

  // Édition du nom (créateur)
  const [editionNom, setEditionNom] = useState<string | null>(null);

  // Invitations reçues
  const [invitations, setInvitations] = useState<InvitationRecue[]>([]);

  // Inviter un joueur par pseudo (créateur) : id de la ligue en cours d'invitation
  const [inviteLigueId, setInviteLigueId] = useState<string | null>(null);
  const [pseudoInvite, setPseudoInvite] = useState('');

  // Invitations émises (vues par le créateur dans le détail d'une ligue)
  const [invitationsEmises, setInvitationsEmises] = useState<InvitationEmise[]>([]);
  const [invitationsEmisesLoading, setInvitationsEmisesLoading] = useState(false);
  const [rappelBusy, setRappelBusy] = useState<string | null>(null);  // id de l'invitation en cours de rappel

  useRealtimeSync([
    { table: 'league_members', onUpdate: () => chargerLigues() },
    { table: 'private_leagues', onUpdate: () => chargerLigues() },
    { table: 'league_invitations', onUpdate: () => chargerInvitations() },
  ]);

  // ─── Chargement des ligues du joueur ───
  const chargerLigues = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const uid = user?.id || null;
      setUserId(uid);
      if (!uid) { setLeagues([]); return; }

      const res = await axios.get(`${API_BASE}/api/leagues/mine`, {
        headers: { 'x-user-id': uid },
        params: { _: Date.now() },
      });
      setLeagues(res.data || []);
    } catch (e) {
      console.error('Erreur chargement ligues:', e);
      setLeagues([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { chargerLigues(); }, [chargerLigues]);

  // ─── Chargement des invitations reçues ───
  const chargerInvitations = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) { setInvitations([]); return; }
      const res = await axios.get(`${API_BASE}/api/leagues/invitations`, {
        headers: { 'x-user-id': user.id },
        params: { _: Date.now() },
      });
      setInvitations(res.data || []);
    } catch (e) {
      console.error('Erreur chargement invitations:', e);
      setInvitations([]);
    } finally {
      onInvitationsChange?.();
    }
  }, [onInvitationsChange]);

  useEffect(() => { chargerInvitations(); }, [chargerInvitations]);

  // ─── Accepter une invitation ───
  const accepterInvitation = async (inv: InvitationRecue) => {
    if (busy || !userId) return;
    setBusy(true);
    try {
      await axios.post(`${API_BASE}/api/leagues/invitations/${inv.id}/accept`, {},
        { headers: { 'x-user-id': userId } });
      afficherMessage(`Vous avez rejoint « ${inv.league_nom} » !`, 'ok');
      await chargerInvitations();
      await chargerLigues();
    } catch (e: any) {
      afficherMessage(e?.response?.data?.error || 'Action impossible', 'err');
    } finally {
      setBusy(false);
    }
  };

  // ─── Refuser une invitation ───
  const refuserInvitation = async (inv: InvitationRecue) => {
    if (busy || !userId) return;
    setBusy(true);
    try {
      await axios.post(`${API_BASE}/api/leagues/invitations/${inv.id}/decline`, {},
        { headers: { 'x-user-id': userId } });
      afficherMessage('Invitation refusée', 'ok');
      await chargerInvitations();
    } catch (e: any) {
      afficherMessage(e?.response?.data?.error || 'Action impossible', 'err');
    } finally {
      setBusy(false);
    }
  };

  // ─── Inviter un joueur par pseudo (créateur) ───
  const inviterJoueur = async (leagueId: string) => {
    if (busy || !userId) return;
    const pseudo = pseudoInvite.trim();
    if (pseudo.length < 3) { afficherMessage('Pseudo invalide', 'err'); return; }
    setBusy(true);
    try {
      const res = await axios.post(`${API_BASE}/api/leagues/${leagueId}/invite`,
        { pseudo }, { headers: { 'x-user-id': userId } });
      setPseudoInvite('');
      setInviteLigueId(null);
      afficherMessage(`Invitation envoyée à ${res.data?.invited_pseudo || pseudo}`, 'ok');
      // Si on est dans le détail d'une ligue (créateur), rafraîchir la liste des invitations émises
      if (ligueActive?.id === leagueId) {
        await chargerInvitationsEmises(leagueId);
      }
    } catch (e: any) {
      afficherMessage(e?.response?.data?.error || 'Invitation impossible', 'err');
    } finally {
      setBusy(false);
    }
  };

  // ─── Chargement des invitations émises (créateur uniquement) ───
  const chargerInvitationsEmises = async (leagueId: string) => {
    if (!userId) return;
    setInvitationsEmisesLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/leagues/${leagueId}/invitations-emises`, {
        headers: { 'x-user-id': userId },
      });
      setInvitationsEmises(res.data || []);
    } catch (e) {
      console.error('Erreur chargement invitations émises:', e);
      setInvitationsEmises([]);
    } finally {
      setInvitationsEmisesLoading(false);
    }
  };

  // ─── Renvoyer un push de rappel sur une invitation en attente ───
  const rappelerInvitation = async (invId: string, leagueId: string) => {
    if (rappelBusy || !userId) return;
    setRappelBusy(invId);
    try {
      await axios.post(`${API_BASE}/api/leagues/invitations/${invId}/remind`, {},
        { headers: { 'x-user-id': userId } });
      afficherMessage('Rappel envoyé', 'ok');
      await chargerInvitationsEmises(leagueId);
    } catch (e: any) {
      afficherMessage(e?.response?.data?.error || 'Rappel impossible', 'err');
    } finally {
      setRappelBusy(null);
    }
  };

  // ─── Code reçu par lien d'invitation : pré-remplit « rejoindre » ───
  useEffect(() => {
    if (codeInvitation) {
      setCodeAdhesion(codeInvitation.toUpperCase());
      setFormOuvert('rejoindre');
      onCodeConsomme?.();
    }
  }, [codeInvitation, onCodeConsomme]);

  const afficherMessage = (texte: string, type: 'ok' | 'err') => {
    setMessage({ texte, type });
    setTimeout(() => setMessage(null), 4000);
  };

  // ─── Créer une ligue ───
  const creerLigue = async () => {
    if (busy || !userId) return;
    const nom = nomCreation.trim();
    if (nom.length < 3) { afficherMessage('Nom trop court (3 caractères min.)', 'err'); return; }
    setBusy(true);
    try {
      await axios.post(`${API_BASE}/api/leagues`, { nom },
        { headers: { 'x-user-id': userId } });
      setNomCreation('');
      setFormOuvert(null);
      afficherMessage('Ligue créée !', 'ok');
      await chargerLigues();
    } catch (e: any) {
      afficherMessage(e?.response?.data?.error || 'Création impossible', 'err');
    } finally {
      setBusy(false);
    }
  };

  // ─── Rejoindre une ligue par code ───
  const rejoindreLigue = async () => {
    if (busy || !userId) return;
    const code = codeAdhesion.trim().toUpperCase();
    if (code.length < 4) { afficherMessage('Code invalide', 'err'); return; }
    setBusy(true);
    try {
      const res = await axios.post(`${API_BASE}/api/leagues/join`, { code },
        { headers: { 'x-user-id': userId } });
      setCodeAdhesion('');
      setFormOuvert(null);
      afficherMessage(`Vous avez rejoint « ${res.data?.league?.nom || 'la ligue'} » !`, 'ok');
      await chargerLigues();
    } catch (e: any) {
      afficherMessage(e?.response?.data?.error || 'Adhésion impossible', 'err');
    } finally {
      setBusy(false);
    }
  };

  // ─── Quitter une ligue ───
  const quitterLigue = async (league: League) => {
    if (busy || !userId) return;
    if (!window.confirm(`Quitter la ligue « ${league.nom} » ?`)) return;
    setBusy(true);
    try {
      await axios.post(`${API_BASE}/api/leagues/${league.id}/leave`, {},
        { headers: { 'x-user-id': userId } });
      afficherMessage('Ligue quittée', 'ok');
      await chargerLigues();
    } catch (e: any) {
      afficherMessage(e?.response?.data?.error || 'Action impossible', 'err');
    } finally {
      setBusy(false);
    }
  };

  // ─── Supprimer une ligue (créateur) ───
  const supprimerLigue = async (league: League) => {
    if (busy || !userId) return;
    if (!window.confirm(`Supprimer définitivement « ${league.nom} » ? Cette action est irréversible.`)) return;
    setBusy(true);
    try {
      await axios.delete(`${API_BASE}/api/leagues/${league.id}`,
        { headers: { 'x-user-id': userId } });
      afficherMessage('Ligue supprimée', 'ok');
      await chargerLigues();
    } catch (e: any) {
      afficherMessage(e?.response?.data?.error || 'Suppression impossible', 'err');
    } finally {
      setBusy(false);
    }
  };

  // ─── Renommer une ligue (créateur) ───
  const renommerLigue = async (league: League) => {
    if (busy || !userId || editionNom === null) return;
    const nom = editionNom.trim();
    if (nom.length < 3) { afficherMessage('Nom trop court', 'err'); return; }
    setBusy(true);
    try {
      await axios.patch(`${API_BASE}/api/leagues/${league.id}`, { nom },
        { headers: { 'x-user-id': userId } });
      setEditionNom(null);
      afficherMessage('Ligue renommée', 'ok');
      await chargerLigues();
    } catch (e: any) {
      afficherMessage(e?.response?.data?.error || 'Renommage impossible', 'err');
    } finally {
      setBusy(false);
    }
  };

  // ─── Ouvrir le classement d'une ligue ───
  const ouvrirClassement = async (league: League) => {
    if (!userId) return;
    setLigueActive(league);
    setClassementLoading(true);
    setClassement([]);
    setInvitationsEmises([]);
    try {
      const res = await axios.get(`${API_BASE}/api/leagues/${league.id}/classement`, {
        headers: { 'x-user-id': userId },
        params: { _: Date.now() },
      });
      setClassement(res.data || []);
    } catch (e) {
      console.error('Erreur classement ligue:', e);
    } finally {
      setClassementLoading(false);
    }
    // Charger les invitations émises seulement si l'utilisateur est créateur
    if (league.est_createur) {
      chargerInvitationsEmises(league.id);
    }
  };

  // ─── Partager le code / lien d'une ligue ───
  const partagerLigue = async (league: League) => {
    const lien = `https://app.top14pronos.fr/classement?ligue=${league.code}`;
    const texte = `Rejoins ma ligue « ${league.nom} » sur Top14 Pronos ! Code : ${league.code}\n${lien}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `Ligue ${league.nom}`, text: texte });
      } else {
        await navigator.clipboard.writeText(texte);
        afficherMessage('Invitation copiée dans le presse-papier', 'ok');
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        afficherMessage('Partage impossible', 'err');
      }
    }
  };

  const copierCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      afficherMessage('Code copié', 'ok');
    } catch {
      afficherMessage('Copie impossible', 'err');
    }
  };

  // ════════════════════════════════════════════════
  // RENDU
  // ════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-rugby-gold"></div>
      </div>
    );
  }

  // ─── Vue : classement d'une ligue ───
  if (ligueActive) {
    return (
      <div className="pb-24 space-y-4">
        <button
          onClick={() => setLigueActive(null)}
          className="flex items-center gap-2 text-sm font-semibold text-rugby-gold hover:text-rugby-bronze transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Mes ligues
        </button>

        <div className="bg-gradient-to-r from-rugby-gold/15 to-rugby-bronze/15 rounded-lg p-4 border border-rugby-gold/30">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-rugby-gold" />
            <h2 className="font-bold text-gray-800">{ligueActive.nom}</h2>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Classement par points · saison en cours
          </p>
        </div>

        {message && (
          <div className={`text-sm rounded-lg p-3 ${
            message.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.texte}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {classementLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-rugby-gold" />
            </div>
          ) : classement.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              Aucun classement disponible
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {classement.map((l) => (
                <div
                  key={l.user_id}
                  className={`flex items-center gap-3 p-4 ${
                    l.user_id === userId ? 'bg-rugby-gold/10 border-l-4 border-rugby-gold' : ''
                  }`}
                >
                  <div className="w-8 text-center font-bold text-rugby-bronze">
                    {l.rang === 1 ? '🥇' : l.rang === 2 ? '🥈' : l.rang === 3 ? '🥉' : l.rang}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rugby-gold to-rugby-bronze flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
                    {l.avatar
                      ? <img src={l.avatar} alt={l.pseudo} className="w-full h-full object-cover" />
                      : <span>{l.pseudo.charAt(0).toUpperCase()}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${
                      l.user_id === userId ? 'text-rugby-gold' : 'text-gray-800'
                    }`}>
                      {l.pseudo}
                      {l.user_id === userId && (
                        <span className="ml-2 text-xs bg-rugby-gold text-white px-2 py-0.5 rounded-full">
                          Vous
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {l.total_pronos} prono{l.total_pronos > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-rugby-gold">{l.points}</p>
                    <p className="text-xs text-gray-500">pts</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Invitations émises (créateur uniquement) ─── */}
        {ligueActive.est_createur && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <Mail className="w-4 h-4 text-rugby-gold" />
              <span className="text-sm font-bold text-gray-800">
                Invitations émises
              </span>
              {invitationsEmises.length > 0 && (
                <span className="ml-auto text-xs text-gray-500">
                  {invitationsEmises.length} au total
                </span>
              )}
            </div>

            {invitationsEmisesLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-rugby-gold" />
              </div>
            ) : invitationsEmises.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">
                Aucune invitation envoyée pour cette ligue.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {invitationsEmises.map((inv) => {
                  const isPending  = inv.status === 'pending';
                  const isAccepted = inv.status === 'accepted';
                  const isDeclined = inv.status === 'declined';
                  const fmtDate = (iso: string | null) => {
                    if (!iso) return '';
                    try {
                      return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                    } catch { return ''; }
                  };
                  return (
                    <div key={inv.id} className="flex items-center gap-3 p-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rugby-gold to-rugby-bronze flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {(inv.pseudo || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{inv.pseudo}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {isPending && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                              <Clock className="w-3 h-3" />
                              En attente
                            </span>
                          )}
                          {isAccepted && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                              <Check className="w-3 h-3" />
                              Acceptée
                            </span>
                          )}
                          {isDeclined && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-700 bg-red-50 px-1.5 py-0.5 rounded">
                              <X className="w-3 h-3" />
                              Refusée
                            </span>
                          )}
                          <span className="text-[11px] text-gray-500">
                            {isPending
                              ? `envoyée le ${fmtDate(inv.created_at)}`
                              : `${fmtDate(inv.responded_at)}`}
                          </span>
                        </div>
                      </div>
                      {isPending && (
                        <button
                          onClick={() => rappelerInvitation(inv.id, ligueActive.id)}
                          disabled={!inv.peut_rappeler || rappelBusy === inv.id}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-semibold transition-colors flex-shrink-0 ${
                            inv.peut_rappeler && rappelBusy !== inv.id
                              ? 'bg-rugby-gold text-white hover:bg-rugby-bronze'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                          title={!inv.peut_rappeler ? 'Un rappel a déjà été envoyé il y a moins de 24h' : 'Renvoyer un rappel push'}
                        >
                          {rappelBusy === inv.id
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <Bell className="w-3 h-3" />}
                          Rappeler
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ─── Vue : liste des ligues ───
  return (
    <div className="pb-24 space-y-4">
      {/* Message flash */}
      {message && (
        <div className={`text-sm rounded-lg p-3 ${
          message.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.texte}
        </div>
      )}

      {/* Invitations reçues */}
      {invitations.length > 0 && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-blue-200 flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-700" />
            <span className="text-sm font-bold text-blue-900">
              Invitation{invitations.length > 1 ? 's' : ''} en attente
            </span>
          </div>
          <div className="divide-y divide-blue-100">
            {invitations.map((inv) => (
              <div key={inv.id} className="p-3 flex items-center gap-3">
                <Shield className="w-5 h-5 text-rugby-gold flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{inv.league_nom}</p>
                  <p className="text-xs text-gray-500">Invité par {inv.invited_by_pseudo}</p>
                </div>
                <button
                  onClick={() => accepterInvitation(inv)}
                  disabled={busy}
                  className="flex items-center gap-1 text-xs font-semibold bg-green-600 text-white px-3 py-1.5 rounded-full hover:bg-green-700 transition-colors disabled:opacity-60"
                >
                  <Check className="w-3.5 h-3.5" />
                  Accepter
                </button>
                <button
                  onClick={() => refuserInvitation(inv)}
                  disabled={busy}
                  className="flex items-center gap-1 text-xs font-medium border border-gray-300 text-gray-600 px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-60"
                >
                  <X className="w-3.5 h-3.5" />
                  Refuser
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions : créer / rejoindre */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setFormOuvert(formOuvert === 'creer' ? null : 'creer')}
          className="flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm bg-rugby-gold text-white hover:bg-rugby-bronze transition-colors"
        >
          <Plus className="w-4 h-4" />
          Créer une ligue
        </button>
        <button
          onClick={() => setFormOuvert(formOuvert === 'rejoindre' ? null : 'rejoindre')}
          className="flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm border border-rugby-gold text-rugby-gold hover:bg-rugby-gold/5 transition-colors"
        >
          <LogIn className="w-4 h-4" />
          Rejoindre
        </button>
      </div>

      {/* Formulaire création */}
      {formOuvert === 'creer' && (
        <div className="bg-white rounded-lg shadow-sm p-4 border border-rugby-gray space-y-3">
          <p className="text-sm font-semibold text-gray-700">Nouvelle ligue</p>
          <input
            type="text"
            value={nomCreation}
            onChange={(e) => setNomCreation(e.target.value)}
            placeholder="Nom de la ligue"
            maxLength={40}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rugby-gold"
          />
          <button
            onClick={creerLigue}
            disabled={busy}
            className="w-full bg-rugby-gold text-white font-semibold py-2 rounded-lg text-sm hover:bg-rugby-bronze transition-colors disabled:opacity-60"
          >
            {busy ? 'Création…' : 'Créer'}
          </button>
        </div>
      )}

      {/* Formulaire adhésion */}
      {formOuvert === 'rejoindre' && (
        <div className="bg-white rounded-lg shadow-sm p-4 border border-rugby-gray space-y-3">
          <p className="text-sm font-semibold text-gray-700">Rejoindre avec un code</p>
          <input
            type="text"
            value={codeAdhesion}
            onChange={(e) => setCodeAdhesion(e.target.value.toUpperCase())}
            placeholder="Code à 6 caractères"
            maxLength={6}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-rugby-gold"
          />
          <button
            onClick={rejoindreLigue}
            disabled={busy}
            className="w-full bg-rugby-gold text-white font-semibold py-2 rounded-lg text-sm hover:bg-rugby-bronze transition-colors disabled:opacity-60"
          >
            {busy ? 'Adhésion…' : 'Rejoindre'}
          </button>
        </div>
      )}

      {/* Compteur de ligues */}
      <p className="text-xs text-gray-500 text-center">
        {leagues.length} / {MAX_LEAGUES} ligues
      </p>

      {/* Liste des ligues */}
      {leagues.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center border border-rugby-gray">
          <Shield className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            Vous n'êtes dans aucune ligue. Créez-en une ou rejoignez celle d'un ami !
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {leagues.map((league) => (
            <div key={league.id} className="bg-white rounded-lg shadow-sm border border-rugby-gray overflow-hidden">
              <div className="p-4">
                {/* Nom : affichage ou édition */}
                {editionNom !== null && league.est_createur && editionNom !== '__autre__' ? (
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={editionNom}
                      onChange={(e) => setEditionNom(e.target.value)}
                      maxLength={40}
                      className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm"
                    />
                    <button
                      onClick={() => renommerLigue(league)}
                      className="text-rugby-gold text-sm font-semibold"
                    >
                      OK
                    </button>
                    <button onClick={() => setEditionNom(null)} className="text-gray-400">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-rugby-gold flex-shrink-0" />
                    <h3 className="font-bold text-gray-800 truncate">{league.nom}</h3>
                    {league.est_createur && (
                      <span className="text-[10px] bg-rugby-gold/15 text-rugby-bronze px-2 py-0.5 rounded-full">
                        Créateur
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {league.nb_membres} membre{league.nb_membres > 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    {league.code}
                    <button onClick={() => copierCode(league.code)} title="Copier le code">
                      <Copy className="w-3.5 h-3.5 text-gray-400 hover:text-rugby-gold" />
                    </button>
                  </span>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => ouvrirClassement(league)}
                    className="flex items-center gap-1.5 text-xs font-semibold bg-rugby-gold text-white px-3 py-1.5 rounded-full hover:bg-rugby-bronze transition-colors"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    Classement
                  </button>
                  <button
                    onClick={() => partagerLigue(league)}
                    className="flex items-center gap-1.5 text-xs font-medium border border-rugby-gold text-rugby-gold px-3 py-1.5 rounded-full hover:bg-rugby-gold/5 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Partager le lien
                  </button>
                  {league.est_createur && (
                    <button
                      onClick={() => {
                        setPseudoInvite('');
                        setInviteLigueId(inviteLigueId === league.id ? null : league.id);
                      }}
                      className="flex items-center gap-1.5 text-xs font-medium border border-rugby-gold text-rugby-gold px-3 py-1.5 rounded-full hover:bg-rugby-gold/5 transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Inviter un joueur
                    </button>
                  )}
                  {league.est_createur ? (
                    <>
                      <button
                        onClick={() => setEditionNom(league.nom)}
                        className="flex items-center gap-1.5 text-xs font-medium border border-gray-300 text-gray-600 px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Renommer
                      </button>
                      <button
                        onClick={() => supprimerLigue(league)}
                        className="flex items-center gap-1.5 text-xs font-medium border border-red-300 text-red-600 px-3 py-1.5 rounded-full hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Supprimer
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => quitterLigue(league)}
                      className="flex items-center gap-1.5 text-xs font-medium border border-gray-300 text-gray-600 px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                      Quitter
                    </button>
                  )}
                </div>

                {/* Formulaire : inviter un joueur par pseudo */}
                {league.est_createur && inviteLigueId === league.id && (
                  <div className="mt-3 bg-rugby-gold/5 rounded-lg p-3 border border-rugby-gold/30">
                    <p className="text-xs font-semibold text-gray-700 mb-2">
                      Inviter un joueur par son pseudo
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={pseudoInvite}
                        onChange={(e) => setPseudoInvite(e.target.value)}
                        placeholder="Pseudo exact"
                        maxLength={20}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rugby-gold"
                      />
                      <button
                        onClick={() => inviterJoueur(league.id)}
                        disabled={busy}
                        className="bg-rugby-gold text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-rugby-bronze transition-colors disabled:opacity-60"
                      >
                        {busy ? '…' : 'Inviter'}
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1.5">
                      Le joueur recevra une invitation à accepter.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
