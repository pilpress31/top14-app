// ============================================
// src/pages/PaymentSuccessPage.jsx
// Page dédiée au retour depuis PayPal
// Ne s'affiche que sur /payment/success
// ============================================

import { useEffect, useState } from 'react'
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const API_URL = 'https://api.top14pronos.fr'

export default function PaymentSuccessPage() {
  const { user } = useAuth()
  const [status, setStatus] = useState('loading') // 'loading' | 'success' | 'error'
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token  = params.get('token')
    const saison = params.get('saison')

    if (!token || !saison) {
      // Pas de token → simple annulation PayPal
      window.location.href = '/'
      return
    }

    if (!user) {
      // Attendre que user soit chargé
      return
    }

    capturePayment(token, saison)
  }, [user])

  const capturePayment = async (orderId, saison) => {
    try {
      const res = await fetch(`${API_URL}/api/payments/paypal/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({ order_id: orderId, saison })
      })
      const data = await res.json()

      if (data.success) {
        setStatus('success')
        setTimeout(async () => {
          // Vérifier que l'accès est bien actif avant de rediriger
          const check = await fetch(`${API_URL}/api/user/access-status`, {
            headers: { 'x-user-id': user.id }
          })
          const checkData = await check.json()
          
          window.location.replace('https://app.top14pronos.fr/')
        }, 2000)
      } else {
        throw new Error(data.error || 'Paiement non confirmé')
      }
    } catch (e) {
      setStatus('error')
      setError(e.message)
    }
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-800 mb-3">Paiement confirmé ! 🎉</h1>
          <p className="text-gray-600 mb-2">Votre accès Top 14 Pronos est activé.</p>
          <p className="text-sm text-gray-500">Redirection en cours...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <AlertCircle className="h-20 w-20 text-red-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-800 mb-3">Erreur de confirmation</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500 mb-6">
            Votre paiement a peut-être été effectué. Contactez-nous à{' '}
            <a href="mailto:contact@top14pronos.fr" className="text-rugby-gold underline">
              contact@top14pronos.fr
            </a>
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-rugby-gold text-white font-bold py-3 px-6 rounded-xl"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    )
  }

  // Loading
  return (
    <div className="min-h-screen bg-gradient-to-br from-rugby-gold/10 to-rugby-orange/10 flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-12 w-12 text-rugby-gold animate-spin" />
      <h2 className="text-xl font-bold text-gray-800">Confirmation du paiement...</h2>
      <p className="text-gray-500 text-sm">Ne fermez pas cette page</p>
    </div>
  )
}
