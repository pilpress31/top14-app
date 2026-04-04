// ============================================
// src/hooks/useAccessControl.js
// Hook de contrôle d'accès
// À importer dans App.jsx ou AuthContext
// ============================================

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'

const API_URL = 'https://top14-api-production.up.railway.app'

export function useAccessControl() {
  const { user } = useAuth()
  const [accessStatus, setAccessStatus] = useState(null)  // null = chargement
  const [loading, setLoading] = useState(true)

  const checkAccess = useCallback(async () => {
    if (!user) {
      setAccessStatus(null)
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/user/access-status`, {
        headers: { 'x-user-id': user.id }
      })
      const data = await response.json()
      setAccessStatus(data)
    } catch (error) {
      console.error('Erreur vérification accès:', error)
      // En cas d'erreur réseau → ne pas bloquer l'accès
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
    return () => document.removeEventListener('visibilitychange', handleVisibility)
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
