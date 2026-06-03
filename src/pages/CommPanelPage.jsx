import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

const API = 'https://top14-api-production.up.railway.app';

const CHAMPS = [
  { value: 'top14', label: '🏆 Top 14',    accent: '#C9A84C', bg: '#1a1a1a' },
  { value: 'prod2', label: '🥈 Pro D2',     accent: '#97C1FE', bg: '#00174D' },
  { value: 'hcup',  label: '⭐ Champ. Cup', accent: '#FFC72C', bg: '#003E7E' },
];

async function apiGet(path, token) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export default function CommPanelPage() {
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const [token, setToken]             = useState(null);
  const [champ, setChamp]             = useState('top14');
  const [journees, setJournees]       = useState([]);
  const [journee, setJournee]         = useState('');
  const [resultats, setResultats]     = useState(null);
  const [engagement, setEngagement]   = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [teaser, setTeaser]           = useState(null);
  const [usersAccess, setUsersAccess] = useState(null);
  const [loading, setLoading]         = useState(false);

  // Récupérer le token Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) setToken(session.access_token);
    });
  }, [user]);

  // Journées
  useEffect(() => {
    if (!token) return;
    setJournee(''); setResultats(null);
    apiGet(`/api/comm/journees?champ=${champ}`, token)
      .then(d => setJournees(d.journees || []))
      .catch(() => setJournees([]));
  }, [champ, token]);

  // Auto-sélectionner la première journée
  useEffect(() => {
    if (journees.length > 0) setJournee(String(journees[0].journee));
  }, [journees]);

  // Résultats
  useEffect(() => {
    if (!token || !journee) return;
    setLoading(true);
    apiGet(`/api/comm/resultats?champ=${champ}&journee=${encodeURIComponent(journee)}`, token)
      .then(d => setResultats(d))
      .catch(() => setResultats(null))
      .finally(() => setLoading(false));
  }, [journee, token]);

  // Extras (1 seule fois au montage avec token)
  useEffect(() => {
    if (!token) return;
    apiGet('/api/comm/engagement', token).then(setEngagement).catch(() => {});
    apiGet('/api/comm/leaderboard', token).then(setLeaderboard).catch(() => {});
    apiGet('/api/comm/teaser', token).then(setTeaser).catch(() => {});
    apiGet('/api/comm/users-access', token).then(setUsersAccess).catch(() => {});
  }, [token]);

  const col = CHAMPS.find(c => c.value === champ);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1">
          <ChevronLeft className="h-6 w-6 text-gray-700" />
        </button>
        <h1 className="font-bold text-gray-900 text-lg flex-1">📊 COMM Panel</h1>
        <button onClick={() => {
          if (token && journee) {
            setLoading(true);
            apiGet(`/api/comm/resultats?champ=${champ}&journee=${encodeURIComponent(journee)}`, token)
              .then(d => setResultats(d)).finally(() => setLoading(false));
          }
        }}>
          <RefreshCw className={`h-5 w-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto">

        {/* Sélecteurs */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex gap-2 mb-3 flex-wrap">
            {CHAMPS.map(ch => (
              <button key={ch.value} onClick={() => setChamp(ch.value)}
                className="px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                style={champ === ch.value
                  ? { background: ch.bg, color: ch.accent, border: `2px solid ${ch.accent}` }
                  : { background: '#f5f5f5', color: '#555', border: '2px solid transparent' }}
              >{ch.label}</button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            {journees.map(j => (
              <button key={j.journee} onClick={() => setJournee(String(j.journee))}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={String(j.journee) === journee
                  ? { background: col.bg, color: col.accent, border: `1.5px solid ${col.accent}` }
                  : { background: '#f0f0f0', color: '#666', border: '1.5px solid transparent' }}
              >{j.round && j.round !== 'Journée' ? j.round : `J${j.journee}`}</button>
            ))}
          </div>
        </div>

        {/* Résultats */}
        {resultats && <ResultatsBloc resultats={resultats} col={col} journee={journee} journees={journees} />}

        {/* Engagement */}
        {engagement && <EngagementBloc data={engagement} />}

        {/* Leaderboard */}
        {leaderboard && <LeaderboardBloc data={leaderboard} />}

        {/* Teaser */}
        {teaser && <TeaserBloc data={teaser} />}

        {/* Statut d'accès des utilisateurs */}
        {usersAccess && <UsersAccessBloc data={usersAccess} />}

      </div>
    </div>
  );
}

function ResultatsBloc({ resultats, col, journee, journees }) {
  const { matchs = [], stats = {} } = resultats;
  const j = journees.find(x => String(x.journee) === journee);
  const label = j ? (j.round && j.round !== 'Journée' ? j.round : `Journée ${j.journee}`) : `Journée ${journee}`;
  const statsLine = [
    stats.precision_pct !== null ? `🎯 ${stats.precision_pct}%` : '',
    stats.joues > 0 ? `✅ ${stats.corrects}/${stats.joues}` : '',
    stats.total_paris > 0 ? `🏦 ${stats.total_paris} paris` : '',
  ].filter(Boolean).join(' · ');

  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', border: `2px solid ${col.accent}`, background: '#111' }}>
      <div style={{ background: col.bg, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
        <div>
          <div style={{ color: col.accent, fontWeight: 700, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}>{col.label}</div>
          <div style={{ color: '#fff', fontSize: 19, fontWeight: 800, marginTop: 1 }}>{label}</div>
        </div>
        {statsLine && <div style={{ fontSize: 12, color: '#ccc', textAlign: 'right', lineHeight: 1.6 }}>{statsLine}</div>}
      </div>
      {matchs.map((m, i) => {
        const joue = m.score_reel_dom !== null && m.score_reel_ext !== null;
        const iaOk = joue && m.score_predit_dom !== null
          ? (m.score_reel_dom > m.score_reel_ext) === (m.score_predit_dom > m.score_predit_ext) : null;
        const iaIcon = iaOk === true ? '✅' : iaOk === false ? '❌' : '';
        const date = m.date_match
          ? new Date(m.date_match).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
          : '';
        return (
          <div key={i} style={{ borderBottom: '1px solid #222', padding: '8px 12px' }}>
            <div style={{ fontSize: 11, color: '#aaa', marginBottom: 5 }}>{date}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 6 }}>
              <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#F0EDE8' }}>{m.equipe_domicile}</div>
              <div style={{ textAlign: 'center', minWidth: 90, padding: '5px 8px', borderRadius: 8, background: !joue ? '' : iaOk === false ? '#2a1a1a' : '#1a2a1a' }}>
                {joue
                  ? <div style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>{m.score_reel_dom} – {m.score_reel_ext}</div>
                  : <div style={{ fontSize: 13, fontWeight: 700, color: col.accent }}>À jouer</div>}
                {m.score_predit_dom !== null && <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>IA {m.score_predit_dom}-{m.score_predit_ext} {iaIcon}</div>}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#F0EDE8' }}>{m.equipe_exterieure}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EngagementBloc({ data }) {
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h3 className="font-bold text-gray-800 mb-3">👥 Engagement communauté</h3>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
          <div className="text-2xl font-extrabold text-yellow-600">{data.users_actifs_7j}</div>
          <div className="text-xs text-gray-500 mt-1">users actifs (7j)</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
          <div className="text-2xl font-extrabold text-yellow-600">{data.paris_7j}</div>
          <div className="text-xs text-gray-500 mt-1">paris placés (7j)</div>
        </div>
      </div>

      {/* Liste des users actifs */}
      {data.users_actifs?.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-gray-400 uppercase tracking-widest mb-2">🟢 Connectés cette semaine</div>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {data.users_actifs.map((u, i) => (
              <div key={i} className="flex justify-between items-center py-1.5 px-2 rounded-lg hover:bg-gray-50">
                <div>
                  <span className="text-sm font-semibold text-gray-800">{u.pseudo}</span>
                </div>
                <span className="text-xs text-gray-400">
                  {u.derniere_activite ? new Date(u.derniere_activite).toLocaleDateString('fr-FR', { day:'numeric', month:'short' }) : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.top_matchs?.length > 0 && (
        <>
          <div className="text-xs text-gray-400 uppercase tracking-widest mb-2">🔥 Matchs les + pariés</div>
          {data.top_matchs.map((m, i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
              <span className="text-sm text-gray-700">{medals[i]} {m.label}</span>
              <span className="text-sm font-bold text-yellow-600">{m.nb} paris</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function LeaderboardBloc({ data }) {
  const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h3 className="font-bold text-gray-800 mb-3">🏆 Leaderboard saison</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-widest mb-2">🪙 Cagnotte</div>
          {data.top_cagnotte?.map((u, i) => (
            <div key={i} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
              <span className="text-sm text-gray-700">{medals[i]} {u.pseudo}</span>
              <span className="text-xs font-bold text-yellow-600">{u.credits} 🪙</span>
            </div>
          ))}
        </div>
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-widest mb-2">🎯 Précision</div>
          {data.top_taux?.map((u, i) => (
            <div key={i} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
              <span className="text-sm text-gray-700">{medals[i]} {u.pseudo}</span>
              <span className="text-xs font-bold text-green-600">{u.taux}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TeaserBloc({ data }) {
  const champCfg = {
    top14: { label: '🏆 TOP 14',     accent: '#C9A84C', bg: '#1a1a1a' },
    d2:    { label: '🥈 PRO D2',     accent: '#97C1FE', bg: '#00174D' },
    hcup:  { label: '⭐ CHAMP. CUP', accent: '#FFC72C', bg: '#003E7E' },
  };
  return (
    <div className="space-y-3">
      <h3 className="font-bold text-gray-800">🔮 Prédictions IA — Prochains matchs</h3>
      {Object.entries({ top14: data.top14, d2: data.d2, hcup: data.hcup }).map(([key, matchs]) => {
        const cfg = champCfg[key];
        if (!matchs?.length) return null;
        return (
          <div key={key} style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #333' }}>
            <div style={{ background: cfg.bg, padding: '8px 14px' }}>
              <span style={{ color: cfg.accent, fontWeight: 700, fontSize: 12, letterSpacing: 1 }}>{cfg.label}</span>
            </div>
            <div style={{ background: '#111' }}>
              {matchs.slice(0, 7).map((m, i) => {
                const date = m.date_match
                  ? new Date(m.date_match).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                  : '';
                const confVal = m.confiance_algo > 1 ? Math.round(m.confiance_algo) : Math.round((m.confiance_algo || 0) * 100);
                return (
                  <div key={i} style={{ borderBottom: '1px solid #222', padding: '8px 12px' }}>
                    <div style={{ fontSize: 10, color: '#666', marginBottom: 4 }}>{date}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 6 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#F0EDE8', textAlign: 'right' }}>{m.equipe_domicile}</div>
                      <div style={{ textAlign: 'center', minWidth: 80, background: '#1a2a1a', borderRadius: 6, padding: '4px 8px' }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: cfg.accent }}>
                          {m.score_predit_dom !== null ? `IA: ${m.score_predit_dom}-${m.score_predit_ext}` : '—'}
                        </div>
                        {confVal > 0 && <div style={{ fontSize: 10, color: '#888' }}>{confVal}% conf.</div>}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#F0EDE8' }}>{m.equipe_exterieure}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Statut d'accès des utilisateurs (vue v_users_access, parrain compris) ──
function UsersAccessBloc({ data }) {
  const users = data?.users || [];
  if (!users.length) return null;

  const statutInfo = (u) => {
    const s = u.statut_acces || '';
    if (s === 'beta_gratuit_vie') return { label: '🟢 Bêta à vie', color: '#C9A84C' };
    if (s.startsWith('actif_'))   return { label: `🔵 Fondateur · ${u.jours_restants}j`, color: '#16a34a' };
    if (s === 'acces_expire')     return { label: '🔒 Expiré', color: '#dc2626' };
    return { label: '⏸ Non démarré', color: '#9ca3af' };
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h3 className="font-bold text-gray-800 mb-3">🔐 Statut d'accès des utilisateurs ({users.length})</h3>
      <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
        {users.map((u, i) => {
          const st = statutInfo(u);
          const origine = u.invitation_code
            ? u.invitation_code
            : (u.parrain_pseudo ? `🤝 Parrainé par ${u.parrain_pseudo}` : null);
          return (
            <div key={i} className="py-2">
              <div className="flex justify-between items-center gap-2">
                <span className="text-sm font-semibold text-gray-800 truncate">{u.pseudo || '—'}</span>
                <span className="text-xs font-bold whitespace-nowrap" style={{ color: st.color }}>{st.label}</span>
              </div>
              <div className="flex justify-between items-center mt-0.5 gap-2">
                <span className="text-xs text-gray-400 truncate">{origine || ''}</span>
                <span className="text-[11px] text-gray-400 whitespace-nowrap">
                  {u.inscription_at ? new Date(u.inscription_at).toLocaleDateString('fr-FR') : ''}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
