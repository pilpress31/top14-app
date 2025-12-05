import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MatchHistory } from '@/components/MatchHistory';
import { getHistorique } from '@/api/client';
import type { MatchHistorique } from '@/types/rugby';

export default function Historique() {
  const [matchs, setMatchs] = useState<MatchHistorique[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getHistorique();
      setMatchs(data);
    } catch (e) {
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="gradient-primary text-primary-foreground py-8 px-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <History className="w-6 h-6" />
            Historique
          </h1>
          <p className="text-primary-foreground/70 text-sm mt-1">
            {matchs.length.toLocaleString()} matchs joués
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {error ? (
          <div className="text-center py-8">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={loadData}>Réessayer</Button>
          </div>
        ) : loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary mx-auto" />
            <p className="text-muted-foreground mt-4">Chargement...</p>
          </div>
        ) : (
          <MatchHistory matchs={matchs} />
        )}
      </div>
    </div>
  );
}
