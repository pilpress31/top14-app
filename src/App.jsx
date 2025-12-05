import { useState, useEffect } from 'react';
import PronoCard from "@/components/PronoCard";
import MainHeader from "@/components/MainHeader";
import { getPronos } from "@/api/client";

function App() {
  const [pronos, setPronos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState("inconnu");

  useEffect(() => {
    async function loadPronos() {
      setLoading(true);
      try {
        const data = await getPronos();
        setPronos(data);

        // ✅ Détection simple : si l’API renvoie prono_ft → données API
        if (data.length > 0 && data[0].prono_ft) {
          console.log("✅ Données récupérées depuis l’API distante");
          setSource("API distante");
        } else {
          console.log("⚠️ Données récupérées depuis le fallback local");
          setSource("fallback local");
        }
      } catch (e) {
        console.error("Erreur lors du chargement des pronos:", e);
        setSource("erreur");
      }
      setLoading(false);
    }
    loadPronos();
  }, []);

  // ✅ Badge coloré selon la source
  const sourceBadge = {
    "API distante": "bg-green-100 text-green-700",
    "fallback local": "bg-orange-100 text-orange-700",
    "erreur": "bg-red-100 text-red-700",
    "inconnu": "bg-gray-100 text-gray-700"
  }[source];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header dynamique */}
      <MainHeader />

      {/* Contenu principal décalé sous le header */}
      <main className="container mx-auto px-4 py-8 pt-32">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-rugby-blue">
              Prochains matchs - Journée en cours
            </h2>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${sourceBadge}`}>
              Source : {source}
            </span>
          </div>

          {loading ? (
            <div className="text-center text-gray-500 py-8">
              🔄 Chargement des pronos...
            </div>
          ) : pronos.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Aucun match à pronostiquer pour le moment
            </div>
          ) : (
            <div className="space-y-4">
              {pronos.slice(0, 10).map((match) => (
                <PronoCard key={match.id} match={match} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
