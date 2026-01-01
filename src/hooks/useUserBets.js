import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function useUserBets() {
  const { user } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;

    async function load() {
      try {
        setLoading(true);

        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/user/bets/v2`,
          {
            headers: {
              "x-user-id": user.id
            }
          }
        );

        if (!res.ok) {
          throw new Error("Erreur API");
        }

        const json = await res.json();
        console.log("API JSON =", json);


        setTransactions(json.transactions || []);
        setBets(json.bets || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user]);

  return { transactions, bets, loading, error };
}
