// ============================================
// MES PRONOS - VERSION AVEC BANDEAU CLIQUABLE
// ============================================

import { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronDown, ChevronUp, Coins, TrendingUp, FileText } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import axios from 'axios';
import BettingModal from './BettingModal';
import MatchCard from './MatchCard';
import ReglementModal from './ReglementModal';
import { useLocation } from "react-router-dom";

export default function MesPronosTab({ goToMesParis }) {
  const [matchsDisponibles, setMatchsDisponibles] = useState([]);
  const [mesPronos, setMesPronos] = useState([]);
  const [userCredits, setUserCredits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showReglementModal, setShowReglementModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [expandedJournees, setExpandedJournees] = useState(new Set());
  const [headerVisible, setHeaderVisible] = useState(true);

  const lastScrollY = useRef(0);

  // 🔥 Lecture du paramètre ?match=xxxx dans l’URL
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const matchToScroll = params.get('match');

  // 🔥 Refs pour scroller vers un match précis
  const matchRefs = useRef({});
  const registerMatchRef = (matchId) => (el) => {
    if (el) matchRefs.current[matchId] = el;
  };

  // 🔥 Chargement initial des données
  useEffect(() => {
    loadData();
  }, []);

  // 🔥 Scroll automatique vers le match ciblé
  useEffect(() => {
    if (matchToScroll && matchRefs.current[matchToScroll]) {
      matchRefs.current[matchToScroll].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [matchToScroll, mesPronos]);

  // 🔥 Gestion du header sticky
  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      const threshold = 5;

      if (current < 10) {
        setHeaderVisible(true);
      } else if (current - lastScrollY.current > threshold) {
        setHeaderVisible(false);
      } else if (lastScrollY.current - current > threshold) {
        setHeaderVisible(true);
      }

      lastScrollY.current = current;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 🔥 Ouvrir le modal de pari
  const ouvrirModal = (match) => {
    const dejaPronos = mesPronos.find(p => p.match_id === match.match_id);
    const hasFT = dejaPronos?.mise_ft > 0;
    const hasMT = dejaPronos?.mise_mt > 0;

    if (hasFT && hasMT) {
      goToMesParis();
      return;
    }

    setSelectedMatch(match);
    setShowModal(true);
  };

  
  // 🔥 Chargement des données
  const loadData = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const matchsResponse = await axios.get('https://top14-api-production.up.railway.app/api/matchs/a-venir');
      const cotesResponse = await axios.get('https://top14-api-production.up.railway.app/api/cotes/all');
      
      const cotesMap = {};
      const cotesArray = Array.isArray(cotesResponse.data) 
        ? cotesResponse.data 
        : (cotesResponse.data?.cotes || []);
      
      cotesArray.forEach(cote => {
        cotesMap[cote.match_id] = {
          cote_domicile: cote.cote_domicile,
          cote_exterieur: cote.cote_exterieur,
          cote_nul: cote.cote_nul,
          proba_domicile: cote.proba_domicile,
          proba_exterieur: cote.proba_exterieur,
          score_predit_dom: cote.score_predit_dom,
          score_predit_ext: cote.score_predit_ext,
          cote_mt_domicile: cote.cote_mt_domicile,
          cote_mt_exterieur: cote.cote_mt_exterieur,
          cote_mt_nul: cote.cote_mt_nul,
          proba_mt_domicile: cote.proba_mt_domicile,
          proba_mt_exterieur: cote.proba_mt_exterieur,
          score_predit_mt_dom: cote.score_predit_mt_dom,
          score_predit_mt_ext: cote.score_predit_mt_ext,
          match_start_time: cote.match_start_time,
          halftime_start_time: cote.halftime_start_time,
          halftime_duration: cote.halftime_duration
        };
      });

      const matchsAvecCotes = (matchsResponse.data.matchs || []).map(match => ({
        ...match,
        match_id: match.id,
        date_match: match.date,
        cotes: cotesMap[match.id] || null
      }));

      setMatchsDisponibles(matchsAvecCotes);

      if (matchsAvecCotes.length > 0 && expandedJournees.size === 0) {
        const matchsParJournee = matchsAvecCotes.reduce((acc, match) => {
          if (!acc[match.journee]) acc[match.journee] = [];
          acc[match.journee].push(match);
          return acc;
        }, {});
        
        const journees = Object.keys(matchsParJournee).sort((a, b) => {
          const numA = parseInt(a.replace('J', ''));
          const numB = parseInt(b.replace('J', ''));
          return numA - numB;
        });
        
        if (journees.length > 0) {
          setExpandedJournees(new Set([journees[0]]));
        }
      }

      const { data: pronos, error } = await supabase
        .from('user_pronos')
        .select('*')
        .eq('user_id', user.id)
        .eq('match_termine', false)
        .order('journee', { ascending: true });

      if (error) throw error;
      setMesPronos(pronos || []);

      try {
        const creditsResponse = await axios.get('https://top14-api-production.up.railway.app/api/user/credits', {
          headers: { 'x-user-id': user.id }
        });
        setUserCredits(creditsResponse.data);
      } catch (creditsError) {
        console.log('Crédits non disponibles:', creditsError.message);
        setUserCredits({ credits: 1000, total_earned: 0 });
      }

    } catch (error) {
      console.error('Erreur chargement data:', error);
    } finally {
      setLoading(false);
    }
  };


  
  

  const toggleJournee = (journee) => {
    setExpandedJournees(prev => {
      const newSet = new Set(prev);
      if (newSet.has(journee)) {
        newSet.delete(journee);
      } else {
        newSet.add(journee);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-rugby-gold"></div>
      </div>
    );
  }

  const matchsParJournee = matchsDisponibles.reduce((acc, match) => {
    if (!acc[match.journee]) acc[match.journee] = [];
    acc[match.journee].push(match);
    return acc;
  }, {});

  const journees = Object.keys(matchsParJournee).sort((a, b) => {
    const numA = parseInt(a.replace('J', ''));
    const numB = parseInt(b.replace('J', ''));
    return numA - numB;
  });

  return (
    <div className="space-y-3">
      
      {/* ✅ BANDEAU AVEC ICÔNE CLIQUABLE */}
      <div className="bg-gradient-to-r from-rugby-gold to-rugby-bronze rounded-lg p-4 shadow-lg">
        <div className="flex items-center justify-between">
          {/* ✅ ZONE CLIQUABLE VERS MA CAGNOTTE */}
          <button
            onClick={() => window.location.href = '/ma-cagnotte'}
            className="flex items-center gap-3 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-colors backdrop-blur-sm"
          >
            <Coins className="w-8 h-8 text-white" />
            <div>
              <p className="text-white text-xs font-medium">Ma cagnotte</p>
              <p className="text-white text-3xl font-bold">{userCredits?.credits || 0}</p>
            </div>
          </button>


          <div className="text-right">
            <p className="text-white/80 text-xs">Total gagné</p>
            <p className="text-white text-xl font-bold flex items-center gap-1 justify-end">
              <TrendingUp className="w-4 h-4" />
              {userCredits?.total_earned || 0}
            </p>
          </div>
        </div>
      </div>

      

      {/* Liste des journées */}
      {journees.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center border border-rugby-gray">
          <p className="text-gray-500">Aucun match à venir</p>
        </div>
      ) : (
        <div className="space-y-2">
          {journees.map(journee => {
            const isExpanded = expandedJournees.has(journee);
            const matchsJournee = matchsParJournee[journee];
            
            return (
              <div key={journee} className="bg-white rounded-lg shadow-sm border border-rugby-gray overflow-hidden">
                
                <button
                  onClick={() => toggleJournee(journee)}
                  className="w-full bg-rugby-gold/10 px-3 py-2 border-b border-rugby-gray hover:bg-rugby-gold/20 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-rugby-gold" />
                      <span className="font-bold text-rugby-black text-sm">{journee}</span>
                      <span className="text-xs text-gray-500">({matchsJournee.length} matchs)</span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-rugby-gold" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-rugby-gold" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="divide-y divide-rugby-gray">
                    {matchsJournee.map(match => {
                      const existingProno = mesPronos.find(p => p.match_id === match.match_id);
                      
                      return (
                        <div ref={registerMatchRef(match.match_id)}>
                          <MatchCard
                            key={match.match_id}
                            match={match}
                            existingProno={existingProno}
                            onBetClick={ouvrirModal}
                            goToMesParis={goToMesParis}
                          />
                        </div>

                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && selectedMatch && (
        <BettingModal 
          match={selectedMatch}
          existingProno={mesPronos.find(p => p.match_id === selectedMatch.match_id)}
          userCredits={userCredits?.credits || 0}
          onClose={fermerModal}
          onSuccess={() => {
            fermerModal();
            loadData();
          }}
        />
      )}


      {/* Bouton Règlement en bas de page */}
      <div className="flex justify-center mt-6 mb-4">
        <button
          onClick={() => setShowReglementModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-rugby-gold to-rugby-bronze text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all"
        >
          <FileText className="w-5 h-5" />
          <span className="font-semibold">Consulter le règlement</span>
        </button>
      </div>

            <ReglementModal 
        isOpen={showReglementModal}
        onClose={() => setShowReglementModal(false)}
      />
    </div>
  );
}
