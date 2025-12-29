// ============================================
// MES PRONOS - VERSION PROD SAFE
// ============================================

import { useState, useEffect, useRef } from 'react';
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

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const matchToScroll = params.get('match');

  const matchRefs = useRef({});
  const registerMatchRef = (matchId) => (el) => {
    if (el) matchRefs.current[matchId] = el;
  };

  // ============================================
  // 🔥 FETCH DATA (INTERNE, NON RÉFÉRENÇABLE)
  // ============================================
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return;

      const [matchsRes, cotesRes] = await Promise.all([
        axios.get('https://top14-api-production.up.railway.app/api/matchs/a-venir'),
        axios.get('https://top14-api-production.up.railway.app/api/cotes/all'),
      ]);

      const cotesMap = {};
      (cotesRes.data?.cotes || []).forEach((c) => {
        cotesMap[c.match_id] = c;
      });

      const matchs = (matchsRes.data.matchs || []).map((m) => ({
        ...m,
        match_id: m.id,
        date_match: m.date,
        cotes: cotesMap[m.id] || null,
      }));

      setMatchsDisponibles(matchs);

      if (!hasInitializedJournees.current && matchs.length > 0) {
        const firstJournee = [...new Set(matchs.map((m) => m.journee))].sort(
          (a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1))
        )[0];
        setExpandedJournees(new Set([firstJournee]));
        hasInitializedJournees.current = true;
      }

      const { data: pronos } = await supabase
        .from('user_pronos')
        .select('*')
        .eq('user_id', user.id)
        .eq('match_termine', false);

      setMesPronos(pronos || []);

      try {
        const creditsRes = await axios.get(
          'https://top14-api-production.up.railway.app/api/user/credits',
          { headers: { 'x-user-id': user.id } }
        );
        setUserCredits(creditsRes.data);
      } catch {
        setUserCredits({ credits: 1000, total_earned: 0 });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // INIT
  useEffect(() => {
    fetchAllData();
  }, []);

  // Scroll ciblé
  useEffect(() => {
    if (matchToScroll && matchRefs.current[matchToScroll]) {
      matchRefs.current[matchToScroll].scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [matchToScroll, matchsDisponibles]);

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
      const s = new Set(prev);
      s.has(journee) ? s.delete(journee) : s.add(journee);
      return s;
    });
  };

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

  const journees = Object.keys(matchsParJournee);

  return (
    <div className="space-y-3">
      {/* Bandeau */}
      <div className="bg-gradient-to-r from-rugby-gold to-rugby-bronze p-4 rounded-lg">
        <button
          onClick={() => navigate('/ma-cagnotte')}
          className="flex items-center gap-3 text-white"
        >
          <Coins />
          <span>{userCredits?.credits ?? 0}</span>
        </button>
      </div>

      {journees.map((journee) => (
        <div key={journee} className="bg-white rounded-lg border">
          <button
            onClick={() => toggleJournee(journee)}
            className="w-full flex justify-between p-3"
          >
            {journee}
            {expandedJournees.has(journee) ? <ChevronUp /> : <ChevronDown />}
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
            fetchAllData(); // ✅ SÛR
          }}
        />
      )}

      <ReglementModal
        isOpen={showReglementModal}
        onClose={() => setShowReglementModal(false)}
      />
    </div>
  );
}
