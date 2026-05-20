// ============================================================
// StatsAlgoModal.jsx
// Popup réutilisable affiché au clic sur les rectangles de stats
// des 3 MainHeaders (Top 14, Pro D2, Champions Cup).
// ============================================================
// Affiche :
//   1. Les 2 stats globales (% précision moyenne + nb matchs analysés)
//   2. Les stats algo de la dernière journée/round résolu (% FT uniquement)
//   3. Un bouton vers la page de paris du championnat concerné
//
// Props :
//   - open          : bool      — état d'ouverture
//   - onClose       : function  — callback de fermeture
//   - championnat   : 'top14' | 'prod2' | 'hcup'
//   - theme         : { primary, accent, onPrimary } — couleurs de charte
//   - globalStats   : { precision, total } — stats déjà chargées par le header
//   - apiBase       : string    — base URL de l'API
// ============================================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Métadonnées par championnat (label + endpoint + libellé "journée")
const CHAMP_META = {
  top14: {
    label: "Top 14",
    endpoint: "/api/stats-algo-derniere-journee",
    journeeWord: "journée",
    journeePrefix: "J",
  },
  prod2: {
    label: "Pro D2",
    endpoint: "/api/d2/stats-algo-derniere-journee",
    journeeWord: "journée",
    journeePrefix: "J",
  },
  hcup: {
    label: "Champions Cup",
    endpoint: "/api/hcup/stats-algo-derniere-journee",
    journeeWord: "round",
    journeePrefix: "",
  },
};

