import { useState, useEffect } from 'react';

export function usePushNotifications() {
  const [permission, setPermission] = useState(Notification.permission);
  const [subscription, setSubscription] = useState(null);

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
      const registration = await navigator.serviceWorker.ready;
      
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      
      if (!vapidPublicKey) {
        console.error('❌ VAPID key manquante');
        return null;
      }

      // Vérifier si déjà abonné
      let sub = await registration.pushManager.getSubscription();
      
      if (!sub) {
        // Créer nouvelle subscription
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });
        
        console.log('✅ Subscription créée');
      }

      setSubscription(sub);
      
      // Envoyer au backend
      await fetch('https://top14-api-production.up.railway.app/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub)
      });

      console.log('✅ Subscription enregistrée sur serveur');
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

  // Vérifier subscription au chargement
  useEffect(() => {
    const checkSubscription = async () => {
      if (permission === 'granted' && 'serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();
        
        if (sub) {
          setSubscription(sub);
          console.log('✅ Subscription existante trouvée');
        } else if (permission === 'granted') {
          // Permission granted mais pas de subscription → Créer
          console.log('⚠️ Permission granted mais pas de subscription, création...');
          await subscribeUser();
        }
      }
    };
    
    checkSubscription();
  }, [permission]);

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
    requestPermission,
    subscribeUser,
    isSupported: 'Notification' in window && 'serviceWorker' in navigator
  };
}