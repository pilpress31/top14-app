import { useEffect, useState } from 'react';
import { Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PronoCard } from '@/components/PronoCard';
import { PronoCardSkeleton } from '@/components/LoadingSkeleton';
import { getPronos } from '@/api/client';
import type { Match } from '@/types/rugby';
import MainHeader from "@/components/MainHeader";

export default function Pronos() {
  const [matchs, setMatchs] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJournee, setSelectedJournee] = useState<string>('all');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPronos();
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

  const journees = [...new Set(matchs.map(m => m.journee))].sort((a, b) => a - b);
  
  const filteredMatchs = selectedJournee === 'all' 
    ? matchs 
    : matchs.filter(m => m.journee === parseInt(selectedJournee));

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="gradient-primary text-primary-foreground py-8 px-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6" />
            Pronostics
          </h1>
          <p className="text-primary-foreground/70 text-sm mt-1">
            {matchs.length} matchs à venir
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Filter */}
        <Select value={selectedJournee} onValueChange={setSelectedJournee}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filtrer par journée" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les journées</SelectItem>
            {journees.map(j => (
              <SelectItem key={j} value={j.toString()}>Journée {j}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Content */}
        {error ? (
          <div className="text-center py-8">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={loadData}>Réessayer</Button>
          </div>
        ) : loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => <PronoCardSkeleton key={i} />)}
          </div>
        ) : filteredMatchs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Aucun match trouvé
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMatchs.map(match => (
              <PronoCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
