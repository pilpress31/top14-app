import { useState, useEffect } from "react";
import { Search, Coins, Award, TrendingUp, Trophy, HelpCircle, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import axios from 'axios';
import { getCurrentSeason } from '../utils/season';

interface UserRanking {
  rang: number;
  user_id: string;
  pseudo: string;
  avatar?: string;
  jetons?: number;
  total_gagne?: number;
  total_mise?: number;
  benefice_net?: number;
  points?: number;
  matchsPronostiques?: number;
  tauxReussite?: number;
}

export default function ClassementCommunauteTab() {
  const [users, setUsers] = useState<UserRanking[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [classementType, setClassementType] = useState<'jetons' | 'points'>('jetons');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [showReglementPoints, setShowReglementPoints] = useState(false);

  useEffect(() => {
    loadCurrentUser();
    loadClassement();
  }, [classementType]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(users.filter(u => u.pseudo.toLowerCase().includes(query)));
    }
  }, [searchQuery, users]);

  async function loadCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.error('Erreur chargement user:', error);
    }
  }

  async function loadClassement() {
    setLoading(true);
    try {
      if (classementType === 'jetons') {
        await loadClassementJetons();
      } else {
        await loadClassementPoints();
      }
    } catch (error) {
      console.error('Erreur chargement classement:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadClassementJetons() {
    try {
      const response = await axios.get('https://top14-api-production.up.railway.app/api/classement/jetons?limit=100');
      const data = response.data || [];
      
      // Charger les avatars depuis user_profiles
      const userIds = data.map((u: any) => u.user_id);
      const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('user_id, avatar_url')
        .in('user_id', userIds);

      if (!error && profiles) {
        const avatarMap: Record<string, string> = {};
        profiles.forEach((p: any) => {
          if (p.avatar_url) avatarMap[p.user_id] = p.avatar_url;
        });

        // Ajouter avatars aux données
        const dataWithAvatars = data.map((u: any) => ({
          ...u,
          avatar: avatarMap[u.user_id] || null
        }));

        setUsers(dataWithAvatars);
        setFilteredUsers(dataWithAvatars);

        // Trouver le rang du user actuel
        if (currentUserId) {
          const userRank = dataWithAvatars.find((u: UserRanking) => u.user_id === currentUserId);
          setCurrentUserRank(userRank ? userRank.rang : null);
        }
      } else {
        setUsers(data);
        setFilteredUsers(data);
      }
    } catch (error) {
      console.error('Erreur classement jetons:', error);
      setUsers([]);
      setFilteredUsers([]);
    }
  }

  async function loadClassementPoints() {
    try {
      // Charger depuis user_stats
      const { data, error } = await supabase
        .from('user_stats')
        .select(`
          user_id,
          total_points,
          total_pronos,
          pronos_corrects,
          taux_reussite,
          user_profiles!inner(pseudo, avatar_url)
        `)
        .eq('saison', getCurrentSeason())
        .order('total_points', { ascending: false })
        .limit(100);

      if (error) throw error;

      const formattedData: UserRanking[] = (data || []).map((item: any, index: number) => ({
        rang: index + 1,
        user_id: item.user_id,
        pseudo: item.user_profiles.pseudo,
        avatar: item.user_profiles.avatar_url || null,
        points: item.total_points || 0,
        matchsPronostiques: item.total_pronos || 0,
        tauxReussite: item.taux_reussite || 0
      }));

      setUsers(formattedData);
      setFilteredUsers(formattedData);

      // Trouver le rang du user actuel
      if (currentUserId) {
        const userRank = formattedData.find(u => u.user_id === currentUserId);
        setCurrentUserRank(userRank ? userRank.rang : null);
      }
    } catch (error) {
      console.error('Erreur classement points:', error);
      setUsers([]);
      setFilteredUsers([]);
    }
  }

  const getPodiumIcon = (rang: number) => {
    if (rang === 1) {
      return (
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 flex items-center justify-center shadow-lg">
          <Trophy className="w-8 h-8 text-white" />
        </div>
      );
    } else if (rang === 2) {
      return (
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 flex items-center justify-center shadow-lg">
          <Trophy className="w-8 h-8 text-white" />
        </div>
      );
    } else if (rang === 3) {
      return (
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
          <Trophy className="w-8 h-8 text-white" />
        </div>
      );
    }
    return null;
  };

  const getMedalIcon = (rang: number) => {
    if (rang === 1) {
      return (
        <svg className="w-9 h-9" viewBox="0 0 64 64" fill="none">
          <defs>
            <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} />
              <stop offset="50%" style={{ stopColor: '#FFA500', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#FF8C00', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          <ellipse cx="32" cy="32" rx="28" ry="20" transform="rotate(125 32 32)" fill="url(#gold)" stroke="#B8860B" strokeWidth="1.5"/>
          <ellipse cx="32" cy="32" rx="20" ry="14" transform="rotate(25 32 32)" fill="none" stroke="#B8860B" strokeWidth="1.2"/>
        </svg>
      );
    } else if (rang === 2) {
      return (
        <svg className="w-9 h-9" viewBox="0 0 64 64" fill="none">
          <defs>
            <linearGradient id="silver" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#E8E8E8', stopOpacity: 1 }} />
              <stop offset="50%" style={{ stopColor: '#C0C0C0', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#A8A8A8', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          <ellipse cx="32" cy="32" rx="28" ry="20" transform="rotate(125 32 32)" fill="url(#silver)" stroke="#808080" strokeWidth="1.5"/>
          <ellipse cx="32" cy="32" rx="20" ry="14" transform="rotate(25 32 32)" fill="none" stroke="#808080" strokeWidth="1.2"/>
        </svg>
      );
    } else if (rang === 3) {
      return (
        <svg className="w-9 h-9" viewBox="0 0 64 64" fill="none">
          <defs>
            <linearGradient id="bronze" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#CD7F32', stopOpacity: 1 }} />
              <stop offset="50%" style={{ stopColor: '#B87333', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#8B4513', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          <ellipse cx="32" cy="32" rx="28" ry="20" transform="rotate(125 32 32)" fill="url(#bronze)" stroke="#654321" strokeWidth="1.5"/>
          <ellipse cx="32" cy="32" rx="20" ry="14" transform="rotate(25 32 32)" fill="none" stroke="#654321" strokeWidth="1.2"/>
        </svg>
      );
    }
    return <span className="text-sm font-bold text-rugby-bronze">{rang}</span>;
  };

  // Fonction pour formater les grands nombres
  const formatNumber = (num: number): string => {
    if (num >= 100000) {
      return `${(num / 1000).toFixed(0)}k`; // 123456 → 123k
    } else if (num >= 10000) {
      return `${(num / 1000).toFixed(1)}k`; // 12345 → 12.3k
    }
    return num.toString(); // < 10000 → affichage normal
  };

  // Fonction pour tronquer les pseudos
  const truncatePseudo = (pseudo: string, maxLength: number = 9): string => {
    if (pseudo.length <= maxLength) return pseudo;
    return pseudo.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-rugby-gold"></div>
      </div>
    );
  }

  const top3 = filteredUsers.slice(0, 3);

  return (
    <div className="pb-24 space-y-4">
      {/* Toggle Jetons/Points */}
      <div className="flex gap-2 bg-white rounded-lg p-1 shadow-sm">
        <button
          onClick={() => setClassementType('jetons')}
          className={`flex-1 py-2.5 rounded-md font-semibold transition-all flex items-center justify-center gap-2 ${
            classementType === 'jetons'
              ? 'bg-rugby-gold text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Coins className="w-4 h-4" />
          Par Jetons
        </button>
        <button
          onClick={() => setClassementType('points')}
          className={`flex-1 py-2.5 rounded-md font-semibold transition-all flex items-center justify-center gap-2 ${
            classementType === 'points'
              ? 'bg-rugby-gold text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Award className="w-4 h-4" />
          Par Points
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowReglementPoints(true);
            }}
            className="ml-1 p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </button>
      </div>

      {/* User position banner */}
      {currentUserRank && (
        <div className="bg-gradient-to-r from-rugby-gold/20 to-rugby-bronze/20 border border-rugby-gold/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rugby-gold to-rugby-bronze flex items-center justify-center text-white font-bold text-xl shadow-lg">
                {currentUserRank}
              </div>
              <div>
                <p className="text-sm text-gray-600">Votre position</p>
                <p className="font-bold text-rugby-gold">
                  {currentUserRank === 1 ? '🏆 1er' : `${currentUserRank}${currentUserRank === 2 ? 'ème' : 'ème'}`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                {classementType === 'jetons' ? 'Jetons' : 'Points'}
              </p>
              <p className="text-2xl font-bold text-rugby-gold">
                {classementType === 'jetons' 
                  ? filteredUsers.find(u => u.user_id === currentUserId)?.jetons 
                  : filteredUsers.find(u => u.user_id === currentUserId)?.points}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher un joueur..."
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rugby-gold focus:border-transparent"
        />
      </div>

      {/* Podium Top 3 - CORRIGÉ */}
      {top3.length >= 3 && (
        <div className="bg-gradient-to-b from-rugby-gold/10 to-transparent rounded-xl p-6 mb-6">
          <div className="flex gap-3 justify-center items-end max-w-md mx-auto">
            {/* 2ème place - LARGEUR FIXE */}
            {top3[1] && (
              <div className="flex flex-col items-center w-28">
                <div className="mb-2">{getPodiumIcon(2)}</div>
                <div className="w-full bg-gradient-to-t from-gray-300 to-gray-400 rounded-t-lg p-2.5 text-center flex flex-col justify-between" style={{ height: '110px' }}>
                  <p className="font-bold text-white text-xs leading-tight mb-1">{truncatePseudo(top3[1].pseudo)}</p>
                  <div className="flex-1 flex items-center justify-center">
                    <p className={`font-bold text-white ${classementType === 'jetons' ? 'text-3xl' : 'text-4xl'}`}>
                      {classementType === 'jetons' ? formatNumber(top3[1].jetons || 0) : (top3[1].points || 0)}
                    </p>
                  </div>
                  <p className="text-[10px] text-white/90 uppercase tracking-wider font-semibold">
                    {classementType === 'jetons' ? 'jetons' : 'points'}
                  </p>
                </div>
              </div>
            )}

            {/* 1ère place - LARGEUR FIXE */}
            {top3[0] && (
              <div className="flex flex-col items-center w-28">
                <div className="mb-2">{getPodiumIcon(1)}</div>
                <div className="w-full bg-gradient-to-t from-yellow-400 to-yellow-500 rounded-t-lg p-2.5 text-center flex flex-col justify-between" style={{ height: '130px' }}>
                  <p className="font-bold text-white text-xs leading-tight mb-1">{truncatePseudo(top3[0].pseudo)}</p>
                  <div className="flex-1 flex items-center justify-center">
                    <p className={`font-bold text-white ${classementType === 'jetons' ? 'text-3xl' : 'text-4xl'}`}>
                      {classementType === 'jetons' ? formatNumber(top3[0].jetons || 0) : (top3[0].points || 0)}
                    </p>
                  </div>
                  <p className="text-[10px] text-white/90 uppercase tracking-wider font-semibold">
                    {classementType === 'jetons' ? 'jetons' : 'points'}
                  </p>
                </div>
              </div>
            )}

            {/* 3ème place - LARGEUR FIXE */}
            {top3[2] && (
              <div className="flex flex-col items-center w-28">
                <div className="mb-2">{getPodiumIcon(3)}</div>
                <div className="w-full bg-gradient-to-t from-orange-400 to-orange-500 rounded-t-lg p-2.5 text-center flex flex-col justify-between" style={{ height: '95px' }}>
                  <p className="font-bold text-white text-xs leading-tight mb-1">{truncatePseudo(top3[2].pseudo)}</p>
                  <div className="flex-1 flex items-center justify-center">
                    <p className={`font-bold text-white ${classementType === 'jetons' ? 'text-3xl' : 'text-4xl'}`}>
                      {classementType === 'jetons' ? formatNumber(top3[2].jetons || 0) : (top3[2].points || 0)}
                    </p>
                  </div>
                  <p className="text-[10px] text-white/90 uppercase tracking-wider font-semibold">
                    {classementType === 'jetons' ? 'jetons' : 'points'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Liste classement */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Aucun utilisateur trouvé
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredUsers.map((user) => (
              <div
                key={user.user_id}
                className={`flex items-center gap-4 p-4 transition-colors ${
                  user.user_id === currentUserId
                    ? 'bg-rugby-gold/10 border-l-4 border-rugby-gold'
                    : 'hover:bg-gray-50'
                }`}
              >
                {/* Rang / Médaille */}
                <div className="w-10 flex justify-center">
                  {getMedalIcon(user.rang)}
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rugby-gold to-rugby-bronze flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.pseudo}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{user.pseudo.charAt(0).toUpperCase()}</span>
                  )}
                </div>

                {/* Pseudo */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${
                    user.user_id === currentUserId ? 'text-rugby-gold' : 'text-gray-800'
                  }`}>
                    {user.pseudo}
                    {user.user_id === currentUserId && (
                      <span className="ml-2 text-xs bg-rugby-gold text-white px-2 py-0.5 rounded-full">
                        Vous
                      </span>
                    )}
                  </p>
                  {classementType === 'jetons' && user.benefice_net !== undefined && (
                    <p className={`text-xs mt-0.5 ${
                      user.benefice_net >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <TrendingUp className="w-3 h-3 inline mr-1" />
                      {user.benefice_net >= 0 ? '+' : ''}{user.benefice_net} net
                    </p>
                  )}
                  
                </div>

                {/* Valeur principale */}
                <div className="text-right">
                  <p className="text-lg font-bold text-rugby-gold">
                    {classementType === 'jetons' ? user.jetons : user.points}
                  </p>
                  <p className="text-xs text-gray-500">
                    {classementType === 'jetons' ? 'jetons' : 'pts'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Règlement Points */}
      {showReglementPoints && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowReglementPoints(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div 
              className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-rugby-gold text-white p-4 flex items-center justify-between z-10">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Système de Points
                </h3>
                <button
                  onClick={() => setShowReglementPoints(false)}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-700">
                  Le classement par points récompense la <strong>précision de vos pronostics</strong>, indépendamment des mises.
                </p>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-bold text-blue-900 mb-3">📊 Barème Points</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>🎯 Score exact (FT)</span>
                      <strong className="text-blue-700">10 points</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>✅ Bon vainqueur + écart exact</span>
                      <strong className="text-blue-700">7 points</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>✅ Bon vainqueur + 1-7 pts écart</span>
                      <strong className="text-blue-700">5 points</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>✅ Bon vainqueur + 8-14 pts écart</span>
                      <strong className="text-blue-700">3 points</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>✅ Bon vainqueur + 15+ pts écart</span>
                      <strong className="text-blue-700">1 point</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>❌ Mauvais vainqueur</span>
                      <strong className="text-gray-600">0 point</strong>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h4 className="font-bold text-purple-900 mb-3">🏆 Bonus Mi-Temps</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>🎯 Score exact MT</span>
                      <strong className="text-purple-700">+5 points</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>✅ Bon vainqueur MT + écart exact</span>
                      <strong className="text-purple-700">+3 points</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>✅ Bon vainqueur MT</span>
                      <strong className="text-purple-700">+1 point</strong>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-600 bg-gray-50 rounded p-3">
                  💡 <strong>Astuce :</strong> Plus votre prono est précis, plus vous gagnez de points. Le classement par points récompense la qualité plutôt que la quantité !
                </p>
              </div>

              <div className="sticky bottom-0 bg-gray-50 p-4 border-t">
                <button
                  onClick={() => setShowReglementPoints(false)}
                  className="w-full bg-rugby-gold hover:bg-rugby-bronze text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Compris !
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
