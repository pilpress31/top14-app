// ============================================
// CLASSEMENT COMMUNAUTÉ - FIX RACE CONDITION
// ============================================

import { useState, useEffect } from "react";

const IA_USER_ID = "00000000-0000-0000-0000-000000000001";
const IA_D2_USER_ID = "00000000-0000-0000-0000-000000000002";
const BOT_USER_IDS = [IA_USER_ID, IA_D2_USER_ID];
import { Search, Coins, Award, TrendingUp, Trophy, HelpCircle, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import axios from 'axios';
import { getCurrentSeason } from '../utils/season';
import { useRealtimeSync } from '../hooks/useRealtimeSync';

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

  // ✅ Realtime
  useRealtimeSync([
    { table: 'user_credits', onUpdate: () => loadAll() },
    { table: 'user_stats', onUpdate: () => loadAll() },
  ]);

  // ✅ Un seul useEffect — charge le user EN PREMIER puis le classement
  useEffect(() => {
    loadAll();
  }, [classementType]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(users.filter(u => u.pseudo.toLowerCase().includes(query)));
    }
  }, [searchQuery, users]);

  // ✅ Charge user puis classement séquentiellement
  async function loadAll() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || null;
      setCurrentUserId(userId);
      await loadClassement(userId);
    } catch (error) {
      console.error('Erreur chargement:', error);
    }
  }

  async function loadClassement(userId: string | null) {
    if (users.length === 0) {
      setLoading(true);
    }
    try {
      if (classementType === 'jetons') {
        await loadClassementJetons(userId);
      } else {
        await loadClassementPoints(userId);
      }
    } catch (error) {
      console.error('Erreur chargement classement:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadClassementJetons(userId: string | null) {
    try {
      const response = await axios.get('https://top14-api-production.up.railway.app/api/classement/jetons?limit=100');
      const data = response.data || [];
      // Charger les avatars depuis public_profiles (vue sécurisée)
      const userIds = data.map((u: any) => u.user_id);
      const { data: profiles, error } = await supabase
        .from('public_profiles')
        .select('user_id, avatar_url')
        .in('user_id', userIds);
      const dataWithAvatars = (!error && profiles)
        ? data.map((u: any) => ({
            ...u,
            avatar: profiles.find((p: any) => p.user_id === u.user_id)?.avatar_url || null
          }))
        : data;
      setUsers(dataWithAvatars);
      setFilteredUsers(dataWithAvatars);
      if (userId) {
        const userRank = dataWithAvatars.find((u: UserRanking) => u.user_id === userId);
        setCurrentUserRank(userRank ? userRank.rang : null);
      }
    } catch (error) {
      console.error('Erreur classement jetons:', error);
      setUsers([]);
      setFilteredUsers([]);
    }
  }
    async function loadClassementPoints(userId: string | null) {
    try {
      // 1. Stats par saison — sans embed
      const { data: stats, error: statsError } = await supabase
        .from('user_stats')
        .select('user_id, total_points, total_pronos, pronos_corrects, taux_reussite')
        .eq('saison', getCurrentSeason())
        .order('total_points', { ascending: false })
        .limit(100);
      if (statsError) throw statsError;

      // 2. Pseudos + avatars depuis la vue sécurisée
      const userIds = (stats || []).map((s: any) => s.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('public_profiles')
        .select('user_id, pseudo, avatar_url')
        .in('user_id', userIds);
      if (profilesError) throw profilesError;

      // 3. Fusion côté client
      const formattedData: UserRanking[] = (stats || []).map((item: any, index: number) => {
        const profile = profiles?.find((p: any) => p.user_id === item.user_id);
        return {
          rang: index + 1,
          user_id: item.user_id,
          pseudo: profile?.pseudo || 'Utilisateur',
          avatar: profile?.avatar_url || null,
          points: item.total_points || 0,
          matchsPronostiques: item.total_pronos || 0,
          tauxReussite: item.taux_reussite || 0
        };
      });

      setUsers(formattedData);
      setFilteredUsers(formattedData);
      if (userId) {
        const userRank = formattedData.find((u: UserRanking) => u.user_id === userId);
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

  const formatNumber = (num: number): string => {
    if (num >= 100000) return `${(num / 1000).toFixed(0)}k`;
    if (num >= 10000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

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

  // Masquer les IA du classement Par Jetons (0 jetons = pas pertinent)
  const displayedUsers = classementType === 'jetons'
    ? filteredUsers.filter(u => !BOT_USER_IDS.includes(u.user_id))
    : filteredUsers;

  const top3 = displayedUsers.slice(0, 3);

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

      {/* Bandeau Votre position */}
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
                  {currentUserRank === 1 ? '🏆 1er' : `${currentUserRank}ème`}
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

      {/* Podium Top 3 */}
      {top3.length >= 3 && (
        <div className="bg-gradient-to-b from-rugby-gold/10 to-transparent rounded-xl p-6 mb-6">
          <div className="flex gap-3 justify-center items-end max-w-md mx-auto">

            {/* 2ème place */}
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

            {/* 1ère place */}
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

            {/* 3ème place */}
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
        {displayedUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Aucun utilisateur trouvé
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {displayedUsers.map((user) => (
              <div
                key={user.user_id}
                className={`flex items-center gap-4 p-4 transition-colors ${
                  user.user_id === IA_USER_ID
                    ? 'bg-gradient-to-r from-rugby-gold/10 to-red-50 border-l-4 border-rugby-gold'
                    : user.user_id === IA_D2_USER_ID
                    ? 'border-l-4'
                    : user.user_id === currentUserId
                    ? 'bg-rugby-gold/10 border-l-4 border-rugby-gold'
                    : 'hover:bg-gray-50'
                }`}
                style={
                  user.user_id === IA_D2_USER_ID
                    ? {
                        background: 'linear-gradient(to right, rgba(0, 23, 77, 0.08), rgba(151, 193, 254, 0.08))',
                        borderLeftColor: '#00174D',
                      }
                    : undefined
                }
              >
                {/* Rang / Médaille */}
                <div className="w-10 flex justify-center">
                  {getMedalIcon(user.rang)}
                </div>

                {/* Avatar */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden ${
                    user.user_id === IA_USER_ID
                      ? 'bg-gradient-to-br from-rugby-gold via-yellow-500 to-red-600 ring-2 ring-rugby-gold shadow-lg'
                      : user.user_id === IA_D2_USER_ID
                      ? 'ring-2 shadow-lg'
                      : 'bg-gradient-to-br from-rugby-gold to-rugby-bronze'
                  }`}
                  style={
                    user.user_id === IA_D2_USER_ID
                      ? {
                          background: 'linear-gradient(135deg, #00174D, #97C1FE)',
                          boxShadow: '0 0 0 2px #C0C0C0, 0 2px 4px rgba(0,0,0,0.1)',
                        }
                      : undefined
                  }
                >
                  {user.user_id === IA_USER_ID ? (
                    // Bouclier de Brennus stylisé (IA Top 14)
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2 L20 5 L20 12 C20 16.5 16.5 20 12 22 C7.5 20 4 16.5 4 12 L4 5 Z" fill="white" stroke="#B91C1C" strokeWidth="1"/>
                      <path d="M12 6 L16 7.5 L16 12 C16 14.5 14 16.5 12 17.5 C10 16.5 8 14.5 8 12 L8 7.5 Z" fill="#D4AF37" stroke="#B91C1C" strokeWidth="0.5"/>
                      <text x="12" y="13.5" textAnchor="middle" fontSize="5" fontWeight="700" fill="#B91C1C">XIV</text>
                    </svg>
                  ) : user.user_id === IA_D2_USER_ID ? (
                    // Coupe du champion Pro D2 (IA Pro D2)
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 4 L16 4 L16 10 C16 13 14 15 12 15 C10 15 8 13 8 10 Z" fill="#C0C0C0" stroke="white" strokeWidth="0.5"/>
                      <path d="M8 6 L5 6 C4 6 4 8 5 9 L8 9" fill="none" stroke="#C0C0C0" strokeWidth="1.2"/>
                      <path d="M16 6 L19 6 C20 6 20 8 19 9 L16 9" fill="none" stroke="#C0C0C0" strokeWidth="1.2"/>
                      <rect x="11" y="15" width="2" height="3" fill="#C0C0C0"/>
                      <rect x="8" y="18" width="8" height="2" fill="#C0C0C0" rx="0.5"/>
                      <text x="12" y="12" textAnchor="middle" fontSize="4" fontWeight="700" fill="#00174D">D2</text>
                    </svg>
                  ) : user.avatar ? (
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
                  <p
                    className={`text-sm font-semibold truncate ${
                      user.user_id === IA_USER_ID ? 'text-red-700' :
                      user.user_id === currentUserId ? 'text-rugby-gold' : 'text-gray-800'
                    }`}
                    style={
                      user.user_id === IA_D2_USER_ID
                        ? { color: '#00174D' }
                        : undefined
                    }
                  >
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
