import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Calendar, ChevronRight, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PronoCard } from '@/components/PronoCard';
import { ClassementElo } from '@/components/ClassementElo';
import { PronoCardSkeleton, ClassementSkeleton } from '@/components/LoadingSkeleton';
import { getPronos, getClassement, getConfig } from '@/api/client';
import type { Match, EquipeStats, ConfigApp } from '@/types/rugby';

export default function Index() {
  const [matchs, setMatchs] = useState<Match[]>([]);
  const [classement, setClassement] = useState<EquipeStats[]>([]);
  const [config, setConfig] = useState<ConfigApp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pronosData, classementData, configData] = await Promise.all([
        getPronos(),
        getClassement(),
        getConfig()
      ]);
      setMatchs(pronosData.slice(0, 5));
      setClassement(classementData);
      setConfig(configData);
    } catch (e) {
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen pb-24">
      {/* Hero Section */}
      <section className="gradient-primary text-primary-foreground py-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 text-9xl">🏉</div>
          <div className="absolute bottom-5 left-5 text-7xl">🏆</div>
        </div>
        
        <div className="relative max-w-lg mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-black mb-3">
            Pronos Top 14
          </h1>
          <p className="text-primary-foreground/80 text-sm md:text-base mb-6">
            Système Elo + Machine Learning
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="bg-primary-foreground/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5" />
                <span className="text-2xl font-bold">78%</span>
              </div>
              <p className="text-xs opacity-80">Précision moyenne</p>
            </div>
            <div className="bg-primary-foreground/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Database className="w-5 h-5" />
                <span className="text-2xl font-bold">
                  {config?.nombre_matchs_historique?.toLocaleString() || '3600+'}
                </span>
              </div>
              <p className="text-xs opacity-80">Matchs analysés</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-lg mx-auto px-4 space-y-8 -mt-4">
        {/* Prochains matchs */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-secondary" />
              Prochains matchs
            </h2>
            <Link to="/pronos">
              <Button variant="ghost" size="sm" className="text-secondary">
                Voir tout <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          
          {error ? (
            <div className="text-center py-8">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={loadData}>Réessayer</Button>
            </div>
          ) : loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <PronoCardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="space-y-4">
              {matchs.map(match => (
                <PronoCard key={match.id} match={match} />
              ))}
            </div>
          )}
        </section>

        {/* Classement */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Top 5 Elo</h2>
            <Link to="/classement">
              <Button variant="ghost" size="sm" className="text-secondary">
                Voir tout <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          
          {loading ? (
            <ClassementSkeleton />
          ) : (
            <ClassementElo equipes={classement} compact />
          )}
        </section>

        {/* About */}
        <section className="glass rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-3">À propos</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Cette application utilise un système Elo adapté au rugby et des modèles
            de régression pour prédire les scores des matchs du Top 14. Les prédictions
            sont basées sur l'historique de plus de {config?.nombre_matchs_historique?.toLocaleString() || '3600'} matchs.
          </p>
        </section>
      </div>
    </div>
  );
}