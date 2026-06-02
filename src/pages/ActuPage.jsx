import ActuTab from '../components/ActuTab';
import ActuHeader from '../components/ActuHeader';
import { useChampionnat } from '../contexts/ChampionnatContext';

export default function ActuPage() {
  const { championnat, setChampionnat } = useChampionnat();

  return (
    <div className="min-h-screen bg-gray-50">
      <ActuHeader championnat={championnat} />
      <div className="pt-[120px] pb-24 px-3 max-w-lg mx-auto">
        {/* ═══ Sélecteur de championnat ═══ */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex rounded-lg shadow-md border-2 border-gray-200 overflow-hidden">
            <button
              onClick={() => setChampionnat('top14')}
              className={`px-4 py-2 font-bold text-sm transition-colors ${
                championnat === 'top14'
                  ? 'bg-rugby-gold text-white'
                  : 'bg-white text-rugby-gold hover:bg-rugby-gold/10'
              }`}
            >
              🏆 TOP 14
            </button>
            <button
              onClick={() => setChampionnat('prod2')}
              className={`px-4 py-2 font-bold text-sm transition-colors ${
                championnat === 'prod2'
                  ? 'bg-d2-navy text-white'
                  : 'bg-white text-d2-navy hover:bg-d2-navy/10'
              }`}
            >
              🥈 PRO D2
            </button>
            <button
              onClick={() => setChampionnat('hcup')}
              className={`px-4 py-2 font-bold text-sm transition-colors ${
                championnat === 'hcup'
                  ? 'bg-hcup-blue text-hcup-gold'
                  : 'bg-white text-hcup-blue hover:bg-hcup-blue/10'
              }`}
            >
              ⭐ C.CUP
            </button>
          </div>
        </div>

        <ActuTab />
      </div>
    </div>
  );
}