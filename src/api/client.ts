import type { Match, MatchHistorique, EquipeStats, ConfigApp } from '@/types/rugby';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

function getCache<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const entry: CacheEntry<T> = JSON.parse(cached);
    if (Date.now() - entry.timestamp > CACHE_DURATION) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function setCache<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Storage full, ignore
  }
}

async function fetchWithRetry<T>(url: string, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw new Error('Max retries reached');
}

// ---------------------- API FUNCTIONS ----------------------

export async function getPronos(): Promise<Match[]> {
  const cacheKey = 'pronos';
  const cached = getCache<Match[]>(cacheKey);
  if (cached) return cached;

  try {
    // API renvoie { count, pronos }
    const data = await fetchWithRetry<{ count: number; pronos: Match[] }>(`${API_URL}/pronos`);
    console.log("✅ Réponse API getPronos:", data);

    const matches: Match[] = data.pronos;
    setCache(cacheKey, matches);
    return matches;
  } catch (e) {
    console.error("⚠️ Erreur API getPronos:", e);
    // Fallback local : JSON contient aussi { pronos: [...] }
    const data = await fetchWithRetry<{ pronos: Match[] }>('/data/matchs_futurs.json');
    const matches: Match[] = data.pronos;
    setCache(cacheKey, matches);
    return matches;
  }
}

export async function getHistorique(): Promise<MatchHistorique[]> {
  const cacheKey = 'historique';
  const cached = getCache<MatchHistorique[]>(cacheKey);
  if (cached) return cached;

  try {
    const data = await fetchWithRetry<{ historique: any[] }>(`${API_URL}/historique`);
    const matches: MatchHistorique[] = (data.historique || []).map(m => ({
      ...m,
      score_ht: { domicile: m.score_ht_domicile, exterieur: m.score_ht_exterieur },
    }));
    setCache(cacheKey, matches);
    return matches;
  } catch (e) {
    console.error("⚠️ Erreur API getHistorique:", e);
    const data = await fetchWithRetry<{ historique: any[] }>('/data/matchs_historique.json');
    const matches: MatchHistorique[] = (data.historique || []).map(m => ({
      ...m,
      score_ht: { domicile: m.score_ht_domicile, exterieur: m.score_ht_exterieur },
    }));
    setCache(cacheKey, matches);
    return matches;
  }
}

export async function getConfig(): Promise<ConfigApp> {
  const cacheKey = 'config';
  const cached = getCache<ConfigApp>(cacheKey);
  if (cached) return cached;

  try {
    const data = await fetchWithRetry<ConfigApp>(`${API_URL}/config`);
    setCache(cacheKey, data);
    return data;
  } catch (e) {
    console.error("⚠️ Erreur API getConfig:", e);
    const data = await fetchWithRetry<ConfigApp>('/data/config_app.json');
    setCache(cacheKey, data);
    return data;
  }
}

export async function getClassement(): Promise<EquipeStats[]> {
  const cacheKey = 'classement';
  const cached = getCache<EquipeStats[]>(cacheKey);
  if (cached) return cached;

  try {
    const data = await fetchWithRetry<{ classement: EquipeStats[] }>(`${API_URL}/classement`);
    const classement: EquipeStats[] = data.classement || [];
    setCache(cacheKey, classement);
    return classement;
  } catch (e) {
    console.error("⚠️ Erreur API getClassement:", e);
    const data = await fetchWithRetry<EquipeStats[]>('/data/equipes_stats.json');
    setCache(cacheKey, data);
    return data;
  }
}
