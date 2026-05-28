import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Copy, Share2, Check, Users, Gift, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const API_URL = 'https://top14-api-production.up.railway.app';

export default function InviterAmisPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState('');
  const [lien, setLien] = useState('');
  const [filleuls, setFilleuls] = useState([]);
  const [filleulsCount, setFilleulsCount] = useState(0);
  const [maxFilleuls, setMaxFilleuls] = useState(10);

  const [copie, setCopie] = useState(false);

  // ── Chargement ──
  useEffect(() => {
    let annule = false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) {
          setErreur('Vous devez être connecté');
          setLoading(false);
          return;
        }
        const res = await axios.get(`${API_URL}/api/referral/me`, {
          headers: { 'x-user-id': user.id },
          params: { _: Date.now() },
        });
        if (annule) return;
        if (!res.data?.success) {
          setErreur(res.data?.error || 'Erreur de chargement');
        } else {
          setLien(res.data.lien || '');
          setFilleuls(res.data.filleuls || []);
          setFilleulsCount(res.data.filleuls_count || 0);
          setMaxFilleuls(res.data.max_filleuls || 10);
        }
      } catch (e) {
        if (!annule) setErreur(e?.response?.data?.error || e.message);
      } finally {
        if (!annule) setLoading(false);
      }
    })();
    return () => { annule = true; };
  }, []);

  // ── Copier le lien ──
  const copier = async () => {
    if (!lien) return;
    try {
      await navigator.clipboard.writeText(lien);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      // Fallback : sélection manuelle
      const ta = document.createElement('textarea');
      ta.value = lien;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); setCopie(true); setTimeout(() => setCopie(false), 2000); }
      finally { document.body.removeChild(ta); }
    }
  };

  // ── Partage natif (Web Share API, fallback = copier) ──
  const partager = async () => {
    if (!lien) return;
    const titre = 'Rejoins-moi sur Top 14 Pronos';
    const texte = 'Je joue aux pronos rugby sur Top 14 Pronos. Inscris-toi avec mon lien, c\'est gratuit !';
    if (navigator.share) {
      try {
        await navigator.share({ title: titre, text: texte, url: lien });
      } catch {
        // Annulation utilisateur : on ne fait rien
      }
    } else {
      // Pas de Web Share API (desktop) → fallback copie
      copier();
    }
  };

  // ── Formatage date ──
  const formatDate = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return ''; }
  };

  // ─────────────────────────────────────────────────────────
  // RENDU
  // ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-rugby-gold/10 to-rugby-orange/10 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-rugby-gold to-rugby-bronze text-white p-4 shadow-md sticky top-0 z-10">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-white/10 rounded">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Inviter des amis
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">

        {/* Bandeau pédagogique */}
        <div className="bg-white rounded-xl shadow-sm border border-rugby-gold/20 p-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            <Gift className="w-5 h-5 text-rugby-gold inline mr-1.5 -mt-0.5" />
            Invite tes potes à pronostiquer avec toi. Ton lien leur offre un accès
            <strong> gratuit jusqu'au 30 septembre 2026</strong>, sans code à saisir.
          </p>
        </div>

        {/* États : chargement / erreur */}
        {loading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center text-gray-500 text-sm">
            Chargement…
          </div>
        )}

        {!loading && erreur && (
          <div className="bg-red-50 rounded-xl border border-red-200 p-4 text-sm text-red-700">
            {erreur}
          </div>
        )}

        {/* Carte : ton lien */}
        {!loading && !erreur && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">Ton lien d'invitation</h2>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3 break-all text-xs font-mono text-gray-700 select-all">
              {lien}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={copier}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-colors ${
                  copie
                    ? 'bg-green-600 text-white'
                    : 'bg-rugby-gold text-white hover:bg-rugby-bronze'
                }`}
              >
                {copie ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copie ? 'Copié !' : 'Copier'}
              </button>
              <button
                onClick={partager}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm bg-white border border-rugby-gold text-rugby-gold hover:bg-rugby-gold/5 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Partager
              </button>
            </div>
          </div>
        )}

        {/* Carte : compteur + filleuls */}
        {!loading && !erreur && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
                <Users className="w-4 h-4 text-rugby-gold" />
                Tes filleuls
              </h2>
              <span className="text-sm font-bold text-rugby-gold">
                {filleulsCount} / {maxFilleuls}
              </span>
            </div>

            {/* Barre de progression */}
            <div className="w-full bg-gray-100 rounded-full h-2 mb-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-rugby-gold to-rugby-bronze h-full transition-all"
                style={{ width: `${Math.min(100, (filleulsCount / maxFilleuls) * 100)}%` }}
              />
            </div>

            {filleulsCount === 0 ? (
              <p className="text-sm text-gray-500 italic text-center py-4">
                Personne pour l'instant. Partage ton lien pour faire venir tes premiers amis !
              </p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {filleuls.map((f, i) => (
                  <li key={i} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rugby-gold to-rugby-bronze flex items-center justify-center text-white text-xs font-bold">
                        {(f.pseudo || '?').charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-800">{f.pseudo}</span>
                    </div>
                    <span className="text-xs text-gray-500">inscrit le {formatDate(f.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}

            <p className="text-xs text-gray-400 italic mt-4 text-center">
              Limite de {maxFilleuls} filleuls jusqu'au 30 septembre 2026.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
