import ActuTab from '../components/ActuTab';
import ActuHeader from '../components/ActuHeader';
import { useChampionnat } from '../contexts/ChampionnatContext';

export default function ActuPage() {
  const { championnat, setChampionnat } = useChampionnat();

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <ActuHeader championnat={championnat} />
      <div className="pt-[120px] pb-24 px-3 max-w-lg mx-auto">
        {/* ═══ Sélecteur de championnat (une seule ligne, 4 segments égaux) ═══ */}
        <div className="flex w-full rounded-lg shadow-md border border-white/10 overflow-hidden mb-4">
          <button
            onClick={() => setChampionnat('top14')}
            className={`flex-1 px-1 py-2 font-bold text-xs whitespace-nowrap transition-colors ${
              championnat === 'top14'
                ? 'bg-rugby-gold text-white'
                : 'bg-[#161616] text-rugby-gold hover:bg-rugby-gold/10'
            }`}
          >
            🏆 TOP 14
          </button>
          <button
            onClick={() => setChampionnat('prod2')}
            className={`flex-1 px-1 py-2 font-bold text-xs whitespace-nowrap border-l border-white/10 transition-colors ${
              championnat === 'prod2'
                ? 'bg-d2-navy text-white'
                : 'bg-[#161616] text-[#97C1FE] hover:bg-d2-navy/30'
            }`}
          >
            🥈 PRO D2
          </button>
          <button
            onClick={() => setChampionnat('hcup')}
            className={`flex-1 px-1 py-2 font-bold text-xs whitespace-nowrap border-l border-white/10 transition-colors ${
              championnat === 'hcup'
                ? 'bg-hcup-blue text-hcup-gold'
                : 'bg-[#161616] text-hcup-gold hover:bg-hcup-blue/20'
            }`}
          >
            ⭐ C.CUP
          </button>
          <button
            onClick={() => setChampionnat('ecc')}
            className="flex-1 px-1 py-2 font-bold text-xs whitespace-nowrap border-l border-white/10 transition-colors"
            style={championnat === 'ecc'
              ? { backgroundColor: '#2E7D32', color: '#FFFFFF' }
              : { backgroundColor: '#161616', color: '#66BB6A' }}
          >
            🛡️ CHALL.
          </button>
          <button
            onClick={() => setChampionnat('monde')}
            className="flex-1 px-1 py-2 font-bold text-xs whitespace-nowrap border-l border-white/10 transition-colors"
            style={championnat === 'monde'
              ? { backgroundColor: '#0B6E4F', color: '#FFFFFF' }
              : { backgroundColor: '#161616', color: '#34D399' }}
          >
            🌍 MONDE
          </button>
        </div>

        <ActuTab />
      </div>
    </div>
  );
}
