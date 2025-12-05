import { useState, useEffect } from "react";
import { getConfig } from "@/api/client"; // ← Import de la config

function MainHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [config, setConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);

    // Charger la config
    const loadConfig = async () => {
      try {
        setLoadingConfig(true);
        const data = await getConfig();
        setConfig(data);
      } catch (e) {
        console.error("Erreur chargement config", e);
        setConfig(null); // fallback si erreur
      } finally {
        setLoadingConfig(false);
      }
    };
    loadConfig();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 w-full z-50 backdrop-blur-md transition-all duration-500 ${
        scrolled ? "bg-black/90 py-3" : "bg-black/50 py-6"
      } text-white shadow-lg`}
    >
      <div className="container mx-auto px-4 text-center transition-all duration-500">
        <div className="flex items-center justify-center gap-3 mb-2">
          <img
            src="/images/rugby-ball.jpg"
            alt="Ballon de rugby"
            className={`object-contain animate-spin-slow transition-all duration-500 ${
              scrolled ? "w-6 h-6" : "w-10 h-10"
            }`}
          />
          <h1
            className={`font-bold uppercase transition-all duration-500 ${
              scrolled ? "text-2xl" : "text-3xl"
            }`}
          >
            TOP 14 PRONOS
          </h1>
        </div>
        <p
          className={`text-gray-300 font-medium mb-4 transition-all duration-500 ${
            scrolled ? "text-xs" : "text-sm"
          }`}
        >
          Système Elo + Machine Learning
        </p>
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 font-semibold text-lg transition-all duration-500">
          <div className="flex items-center gap-2">
            <span role="img" aria-label="stats">📈</span>
            <span className="text-blue-300">78%</span>
            <span>Précision moyenne</span>
          </div>
          <div className="flex items-center gap-2">
            <span role="img" aria-label="matches">🗃️</span>
            {loadingConfig ? (
              // Loader visuel
              <svg
                className="animate-spin h-5 w-5 text-blue-300"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 01-8 8z"
                ></path>
              </svg>
            ) : (
              <span className="text-blue-300">
                {config?.nombre_matchs_historique?.toLocaleString() || "3600+"}
              </span>
            )}
            <span>Matchs analysés</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default MainHeader;


