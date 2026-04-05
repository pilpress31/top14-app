// ============================================
// src/pages/PaywallPage.jsx
// Page affichée quand l'accès est expiré
// ============================================

import { useState, useEffect } from 'react'
import { Lock, CheckCircle, Mail, ChevronRight, Loader2, Shield } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const API_URL = 'https://top14-api-production.up.railway.app'

export default function PaywallPage({ tarif, onPaymentSuccess }) {
  const { user, signOut } = useAuth()
  const [step, setStep]         = useState('info')   // 'info' | 'paying' | 'success'
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [paypalReady, setPaypalReady] = useState(false)
  const [config, setConfig]     = useState(null)

  // ── Charger la config PayPal ──
  useEffect(() => {
    const loadPaypalConfig = async () => {
      try {
        const res = await fetch(`${API_URL}/api/payments/paypal/config`, {
          headers: { 'x-user-id': user?.id }
        })
        const data = await res.json()
        if (data.client_id) {
          setConfig(data)
          loadPaypalSDK(data.client_id)
        }
      } catch (e) {
        console.error('Erreur config PayPal:', e)
      }
    }
    if (user) loadPaypalConfig()
  }, [user])

  const loadPaypalSDK = (clientId) => {
    if (document.getElementById('paypal-sdk')) {
      setPaypalReady(true)
      return
    }
    const script = document.createElement('script')
    script.id  = 'paypal-sdk'
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=EUR&locale=fr_FR`
    script.onload = () => setPaypalReady(true)
    document.body.appendChild(script)
  }

  // ── Lancer le paiement ──
  const handlePay = async () => {
    setLoading(true)
    setError('')

    try {
      // 1. Créer l'ordre PayPal côté serveur
      const res = await fetch(`${API_URL}/api/payments/paypal/create-order`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id':    user.id
        }
      })
      const order = await res.json()

      if (!order.success || !order.approval_url) {
        throw new Error(order.error || 'Erreur création paiement')
      }

      

      // 3. Rediriger vers PayPal
      window.location.href = order.approval_url

    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  // ── Gérer le retour depuis PayPal (success) ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token  = params.get('token')
    const saison = params.get('saison')

    if (token && saison) {
      capturePayment(token, saison)
    }
  }, [])

  const capturePayment = async (orderId, saison) => {
    setStep('paying')
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/api/payments/paypal/capture`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id':    user.id
        },
        body: JSON.stringify({ order_id: orderId, saison })
      })
      const data = await res.json()

      if (data.success) {
        window.history.replaceState({}, '', window.location.pathname)
        setStep('success')
        // Attendre 2s puis recharger proprement
        setTimeout(() => {
          // Vider tout le cache du SW puis recharger
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' })
          }
          window.location.replace('/')
        }, 2000)
      } else {
        throw new Error(data.error || 'Paiement non confirmé')
      }
    } catch (e) {
      setError(e.message)
      setStep('info')
    } finally {
      setLoading(false)
    }
  }

  // ── Rendu : succès ──
  if (step === 'success') {
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

  // ── Rendu : capture en cours ──
  if (step === 'paying') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rugby-gold/10 to-rugby-orange/10 flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <Loader2 className="h-12 w-12 text-rugby-gold mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Confirmation du paiement...</h2>
          <p className="text-gray-500 text-sm">Ne fermez pas cette page</p>
        </div>
      </div>
    )
  }

  // ── Rendu principal ──
  const montant   = tarif?.prix ?? '—'
  const labelTarif = tarif?.label ?? ''
  const reduction = tarif?.reduction ?? 0
  const prixBase  = tarif?.prix_base ?? 4.99

  return (
    <div className="min-h-screen bg-gradient-to-br from-rugby-gold/10 to-rugby-orange/10 flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-rugby-gold mb-1">🏉 Top 14 Pronos</h1>
          <p className="text-gray-500 text-sm">Votre accès a expiré</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">

          {/* Header */}
          <div className="bg-rugby-gold p-6 text-center">
            <Lock className="h-10 w-10 text-white mx-auto mb-3" />
            <h2 className="text-xl font-bold text-white mb-1">Accès expiré</h2>
            <p className="text-white text-sm">
              Continuez à profiter de tous les pronostics rugby
            </p>
          </div>

          <div className="p-6">

            {/* Tarif */}
            <div className="bg-rugby-gold/10 border-2 border-rugby-gold rounded-xl p-5 mb-6 text-center">
              {reduction > 0 && (
                <div className="inline-block bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full mb-2">
                  -{reduction}%
                </div>
              )}
              <div className="flex items-baseline justify-center gap-1 mb-1">
                <span className="text-4xl font-black text-rugby-gold">{montant}€</span>
                <span className="text-gray-500 text-sm">/saison</span>
              </div>
              {reduction > 0 && (
                <p className="text-gray-400 text-xs line-through mb-1">{prixBase}€ tarif normal</p>
              )}
              <p className="text-gray-600 text-xs">{labelTarif}</p>
            </div>

            {/* Fonctionnalités incluses */}
            <div className="space-y-3 mb-6">
              {[
                'Pronostics algorithmiques pour chaque match',
                'Vos pronostics personnels + classement',
                'Paris virtuels avec jetons',
                'Actualités IA et compositions probables',
                'Accès toute la saison Top 14',
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            {/* Erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
                ❌ {error}
              </div>
            )}

            {/* Bouton PayPal */}
            <button
              onClick={handlePay}
              disabled={loading || !paypalReady}
              className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mb-3"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <img
                    src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png"
                    alt="PayPal"
                    className="h-5 object-contain"
                  />
                  <span>Payer {montant}€ avec PayPal</span>
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>

            {/* Contact */}
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-2">
                Paiement sécurisé — Accès immédiat après confirmation
              </p>
              <a
                href="mailto:pilpress31@gmail.com"
                className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-rugby-gold transition-colors"
              >
                <Mail className="h-3 w-3" />
                Un problème ? Contactez-nous
              </a>
            </div>
          </div>

          {/* Footer sécurité */}
          <div className="px-6 pb-6">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <Shield className="h-3 w-3" />
              <span>Paiement sécurisé via PayPal — Sans abonnement automatique</span>
            </div>
          </div>
        </div>

        {/* Déconnexion */}
        <div className="text-center mt-4">
          <button
            onClick={signOut}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Se déconnecter
          </button>
        </div>

      </div>
    </div>
  )
}
