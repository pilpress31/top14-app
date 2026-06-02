import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

// Options d'auth explicites : indispensables en PWA installée (iOS/Android)
// pour que la session soit persistée ET rattachée à TOUTES les requêtes,
// y compris Storage. Sans ça, l'upload peut partir en `anon` → RLS refuse.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'sb-vgzazzcyvyqqjketmspv-auth-token',
  },
})
