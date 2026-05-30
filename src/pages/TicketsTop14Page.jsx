import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

const API = 'https://top14-api-production.up.railway.app';

// Badge de niveau de confiance
function badgeConfiance(niveau, pct) {
  const map = {
    fort:   { emoji: '🟢', color: '#16a34a' },
    moyen:  { emoji: '🟡', color: '#eab308' },
    faible: { emoji: '⚪', color: '#9ca3af' },
  };
  const b = map[niveau] || map.faible;
  return { emoji: b.emoji, color: b.color, pct };
}

const fmtCote = (c) => (c == null ? '—' : c.toFixed(2).replace('.', ','));

export default function TicketsTop14Page() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [token, setToken] = useState(null);
  const [data, setData] = useState(null);
  const [journee, setJournee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');
  const [cacherFaible, setCacherFaible] = useState(false);
  const [misesPari, setMisesPari] = useState({});      // mise par pari simple (clé = matchId + idx)
  const [misesSysteme, setMisesSysteme] = useState({});// mise par scenario (clé = idx)

  // Token Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) setToken(session.access_token);
    });
  }, [user]);

  // Chargement initial / sur changement de journée
  useEffect(() => {
    if (!token) return;
    charger(journee);
  }, [token, journee]);

  const charger = async (j) => {
    setLoading(true);
    setErreur('');
    try {
      const url = j ? `${API}/api/admin/tickets-top14?journee=${j}` : `${API}/api/admin/tickets-top14`;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const d = await res.json();
      setData(d);
      if (!journee && d.journee) setJournee(d.journee);
    } catch (e) {
      setErreur(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1">
          <ChevronLeft className="h-6 w-6 text-gray-700" />
        </button>
        <h1 className="font-bold text-gray-900 text-lg flex-1">🎲 Tickets Top14</h1>
        <button onClick={() => charger(journee)} disabled={loading}>
          <RefreshCw className={`h-5 w-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto pb-24">

        {/* Sélecteur de journée + toggle */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex gap-2 flex-wrap mb-3">
            {(data?.journees_disponibles || []).map(j => (
              <button
                key={j}
                onClick={() => setJournee(j)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={j === journee
                  ? { background: '#1a1a1a', color: '#C9A84C', border: '1.5px solid #C9A84C' }
                  : { background: '#f0f0f0', color: '#666', border: '1.5px solid transparent' }}
              >J{j}</button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={cacherFaible}
              onChange={(e) => setCacherFaible(e.target.checked)}
              className="cursor-pointer"
            />
            Cacher les paris à confiance faible (⚪ &lt; 55 %)
          </label>
        </div>

        {/* Erreur */}
        {erreur && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            Erreur : {erreur}
          </div>
        )}

        {/* Matchs */}
        {data?.matchs?.length === 0 && !loading && (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-500 text-sm">
            Aucun match à venir pour cette journée.
          </div>
        )}

        {data?.matchs?.map(m => {
          const parisVisibles = cacherFaible
            ? m.paris.filter(p => p.niveau !== 'faible')
            : m.paris;
          if (parisVisibles.length === 0) return null;
          const date = m.date_match
            ? new Date(m.date_match).toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })
            : '';
          return (
            <div key={m.match_id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="text-sm font-bold text-gray-900">
                  {m.equipe_domicile} <span className="text-gray-400 font-normal">vs</span> {m.equipe_exterieure}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{date}</div>
                <div className="text-xs text-gray-400 mt-1">
                  Score prédit FT : <strong className="text-gray-700">{m.score_predit}</strong> · MT : {m.score_predit_mt}
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {parisVisibles.map((p, idx) => {
                  const b = badgeConfiance(p.niveau, p.confiance_pct);
                  const key = `${m.match_id}_${idx}`;
                  const mise = misesPari[key] || 0;
                  const gain = mise && p.cote ? (mise * p.cote) : 0;
                  return (
                    <div key={idx} className="px-4 py-2.5 text-sm">
                      <div className="text-[10px] text-gray-400 uppercase tracking-wide">{p.categorie}</div>
                      <div className="font-medium text-gray-800">{p.libelle}</div>
                      <div className="flex items-center justify-between mt-1.5 gap-2 flex-wrap">
                        <span style={{ color: b.color, fontSize: 11, fontWeight: 600 }}>{b.emoji} {b.pct}%</span>
                        <span className="text-xs text-gray-500">
                          cote {fmtCote(p.cote)}
                          {p.cote_source === 'estimee' && <span className="text-[9px] opacity-50 ml-1">(est.)</span>}
                        </span>
                        <div className="flex items-center gap-1 text-xs">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            placeholder="mise"
                            value={misesPari[key] || ''}
                            onChange={(e) => setMisesPari({ ...misesPari, [key]: parseFloat(e.target.value) || 0 })}
                            className="w-14 px-1.5 py-1 border border-gray-300 rounded text-xs"
                          />
                          <span className="text-green-600 font-semibold min-w-[50px] text-right">
                            → {gain.toFixed(2).replace('.', ',')} €
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Scenarios système */}
        {data?.scenarios?.length > 0 && (
          <>
            <div className="text-base font-bold text-yellow-700 mt-6">🎯 Paris système — 3 scenarios</div>
            {data.scenarios.map((sys, idx) => {
              if (!sys.possible) {
                return (
                  <div key={idx} className="bg-red-50/50 border border-red-200/60 rounded-xl p-3 text-xs text-gray-600">
                    <div className="font-bold text-gray-800 mb-1">{sys.scenario}</div>
                    ⚠️ Indisponible : {sys.raison}
                  </div>
                );
              }
              const mise = misesSysteme[idx] ?? 1;
              const total = mise * sys.combinaisons_nb;
              const gainMax = total * sys.cote_moyenne_combine;
              return (
                <div key={idx} className="rounded-xl p-4 border-2"
                  style={{ borderColor: '#C9A84C', background: 'linear-gradient(135deg, rgba(212,160,23,0.08), rgba(212,160,23,0.02))' }}>
                  <div className="flex justify-between items-baseline mb-2 flex-wrap gap-1">
                    <div className="font-bold text-yellow-700">{sys.scenario}</div>
                    <div className="text-[11px] text-gray-500">{sys.description}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 my-3 text-center text-xs">
                    <div className="bg-white/70 rounded-lg p-2">
                      <div className="text-gray-500">Combinés</div>
                      <div className="text-base font-bold text-gray-800">{sys.combinaisons_nb}</div>
                    </div>
                    <div className="bg-white/70 rounded-lg p-2">
                      <div className="text-gray-500">Proba gain</div>
                      <div className="text-base font-bold text-green-600">{Math.round(sys.proba_gain * 100)}%</div>
                    </div>
                    <div className="bg-white/70 rounded-lg p-2">
                      <div className="text-gray-500">Cote moy.</div>
                      <div className="text-base font-bold text-gray-800">{fmtCote(sys.cote_moyenne_combine)}</div>
                    </div>
                  </div>
                  <div className="text-[11px] text-gray-500 mb-1.5">Sélection ({sys.n} paris, il faut que {sys.k} passent) :</div>
                  {sys.selection.map(s => (
                    <div key={s.match_id} className="bg-white/70 rounded-lg p-2 mb-1.5 text-xs">
                      <div className="text-[10px] text-gray-500">{s.match_label}</div>
                      <div className="font-medium text-gray-800">{s.categorie} : {s.libelle}</div>
                      <div className="flex justify-between mt-1">
                        <span className="text-green-600 font-semibold">{s.confiance_pct}%</span>
                        <span className="text-gray-500">cote {fmtCote(s.cote)}</span>
                      </div>
                    </div>
                  ))}
                  <div className="mt-3 pt-3 border-t border-yellow-200/60 flex flex-wrap items-center gap-2 text-xs">
                    <label className="text-gray-600">Mise / combiné :</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={mise}
                      onChange={(e) => setMisesSysteme({ ...misesSysteme, [idx]: parseFloat(e.target.value) || 0 })}
                      className="w-16 px-1.5 py-1 border border-gray-300 rounded"
                    />
                    <span className="text-gray-500">€</span>
                    <span className="ml-1 text-gray-500">Total :</span>
                    <span className="font-bold text-gray-800">{total.toFixed(2).replace('.', ',')} €</span>
                    <span className="ml-1 text-gray-500">Gain max :</span>
                    <span className="font-bold text-green-600">{gainMax.toFixed(2).replace('.', ',')} €</span>
                  </div>
                </div>
              );
            })}
          </>
        )}

      </div>
    </div>
  );
}
