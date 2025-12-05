import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClassementElo } from '@/components/ClassementElo';
import { ClassementSkeleton } from '@/components/LoadingSkeleton';
import { getClassement } from '@/api/client';
import type { EquipeStats } from '@/types/rugby';

export default function Classement() {
  const [classement, setClassement] = useState<EquipeStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getClassement();
      setClassement(data);
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
            <Trophy className="w-6 h-6" />
            Classement Elo
          </h1>
          <p className="text-primary-foreground/70 text-sm mt-1">
            {classement.length} équipes classées
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
          <ClassementSkeleton />
        ) : (
          <ClassementElo equipes={classement} />
        )}
      </div>
    </div>
  );
}