export default function StatsAlgoModal({
  open,
  onClose,
  championnat = "top14",
  theme = { primary: "#C9A84C", accent: "#FFD700", onPrimary: "#FFFFFF" },
  globalStats = { precision: 0, total: 0 },
  apiBase = "https://top14-api-production.up.railway.app",
}) {
  const navigate = useNavigate();
  const meta = CHAMP_META[championnat] || CHAMP_META.top14;

  const [derniere, setDerniere] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Charge les stats de la dernière journée à l'ouverture du popup
  useEffect(() => {
    if (!open) return;
    let annule = false;

    async function loadDerniere() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${apiBase}${meta.endpoint}`);
        const data = await res.json();
        if (annule) return;
        if (data.error) {
          setError(data.error);
          setDerniere(null);
        } else {
          setDerniere(data);
        }
      } catch (e) {
        if (!annule) {
          setError("Impossible de charger les statistiques");
          setDerniere(null);
        }
      } finally {
        if (!annule) setLoading(false);
      }
    }

    loadDerniere();
    return () => { annule = true; };
  }, [open, meta.endpoint, apiBase]);

  // Fermeture sur touche Échap
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Bloque le scroll de la page en arrière-plan quand le popup est ouvert
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  if (!open) return null;

  // Libellé de la journée/round affichée
  const journeeLabel = derniere
    ? `${meta.journeePrefix}${derniere.journee}`
    : "—";

  // Redirection vers la page de paris du championnat
  const allerAuxParis = () => {
    onClose();
    navigate("/pronos", { state: { championnat } });
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        animation: "statsModalFadeIn 0.18s ease-out",
      }}
    >
      {/* Carte du popup — stopPropagation pour ne pas fermer au clic interne */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "380px",
          background: "linear-gradient(160deg, #FFFFFF 0%, #FAFAFA 100%)",
          borderRadius: "20px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
          overflow: "hidden",
          animation: "statsModalSlideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Bandeau d'en-tête coloré (charte du championnat) */}
        <div
          style={{
            background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primary}dd 100%)`,
            padding: "20px 22px 18px",
            color: theme.onPrimary,
          }}
        >
          {/* Croix de fermeture */}
          <button
            onClick={onClose}
            aria-label="Fermer"
            style={{
              position: "absolute",
              top: "14px",
              right: "14px",
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              border: "none",
              background: "rgba(255,255,255,0.22)",
              color: theme.onPrimary,
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.38)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.22)")}
          >
            ✕
          </button>

          <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1.5px", opacity: 0.85 }}>
            Statistiques de l'algorithme
          </div>
          <div style={{ fontSize: "20px", fontWeight: 800, marginTop: "3px", letterSpacing: "0.5px" }}>
            {meta.label}
          </div>
        </div>

        {/* Corps du popup */}
        <div style={{ padding: "20px 22px 22px" }}>

          {/* ── Bloc 1 : Stats globales ───────────────────────── */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "18px" }}>
            <div style={statBoxStyle(theme)}>
              <div style={statValueStyle(theme)}>
                {globalStats.precision > 0 ? `${globalStats.precision}%` : "—"}
              </div>
              <div style={statLabelStyle}>Précision moyenne</div>
            </div>
            <div style={statBoxStyle(theme)}>
              <div style={statValueStyle(theme)}>
                {globalStats.total > 0 ? globalStats.total : "—"}
              </div>
              <div style={statLabelStyle}>Matchs analysés</div>
            </div>
          </div>

          {/* ── Bloc 2 : Dernière journée/round ───────────────── */}
          <div
            style={{
              borderTop: "1px solid #ECECEC",
              paddingTop: "16px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#555",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                marginBottom: "12px",
              }}
            >
              📊 Dernier{meta.journeeWord === "round" ? " round" : "e journée"} {journeeLabel !== "—" ? `— ${journeeLabel}` : ""}
            </div>

            {loading && (
              <div style={{ textAlign: "center", color: "#999", fontSize: "13px", padding: "16px 0" }}>
                ⏳ Chargement des statistiques…
              </div>
            )}

            {error && !loading && (
              <div style={{ textAlign: "center", color: "#B0833A", fontSize: "13px", padding: "12px 0" }}>
                {error}
              </div>
            )}

            {derniere && !loading && (
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={resultBoxStyle("#2EA043")}>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: "#2EA043" }}>
                    {derniere.pct_ft != null ? `${derniere.pct_ft}%` : "—"}
                  </div>
                  <div style={statLabelStyle}>Pronostics réussis</div>
                </div>
                <div style={resultBoxStyle(theme.primary)}>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: theme.primary }}>
                    {derniere.total_ft != null ? `${derniere.corrects_ft}/${derniere.total_ft}` : "—"}
                  </div>
                  <div style={statLabelStyle}>Matchs corrects</div>
                </div>
              </div>
            )}
          </div>

          {/* ── Bouton vers la page de paris ──────────────────── */}
          <button
            onClick={allerAuxParis}
            style={{
              width: "100%",
              marginTop: "20px",
              padding: "13px",
              borderRadius: "12px",
              border: "none",
              background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primary}cc 100%)`,
              color: theme.onPrimary,
              fontSize: "14px",
              fontWeight: 700,
              letterSpacing: "0.3px",
              cursor: "pointer",
              boxShadow: `0 6px 16px ${theme.primary}55`,
              transition: "transform 0.12s, box-shadow 0.12s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = `0 8px 20px ${theme.primary}77`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = `0 6px 16px ${theme.primary}55`;
            }}
          >
            🎯 Faire mes pronostics {meta.label} →
          </button>
        </div>
      </div>

      {/* Animations CSS injectées localement */}
      <style>{`
        @keyframes statsModalFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes statsModalSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

// ── Styles partagés ──────────────────────────────────────────
function statBoxStyle(theme) {
  return {
    flex: 1,
    background: "#F7F7F7",
    border: "1px solid #ECECEC",
    borderRadius: "12px",
    padding: "14px 10px",
    textAlign: "center",
  };
}

function statValueStyle(theme) {
  return {
    fontSize: "22px",
    fontWeight: 800,
    color: theme.primary,
  };
}

function resultBoxStyle(color) {
  return {
    flex: 1,
    background: `${color}0F`,
    border: `1px solid ${color}33`,
    borderRadius: "12px",
    padding: "14px 10px",
    textAlign: "center",
  };
}

const statLabelStyle = {
  fontSize: "10px",
  color: "#888",
  marginTop: "4px",
  textTransform: "uppercase",
  letterSpacing: "0.4px",
};
