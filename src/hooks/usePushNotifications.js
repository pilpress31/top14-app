import { useState, useEffect } from 'react';

export function usePushNotifications() {
  const [permission, setPermission] = useState(Notification.permission);
  const [subscription, setSubscription] = useState(null);

  // Demander permission
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('Votre navigateur ne supporte pas les notifications');
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    
    if (result === 'granted') {
      await subscribeUser();
    }
    
    return result === 'granted';
  };

  // S'abonner aux push
  const subscribeUser = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Clés VAPID (on les génère après)
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      
      if (!vapidPublicKey) {
        console.warn('VAPID key manquante');
        return;
      }

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      setSubscription(sub);
      
      // Envoyer subscription au backend
      await fetch('https://top14-api-production.up.railway.app/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub)
      });

      return sub;
    } catch (error) {
      console.error('Erreur subscription:', error);
    }
  };

  // Enregistrer Service Worker au chargement
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(reg => console.log('✅ SW enregistré:', reg))
        .catch(err => console.error('❌ SW erreur:', err));
    }
  }, []);

  return {
    permission,
    subscription,
    requestPermission,
    isSupported: 'Notification' in window && 'serviceWorker' in navigator
  };
}

// Helper
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return new Uint8Array([...rawData].map(char => char.charCodeAt(0)));
}