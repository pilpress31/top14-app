// ============================================
// src/hooks/useAccessControl.js
// Hook de contrôle d'accès
// ============================================

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'

const API_URL = 'https://api.top14pronos.fr'

export function useAccessControl() {
  const { user } = useAuth()
  const [accessStatus, setAccessStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  const checkAccess = useCallback(async () => {
    if (!user) {
      setAccessStatus(null)
      setLoading(false)
      return
    }

    setLoading(true) // ← forcer loading=true au début de chaque appel

    try {
      const response = await fetch(`${API_URL}/api/user/access-status`, {
        headers: { 'x-user-id': user.id }
      })
      const data = await response.json()
      setAccessStatus(data)
    } catch (error) {
      console.error('Erreur vérification accès:', error)
      setAccessStatus({ status: 'active', tier: 'unknown' })
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    checkAccess()
  }, [checkAccess])

  // Recalculer au retour au premier plan
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') checkAccess()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    // Détecter le retour post-paiement via localStorage
    const handleStorage = () => {
      if (localStorage.getItem('payment_just_completed') === 'true') {
        localStorage.removeItem('payment_just_completed')
        checkAccess()
      }
    }
    window.addEventListener('storage', handleStorage)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('storage', handleStorage)
    }
  }, [checkAccess])

  const isActive       = accessStatus?.status === 'active' || accessStatus?.status === 'expiring_soon'
  const isExpired      = accessStatus?.status === 'expired'
  const isExpiringSoon = accessStatus?.status === 'expiring_soon'
  const isBeta         = accessStatus?.tier === 'beta'
  const joursRestants  = accessStatus?.jours_restants ?? null
  const tarif          = accessStatus?.tarif ?? null

  return {
    loading,
    accessStatus,
    isActive,
    isExpired,
    isExpiringSoon,
    isBeta,
    joursRestants,
    tarif,
    refresh: checkAccess
  }
}
