import { useState, useEffect } from "react";
import { getOddsLive } from '../lib/api';
import { getTeamData } from "../utils/teams";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface StatsData {
  global: {
    precisionFT: number;
    precisionHT: number;
    pronosFTCorrects: number;
    pronosHTCorrects: number;
    totalPronos: number;
    meilleureJournee: number;
    meilleurePrecision: number;
  };
  evolution: Array<{
    journee: number;
    precisionFT: string;
    precisionHT: string;
    total: number;
  }>;
  parEquipe: Array<{
    equipe: string;
    precision: string;
    corrects: number;
    total: number;
  }>;
  derniersPronos: Array<{
    id: string;
    date: string;
    journee: number;
    equipe_domicile: string;
    equipe_exterieure: string;
    score_reel: string;
    score_prono: string;
    comp_ft: string;
    comp_ht: string;
  }>;
}

function StatistiquesPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'evolution' | 'equipes' | 'recents'>('evolution');

  useEffect(() => {
    async function loadStats() {
      try {
        const rawData = await getStatsPrecision();
        console.log("Stats précision chargées:", rawData);
        
        // Transformer les données brutes de l'API
        const statsArray = rawData.stats || [];
        
        // Calculer les stats globales
        let totalMatches = 0;
        let totalCorrectsFT = 0;
        let totalCorrectsHT = 0;
        let meilleurePrecision = 0;
        let meilleureJournee = 0;
        
        statsArray.forEach((stat: any) => {
          totalMatches += stat.total;
          totalCorrectsFT += stat.corrects_ft;
          totalCorrectsHT += stat.corrects_ht || 0;
          
          const precisionFT = parseFloat(stat.precision_ft);
          if (precisionFT > meilleurePrecision) {
            meilleurePrecision = precisionFT;
            meilleureJournee = stat.journee;
          }
        });
        
        const precisionFT = totalMatches > 0 ? ((totalCorrectsFT / totalMatches) * 100).toFixed(1) : 0;
        const precisionHT = totalMatches > 0 ? ((totalCorrectsHT / totalMatches) * 100).toFixed(1) : 0;
        
        // Construire la structure attendue
        const processedData: StatsData = {
          global: {
            precisionFT: parseFloat(precisionFT.toString()),
            precisionHT: parseFloat(precisionHT.toString()),
            pronosFTCorrects: totalCorrectsFT,
            pronosHTCorrects: totalCorrectsHT,
            totalPronos: totalMatches,
            meilleureJournee: meilleureJournee,
            meilleurePrecision: Math.round(meilleurePrecision * 10) / 10
          },
          evolution: statsArray.map((stat: any) => ({
            journee: stat.journee,
            precisionFT: stat.precision_ft,
            precisionHT: stat.precision_ht || '0',
            total: stat.total
          })),
          parEquipe: [], // À remplir si disponible
          derniersPronos: [] // À remplir si disponible
        };
        
        setStats(processedData);
      } catch (e) {
        console.error("Erreur chargement stats:", e);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return <div className="p-6 text-center text-gray-500">🔄 Chargement des statistiques…</div>;
  }

  if (!stats) {
    return <div className="p-6 text-center text-gray-500">Aucune donnée disponible</div>;
  }

  return (
    <div className="p-6 pb-24 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold text-rugby-gold mb-4">Statistiques de Précision</h2>

      {/* Stats globales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500">
          <p className="text-xs text-gray-500 uppercase mb-1">Précision FT</p>
          <p className="text-3xl font-bold text-green-600">{stats.global.precisionFT}%</p>
          <p className="text-xs text-gray-600 mt-1">
            {stats.global.pronosFTCorrects}/{stats.global.totalPronos} corrects
          </p>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
          <p className="text-xs text-gray-500 uppercase mb-1">Précision HT</p>
          <p className="text-3xl font-bold text-blue-600">{stats.global.precisionHT}%</p>
          <p className="text-xs text-gray-600 mt-1">
            {stats.global.pronosHTCorrects}/{stats.global.totalPronos} corrects
          </p>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-rugby-orange">
          <p className="text-xs text-gray-500 uppercase mb-1">Meilleure journée</p>
          <p className="text-3xl font-bold text-rugby-orange">J{stats.global.meilleureJournee}</p>
          <p className="text-xs text-gray-600 mt-1">
            {stats.global.meilleurePrecision}% de réussite
          </p>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-rugby-gold">
          <p className="text-xs text-gray-500 uppercase mb-1">Total pronos</p>
          <p className="text-3xl font-bold text-rugby-gold">{stats.global.totalPronos}</p>
          <p className="text-xs text-gray-600 mt-1">Matchs analysés</p>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('evolution')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
            activeTab === 'evolution'
              ? 'bg-rugby-gold text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          📈 Évolution
        </button>
        <button
          onClick={() => setActiveTab('equipes')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
            activeTab === 'equipes'
              ? 'bg-rugby-gold text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          🏉 Par équipe
        </button>
        <button
          onClick={() => setActiveTab('recents')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
            activeTab === 'recents'
              ? 'bg-rugby-gold text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          🎯 Pronos récents
        </button>
      </div>

      {/* Contenu onglets */}
      {activeTab === 'evolution' && (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Évolution de la précision par journée</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={stats.evolution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="journee" 
                label={{ value: 'Journée', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                label={{ value: 'Précision (%)', angle: -90, position: 'insideLeft' }}
                domain={[0, 100]}
              />
              <Tooltip 
                formatter={(value: any) => `${value}%`}
                labelFormatter={(label) => `Journée ${label}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="precisionFT" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Score final"
                dot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="precisionHT" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Mi-temps"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeTab === 'equipes' && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-rugby-gold text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase">Équipe</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase">Précision</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase">Corrects</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase">Barre</th>
                </tr>
              </thead>
              <tbody>
                {stats.parEquipe.map((equipe, index) => {
                  const teamData = getTeamData(equipe.equipe);
                  const bgColor = index % 2 === 0 ? "bg-gray-50" : "bg-white";
                  const precision = parseFloat(equipe.precision);
                  
                  return (
                    <tr key={equipe.equipe} className={`${bgColor} hover:bg-rugby-orange/10`}>
                      <td className="px-4 py-3 text-sm text-gray-700">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                            <img
                              src={teamData.logo}
                              alt={teamData.name}
                              className="w-4 h-4 object-contain"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-800">{teamData.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-bold ${
                          precision >= 70 ? 'text-green-600' :
                          precision >= 60 ? 'text-orange-500' :
                          'text-red-600'
                        }`}>
                          {equipe.precision}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-green-600 font-semibold">
                        {equipe.corrects}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700">
                        {equipe.total}
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              precision >= 70 ? 'bg-green-500' :
                              precision >= 60 ? 'bg-orange-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${precision}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'recents' && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-rugby-gold text-white">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase">Date</th>
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase">Match</th>
                  <th className="px-3 py-3 text-center text-xs font-bold uppercase">Réel</th>
                  <th className="px-3 py-3 text-center text-xs font-bold uppercase">Prono</th>
                  <th className="px-3 py-3 text-center text-xs font-bold uppercase">FT</th>
                  <th className="px-3 py-3 text-center text-xs font-bold uppercase">HT</th>
                </tr>
              </thead>
              <tbody>
                {stats.derniersPronos.map((prono, index) => {
                  const bgColor = index % 2 === 0 ? "bg-gray-50" : "bg-white";
                  const isCorrectFT = prono.comp_ft && (prono.comp_ft.includes('OK') || prono.comp_ft === 'OK');
                  const isCorrectHT = prono.comp_ht && (prono.comp_ht.includes('OK') || prono.comp_ht === 'OK');
                  
                  return (
                    <tr key={prono.id} className={`${bgColor} hover:bg-rugby-orange/10`}>
                      <td className="px-3 py-3 text-xs text-gray-600">
                        {new Date(prono.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="px-3 py-3 text-sm">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-gray-800">{getTeamData(prono.equipe_domicile).shortName}</span>
                          <span className="text-gray-500">-</span>
                          <span className="font-semibold text-gray-800">{getTeamData(prono.equipe_exterieure).shortName}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center text-sm font-bold text-gray-800">
                        {prono.score_reel}
                      </td>
                      <td className="px-3 py-3 text-center text-sm text-gray-600">
                        {prono.score_prono}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white ${
                          isCorrectFT ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                          {isCorrectFT ? '✓' : '✗'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white ${
                          isCorrectHT ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                          {isCorrectHT ? '✓' : '✗'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default StatistiquesPage;
