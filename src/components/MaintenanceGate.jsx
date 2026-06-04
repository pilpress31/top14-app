// ============================================================
// MaintenanceGate.jsx — verrou de maintenance, à englober tout le rendu.
//
// Comportement :
//   • npm run dev (import.meta.env.DEV) → JAMAIS de maintenance (local libre).
//   • Prod → lit le flag depuis Supabase (table app_config, clé 'maintenance').
//     Lecture DIRECTE Supabase (pas via l'API Railway) → la page maintenance
//     marche même si l'API est down pendant la maintenance.
//   • Re-check toutes les 30 s → la maintenance se lève sans reload manuel.
//   • Fail-open : si la lecture échoue, on n'enferme personne (on rend l'app).
//
// Overrides (utiles à toi) :
//   • ?bypass=1  → admin : accéder à la vraie prod MALGRÉ la maintenance
//                  (mémorisé en localStorage ; ?bypass=0 pour annuler).
//   • ?maint=1   → forcer l'aperçu LOCAL de la page maintenance (test visuel).
// ============================================================

import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient"; // ⚠️ ajuste si ton client est ailleurs / export différent
import MaintenancePage from "./MaintenancePage";

function readBypass() {
  try {
    const p = new URL(window.location.href).searchParams;
    if (p.get("bypass") === "1") localStorage.setItem("maint_bypass", "1");
    if (p.get("bypass") === "0") localStorage.removeItem("maint_bypass");
    return localStorage.getItem("maint_bypass") === "1";
  } catch {
    return false;
  }
}

function previewForced() {
  try {
    return new URL(window.location.href).searchParams.get("maint") === "1";
  } catch {
    return false;
  }
}

export default function MaintenanceGate({ children }) {
  const isDev = import.meta.env.DEV;
  const preview = previewForced();

  const [enabled, setEnabled] = useState(preview);
  const [message, setMessage] = useState(
    preview ? "Aperçu local de la page maintenance." : null
  );

  useEffect(() => {
    if (preview) return;          // ?maint=1 : on force l'aperçu, pas de check
    if (isDev) return;            // dev : jamais de maintenance
    if (readBypass()) return;     // admin : accès prod malgré la maintenance

    let alive = true;
    const check = async () => {
      try {
        const { data, error } = await supabase
          .from("app_config")
          .select("value")
          .eq("key", "maintenance")
          .single();
        if (error) throw error;
        const v = data?.value || {};
        if (alive) {
          setEnabled(!!v.enabled);
          setMessage(v.message || null);
        }
      } catch {
        if (alive) setEnabled(false); // fail-open
      }
    };

    check();
    const id = setInterval(check, 30000); // re-check : lève la maintenance sans reload
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [isDev, preview]);

  if (enabled) return <MaintenancePage message={message} />;
  return children;
}
