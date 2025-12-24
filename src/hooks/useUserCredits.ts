// ============================================
// HOOK : Gestion des jetons utilisateur
// Fichier : src/hooks/useUserCredits.ts
// ============================================

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import axios from 'axios';

interface UserCredits {
  credits: number;
  total_earned: number;
  total_spent: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useUserCredits(): UserCredits {
  const [credits, setCredits] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCredits = async () => {
    try {
      setLoading(true);
      setError(null);

      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const response = await axios.get(
        'https://top14-api-production.up.railway.app/api/user/credits',
        {
          headers: {
            'x-user-id': user.id
          }
        }
      );

      const data = response.data;
      setCredits(data.credits || 0);
      setTotalEarned(data.total_earned || 0);
      setTotalSpent(data.total_spent || 0);

    } catch (err: any) {
      console.error('Error fetching credits:', err);
      setError(err.message || 'Failed to fetch credits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, []);

  return {
    credits,
    total_earned: totalEarned,
    total_spent: totalSpent,
    loading,
    error,
    refresh: fetchCredits
  };
}
