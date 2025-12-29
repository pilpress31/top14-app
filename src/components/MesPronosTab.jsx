// ============================================
// MES PRONOS - VERSION STABLE & CORRIGÉE
// ============================================

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Coins,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import axios from 'axios';
import BettingModal from './BettingModal';
import MatchCard from './MatchCard';
import ReglementModal from './ReglementModal';
import { useLocation, useNavigate } from 'react-router-dom';

export default function MesPronosTab({ goToMesParis }) {
  const navigate = useNavigate();

  const [matchsDisponibles, setMatchsDisponibles] = useState([]);
  const [mesPronos, setMesPronos] = useState([]);
  const [userCredits, setUserCredits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showReglementModal, setShowReglementModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [expandedJournees, setExpandedJournees] = useState(new Set());

  const hasInitializedJournees = useRef(false);
  const lastScrollY = useRef(0);

  // 🔗 URL param ?match=ID
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const matchToScroll = params.get('match');

  // 🔗 refs pour scroll
  const matchRefs = useRef({});
  const registerMatchRef = (matchId) => (el) => {
    if (el) matchRefs.current[matchId] = el;
  };

  // ============================================
  // 🔥 LOAD DATA (STABILISÉ)
  // ============================================
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return;

      // Matchs
      const matchsResponse = await axios.get(
        'https://top14-api-production.up.railway.app/api/matchs/a-venir'
      );

      // Cotes
      const cotesResponse = await axios.get(
        'https://top14-api-production.up.railway.app/api/cotes/all'
      );

      const cotesMap = {};
      (cotesResponse.data?.cotes || []).forEach((c) => {
        cotesMap[c.match_id] = c;
      });

      const matchsAvecCotes = (matchsResponse.data.matchs || []).map((m) => ({
        ...m,
        match_id: m.id,
        date_match: m.date,
        cotes: cotesMap[m.id] || null,
      }));

      setMatchsDisponibles(matchsAvecCotes);

      // Déplier première journée UNE FOIS
      if (!hasInitializedJournees.current && matchsAvecCotes.length > 0) {
        const journees = [
          ...new Set(matchsAvecCotes.map((m) => m.journee)),
        ].sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));

        setExpandedJournees(new Set([journees[0]]));
        hasInitializedJournees.current = true;
      }

      // Pronos utilisateur
      const { data: pronos } = await supabase
        .from('user_pronos')
        .select('*')
        .eq('user_id', user.id)
        .eq('match_termine', false)
        .order('journee', { ascending: true });

      setMesPronos(pronos || []);

      // Crédits
      try {
        const creditsResponse = await axios.get(
          'https://top14-api-production.up.railway.app/api/user/credits',
          { headers: { 'x-user-id': user.id } }
        );
        setUserCredits(creditsResponse.data);
      } catch {
        setUserCredits({ credits: 1000, total_earned: 0 });
      }
    } catch (err) {
      console.error('Erreur chargement:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // INIT
  // ============================================
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Scroll vers match
  useEffect(() => {
    if (matchToScroll && matchRefs.current[matchToScroll]) {
      matchRefs.current[matchToScroll].scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [matchToScroll, matchsDisponibles]);

  // ============================================
  // UI LOGIC
  // ============================================
  const ouvrirModal = (match) => {
    const deja = mesPronos.find((p) => p.match_id === match.match_id);
    if (deja?.mise_ft > 0 && deja?.mise_mt > 0) {
      goToMesParis();
      return;
    }
    setSelectedMatch(match);
    setShowModal(true);
  };

  const fermerModal = () => {
    setShowModal(false);
    setSelectedMatch(null);
  };

  const toggleJournee = (journee) => {
    setExpandedJournees((prev) => {
      const set = new Set(prev);
      set.has(journee) ? set.delete(journee) : set.add(journee);
      return set;
    });
  };

  // ============================================
  // RENDER
  // ============================================
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin h-10 w-10 rounded-full border-b-4 border-rugby-gold" />
      </div>
    );
  }

  const matchsParJournee = matchsDisponibles.reduce((acc, m) => {
    acc[m.journee] ??= [];
    acc[m.journee].push(m);
    return acc;
  }, {});

  const journees = Object.keys(matchsParJournee).sort(
    (a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1))
  );

  return (
    <div className="space-y-3">
      {/* BANDEAU */}
      <div className="bg-gradient-to-r from-rugby-gold to-rugby-bronze rounded-lg p-4 shadow-lg">
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate('/ma-cagnotte')}
            className="flex items-center gap-3 bg-white/20 px-3 py-2 rounded-lg"
          >
            <Coins className="w-8 h-8 text-white" />
            <div>
              <p className="text-xs text-white">Ma cagnotte</p>
              <p className="text-3xl font-bold text-white">
                {userCredits?.credits || 0}
              </p>
            </div>
          </button>

          <div className="text-right text-white">
            <p className="text-xs opacity-80">Total gagné</p>
            <p className="text-xl font-bold flex items-center gap-1 justify-end">
              <TrendingUp className="w-4 h-4" />
              {userCredits?.total_earned || 0}
            </p>
          </div>
        </div>
      </div>

      {/* JOURNÉES */}
      {journees.map((journee) => (
        <div key={journee} className="bg-white rounded-lg border">
          <button
            onClick={() => toggleJournee(journee)}
            className="w-full flex justify-between px-3 py-2 bg-rugby-gold/10"
          >
            <span className="font-bold">{journee}</span>
            {expandedJournees.has(journee) ? (
              <ChevronUp />
            ) : (
              <ChevronDown />
            )}
          </button>

          {expandedJournees.has(journee) &&
            matchsParJournee[journee].map((match) => (
              <div
                key={match.match_id}
                ref={registerMatchRef(match.match_id)}
              >
                <MatchCard
                  match={match}
                  existingProno={mesPronos.find(
                    (p) => p.match_id === match.match_id
                  )}
                  onBetClick={ouvrirModal}
                  goToMesParis={goToMesParis}
                />
              </div>
            ))}
        </div>
      ))}

      {showModal && selectedMatch && (
        <BettingModal
          match={selectedMatch}
          existingProno={mesPronos.find(
            (p) => p.match_id === selectedMatch.match_id
          )}
          userCredits={userCredits?.credits || 0}
          onClose={fermerModal}
          onSuccess={() => {
            fermerModal();
            loadData(); // ✅ PLUS D’ERREUR
          }}
        />
      )}

      <div className="flex justify-center mt-6">
        <button
          onClick={() => setShowReglementModal(true)}
          className="bg-gradient-to-r from-rugby-gold to-rugby-bronze px-6 py-3 rounded-lg text-white flex gap-2"
        >
          <FileText />
          Règlement
        </button>
      </div>

      <ReglementModal
        isOpen={showReglementModal}
        onClose={() => setShowReglementModal(false)}
      />
    </div>
  );
}
