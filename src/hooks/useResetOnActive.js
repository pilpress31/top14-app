// src/hooks/useResetOnActive.js
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function useResetOnActive(path, resetFn, scrollTop = false) {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === path) {
      // 🔄 Reset du state
      resetFn();

      // ⬆️ Scroll en haut si demandé
      if (scrollTop) {
        window.scrollTo(0, 0);
      }
    }
  }, [location.pathname, path, resetFn, scrollTop]);
}
