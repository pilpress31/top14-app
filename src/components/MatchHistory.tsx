import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Trophy, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { MatchHistorique } from '@/types/rugby';

interface MatchHistoryProps {
  matchs: MatchHistorique[];
}

const ITEMS_PER_PAGE = 10;

export function MatchHistory({ matchs }: MatchHistoryProps) {
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Get unique teams
  const teams = useMemo(() => {
    const teamSet = new Set<string>();
    matchs.forEach(m => {
      teamSet.add(m.equipe_domicile);
      teamSet.add(m.equipe_exterieure);
    });
    return Array.from(teamSet).sort();
  }, [matchs]);
  
  // Filter and sort matches
  const filteredMatchs = useMemo(() => {
    let filtered = [...matchs].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    if (selectedTeam !== 'all') {
      filtered = filtered.filter(m => 
        m.equipe_domicile === selectedTeam || m.equipe_exterieure === selectedTeam
      );
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m => 
        m.equipe_domicile.toLowerCase().includes(query) ||
        m.equipe_exterieure.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [matchs, selectedTeam, searchQuery]);
  
  // Pagination
  const totalPages = Math.ceil(filteredMatchs.length / ITEMS_PER_PAGE);
  const paginatedMatchs = filteredMatchs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };
  
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={selectedTeam} onValueChange={(v) => { setSelectedTeam(v); setCurrentPage(1); }}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Toutes équipes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes équipes</SelectItem>
            {teams.map(team => (
              <SelectItem key={team} value={team}>{team}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="pl-10"
          />
        </div>
      </div>
      
      {/* Matches list */}
      <div className="space-y-3">
        {paginatedMatchs.map((match) => {
          const matchDate = new Date(match.date);
          const isHomeWin = match.score_domicile > match.score_exterieur;
          const isAwayWin = match.score_exterieur > match.score_domicile;
          const isDraw = match.score_domicile === match.score_exterieur;
          
          return (
            <div key={match.id} className="glass rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">
                  {format(matchDate, 'EEE d MMM yyyy', { locale: fr })}
                </span>
                <span className="text-xs text-muted-foreground">
                  J{match.journee} - {match.saison}
                </span>
              </div>
              
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 text-left">
                  <span className={`text-sm font-semibold ${isHomeWin ? 'text-green-600' : ''}`}>
                    {match.equipe_domicile}
                  </span>
                  {isHomeWin && <Trophy className="inline-block w-4 h-4 ml-1 text-yellow-500" />}
                </div>
                
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-muted">
                  <span className={`text-lg font-bold ${isHomeWin ? 'text-green-600' : ''}`}>
                    {match.score_domicile}
                  </span>
                  <span className="text-muted-foreground">-</span>
                  <span className={`text-lg font-bold ${isAwayWin ? 'text-green-600' : ''}`}>
                    {match.score_exterieur}
                  </span>
                </div>
                
                <div className="flex-1 text-right">
                  {isAwayWin && <Trophy className="inline-block w-4 h-4 mr-1 text-yellow-500" />}
                  <span className={`text-sm font-semibold ${isAwayWin ? 'text-green-600' : ''}`}>
                    {match.equipe_exterieure}
                  </span>
                </div>
              </div>
              
              {/* ✅ Utilisation du nouvel objet Score */}
              <div className="text-center mt-2">
                <span className="text-xs text-muted-foreground">
                  MT: {match.score_ht?.domicile} - {match.score_ht?.exterieur}
                </span>
              </div>
            </div>
          );
        })}
        
        {paginatedMatchs.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Aucun match trouvé
          </div>
        )}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <span className="text-sm text-muted-foreground px-4">
            Page {currentPage} / {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
