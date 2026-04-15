import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState(Notification.permission);
  const [subscription, setSubscription] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Helper fonction
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return new Uint8Array([...rawData].map(char => char.charCodeAt(0)));
  };

  // Créer subscription
  const subscribeUser = async () => {
    try {
      // Guard : user doit être chargé avant d'envoyer la subscription
      if (!user?.id) {
        console.warn('⚠️ subscribeUser appelé sans user — abandon');
        return null;
      }

      const registration = await navigator.serviceWorker.ready;
      
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      
      if (!vapidPublicKey) {
        console.error('❌ VAPID key manquante');
        return null;
      }

      let sub = await registration.pushManager.getSubscription();
      
      if (!sub) {
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });
        console.log('✅ Subscription créée');
      }

      setSubscription(sub);

      const response = await fetch('https://top14-api-production.up.railway.app/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          subscription: sub,
          userId: user.id
        })
      });

      if (response.ok) {
        console.log('✅ Subscription sauvegardée en base');
        setIsSubscribed(true);
      } else {
        console.error('❌ Erreur sauvegarde:', await response.text());
        setIsSubscribed(false);
      }

      return sub;
      
    } catch (error) {
      console.error('❌ Erreur subscription:', error);
      return null;
    }
  };

  // Demander permission
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.error('❌ Notifications non supportées');
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    
    if (result === 'granted') {
      // ✅ CRÉER AUTOMATIQUEMENT LA SUBSCRIPTION
      await subscribeUser();
      return true;
    }
    
    return false;
  };

  // ✅ Vérifier et renouveler la subscription
  // Dépend de [user] pour éviter la race condition :
  // sur TWA Samsung, permission est déjà 'granted' au montage mais user est encore null
  useEffect(() => {
    const checkAndRenewSubscription = async () => {
      // Attendre que user soit chargé ET que la permission soit accordée
      if (!user?.id || permission !== 'granted' || !('serviceWorker' in navigator)) return;

      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      
      if (sub) {
        setSubscription(sub);
        console.log('✅ Subscription locale trouvée');

        // Vérifier en BDD
        try {
          const { data: subData } = await supabase
            .from('push_subscriptions')
            .select('updated_at')
            .eq('user_id', user.id)
            .eq('endpoint', sub.endpoint)
            .single();

          if (subData) {
            const daysSinceUpdate = (new Date() - new Date(subData.updated_at)) / (1000 * 60 * 60 * 24);
            if (daysSinceUpdate > 30) {
              console.log(`⚠️ Subscription agée de ${Math.round(daysSinceUpdate)} jours — renouvellement...`);
              await subscribeUser();
            } else {
              console.log(`✅ Subscription récente (${Math.round(daysSinceUpdate)} jours)`);
              setIsSubscribed(true);
            }
          } else {
            // Subscription locale mais absente en BDD (cas TWA Samsung après install)
            console.log('⚠️ Subscription absente en BDD → resauvegarde...');
            await subscribeUser();
          }
        } catch (e) {
          console.warn('⚠️ Impossible de vérifier subscription en BDD:', e.message);
        }

      } else {
        // Permission granted mais aucune subscription locale → créer
        console.log('⚠️ Permission granted mais pas de subscription locale → création...');
        await subscribeUser();
      }
    };
    
    checkAndRenewSubscription();
  }, [user, permission]); // ← dépend de user : se relance quand user est disponible

  // Enregistrer Service Worker au chargement
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(reg => console.log('✅ SW enregistré:', reg.scope))
        .catch(err => console.error('❌ SW erreur:', err));
    }
  }, []);

  return {
    permission,
    subscription,
    isSubscribed,
    requestPermission,
    subscribeUser,
    isSupported: 'Notification' in window && 'serviceWorker' in navigator
  };
}