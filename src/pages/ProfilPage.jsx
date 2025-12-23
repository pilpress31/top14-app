import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Edit2, Save, X, Trash2, AlertCircle, CheckCircle, ArrowLeft, AtSign, Loader2, Camera, Upload } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import axios from 'axios'

function ProfilPage() {
  const { user, updateProfile, deleteAccount, signOut } = useAuth()
  const navigate = useNavigate()
  
  const [editMode, setEditMode] = useState(false)
  const [nom, setNom] = useState(user?.user_metadata?.nom || '')
  const [prenom, setPrenom] = useState(user?.user_metadata?.prenom || '')
  const [pseudo, setPseudo] = useState(user?.user_metadata?.pseudo || '')
  const [originalPseudo, setOriginalPseudo] = useState(user?.user_metadata?.pseudo || '')
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || '')
  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [accountDeleted, setAccountDeleted] = useState(false)
  const [checkingPseudo, setCheckingPseudo] = useState(false)
  const [pseudoAvailable, setPseudoAvailable] = useState(null)
  const [pseudoError, setPseudoError] = useState('')

  // Charger avatar depuis Supabase
  useEffect(() => {
    loadAvatar()
  }, [user])

  const loadAvatar = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('avatar_url')
        .eq('user_id', user.id)
        .single()

      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url)
      }
    } catch (error) {
      console.log('Pas d\'avatar trouvé')
    }
  }

  const uploadAvatar = async (event) => {
    try {
      setUploadingAvatar(true)
      setError('')

      const file = event.target.files?.[0]
      if (!file) return

      // Vérifier taille (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('L\'image ne doit pas dépasser 2 MB')
        setUploadingAvatar(false)
        return
      }

      // Vérifier type
      if (!file.type.startsWith('image/')) {
        setError('Le fichier doit être une image')
        setUploadingAvatar(false)
        return
      }

      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}/avatar.${fileExt}`

      // Upload vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Récupérer URL publique
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const newAvatarUrl = urlData.publicUrl

      // Mettre à jour user_profiles
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('user_id', user.id)

      if (updateError) throw updateError

      // Mettre à jour auth.users metadata
      await updateProfile({ avatar_url: newAvatarUrl })

      setAvatarUrl(newAvatarUrl)
      setSuccess('Avatar mis à jour avec succès !')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Erreur upload avatar:', error)
      setError('Erreur lors de l\'upload de l\'avatar')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const deleteAvatar = async () => {
    try {
      setUploadingAvatar(true)
      setError('')

      // Supprimer de Storage
      const filePath = avatarUrl.split('/').slice(-2).join('/')
      await supabase.storage.from('avatars').remove([filePath])

      // Mettre à jour user_profiles
      await supabase
        .from('user_profiles')
        .update({ avatar_url: null })
        .eq('user_id', user.id)

      // Mettre à jour metadata
      await updateProfile({ avatar_url: null })

      setAvatarUrl('')
      setSuccess('Avatar supprimé avec succès !')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Erreur suppression avatar:', error)
      setError('Erreur lors de la suppression')
    } finally {
      setUploadingAvatar(false)
    }
  }

  // Vérifier pseudo en temps réel si modifié
  useEffect(() => {
    if (!editMode || !pseudo || pseudo === originalPseudo) {
      setPseudoAvailable(null)
      setPseudoError('')
      return
    }

    if (pseudo.length < 4) {
      setPseudoAvailable(false)
      setPseudoError('Le pseudo doit contenir au moins 4 caractères')
      return
    }

    const timer = setTimeout(async () => {
      await checkPseudoAvailability(pseudo)
    }, 500)

    return () => clearTimeout(timer)
  }, [pseudo, editMode, originalPseudo])

  const checkPseudoAvailability = async (pseudoToCheck) => {
    setCheckingPseudo(true)
    setPseudoError('')

    try {
      const response = await axios.get(
        `https://top14-api.vercel.app/api/check-pseudo/${pseudoToCheck}`
      )
      
      if (response.data.available) {
        setPseudoAvailable(true)
        setPseudoError('')
      } else {
        setPseudoAvailable(false)
        setPseudoError(response.data.reason || 'Ce pseudo n\'est pas disponible')
      }
    } catch (error) {
      console.error('Erreur vérification pseudo:', error)
      setPseudoAvailable(null)
      setPseudoError('Erreur lors de la vérification')
    } finally {
      setCheckingPseudo(false)
    }
  }

  const validatePseudo = (value) => {
    const validPattern = /^[a-zA-Z0-9_-]+$/
    
    if (value.length < 4) {
      return 'Le pseudo doit contenir au moins 4 caractères'
    }
    if (value.length > 20) {
      return 'Le pseudo ne peut pas dépasser 20 caractères'
    }
    if (!validPattern.test(value)) {
      return 'Le pseudo ne peut contenir que des lettres, chiffres, _ et -'
    }
    return null
  }

  const handlePseudoChange = (e) => {
    const value = e.target.value
    setPseudo(value)
    
    const validationError = validatePseudo(value)
    if (validationError) {
      setPseudoError(validationError)
      setPseudoAvailable(false)
    } else if (value === originalPseudo) {
      setPseudoError('')
      setPseudoAvailable(null)
    } else {
      setPseudoError('')
    }
  }

  const handleSaveProfile = async () => {
    setError('')
    setSuccess('')
    setLoading(true)

    const pseudoValidation = validatePseudo(pseudo)
    if (pseudoValidation) {
      setError(pseudoValidation)
      setLoading(false)
      return
    }

    // Si pseudo modifié, vérifier disponibilité
    if (pseudo !== originalPseudo && pseudoAvailable !== true) {
      setError('Le pseudo choisi n\'est pas disponible')
      setLoading(false)
      return
    }

    try {
      // Mettre à jour le pseudo via API si modifié
      if (pseudo !== originalPseudo) {
        await axios.put(
          `https://top14-api.vercel.app/api/user-profiles/${user.id}/pseudo`,
          { pseudo }
        )
      }

      // Mettre à jour le reste dans user_metadata
      const { data, error } = await updateProfile({
        nom,
        prenom,
        pseudo,
        nom_complet: `${prenom} ${nom}`
      })

      if (error) {
        setError('Erreur lors de la mise à jour')
      } else {
        setSuccess('Profil mis à jour avec succès !')
        setOriginalPseudo(pseudo)
        setEditMode(false)
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (apiError) {
      console.error('Erreur API:', apiError)
      if (apiError.response?.status === 409) {
        setError('Ce pseudo est déjà utilisé')
      } else {
        setError('Erreur lors de la mise à jour')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setLoading(true)
    const { error } = await deleteAccount()
    
    if (error) {
      setError('Erreur lors de la suppression du compte')
      setLoading(false)
    } else {
      setAccountDeleted(true)
      setLoading(false)
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    }
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Vous devez être connecté pour accéder à cette page</p>
      </div>
    )
  }

  if (accountDeleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rugby-gold/10 to-rugby-orange/10 p-6">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Compte supprimé avec succès</h2>
          <p className="text-gray-600 mb-4">
            Votre compte et toutes vos données ont été définitivement supprimés.
          </p>
          <p className="text-sm text-gray-500">
            Redirection vers la page de connexion...
          </p>
          <div className="mt-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rugby-gold mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 pb-24 max-w-2xl mx-auto">
      {/* Bouton retour */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-rugby-gold hover:text-rugby-orange mb-4 transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
        <span className="text-sm font-semibold">Retour</span>
      </button>

      <h1 className="text-3xl font-bold text-rugby-gold mb-6">Mon Compte</h1>

      {/* Avatar */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Photo de profil</h2>
        
        <div className="flex items-center gap-6">
          {/* Avatar actuel */}
          <div className="relative">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt="Avatar" 
                className="w-24 h-24 rounded-full object-cover border-4 border-rugby-gold"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rugby-gold to-rugby-bronze flex items-center justify-center text-white text-3xl font-bold">
                {pseudo?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
            {uploadingAvatar && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </div>

          {/* Boutons */}
          <div className="flex flex-col gap-2">
            <label className="cursor-pointer">
              <div className="flex items-center gap-2 bg-rugby-gold hover:bg-rugby-orange text-white font-semibold px-4 py-2 rounded-lg transition-colors">
                <Upload className="w-4 h-4" />
                {avatarUrl ? 'Changer' : 'Ajouter'}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={uploadAvatar}
                disabled={uploadingAvatar}
                className="hidden"
              />
            </label>
            
            {avatarUrl && (
              <button
                onClick={deleteAvatar}
                disabled={uploadingAvatar}
                className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </button>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-3">
          Format: JPG, PNG • Taille max: 2 MB
        </p>
      </div>

      {/* Informations du profil */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Informations personnelles</h2>
          {!editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="flex items-center gap-2 text-rugby-gold hover:text-rugby-orange transition-colors"
            >
              <Edit2 className="h-4 w-4" />
              <span className="text-sm font-semibold">Modifier</span>
            </button>
          )}
        </div>

        {editMode ? (
          <div className="space-y-4">
            {/* Pseudo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pseudo <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <AtSign className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={pseudo}
                  onChange={handlePseudoChange}
                  className={`w-full pl-10 pr-10 px-4 py-2 border rounded-lg focus:ring-2 transition-colors ${
                    pseudo !== originalPseudo && pseudoAvailable === true
                      ? 'border-green-500 focus:ring-green-500'
                      : pseudo !== originalPseudo && pseudoAvailable === false
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-rugby-gold'
                  }`}
                  disabled={loading}
                  placeholder="Au moins 4 caractères"
                  maxLength={20}
                />
                {/* Indicateur */}
                <div className="absolute right-3 top-2.5">
                  {checkingPseudo && <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />}
                  {!checkingPseudo && pseudo !== originalPseudo && pseudoAvailable === true && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {!checkingPseudo && pseudo !== originalPseudo && pseudoAvailable === false && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                4-20 caractères (lettres, chiffres, _ -)
              </p>
              {pseudoError && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {pseudoError}
                </p>
              )}
              {pseudo !== originalPseudo && pseudoAvailable === true && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Ce pseudo est disponible !
                </p>
              )}
            </div>

            {/* Prénom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
              <input
                type="text"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rugby-gold focus:border-transparent"
                disabled={loading}
              />
            </div>

            {/* Nom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rugby-gold focus:border-transparent"
                disabled={loading}
              />
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSaveProfile}
                disabled={loading || checkingPseudo || (pseudo !== originalPseudo && pseudoAvailable !== true)}
                className="flex-1 flex items-center justify-center gap-2 bg-rugby-gold hover:bg-rugby-orange text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
              <button
                onClick={() => {
                  setEditMode(false)
                  setNom(user?.user_metadata?.nom || '')
                  setPrenom(user?.user_metadata?.prenom || '')
                  setPseudo(user?.user_metadata?.pseudo || '')
                  setError('')
                  setPseudoError('')
                }}
                disabled={loading}
                className="px-6 flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 py-3 border-b border-gray-100">
              <AtSign className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Pseudo</p>
                <p className="font-semibold text-gray-800">
                  {user.user_metadata?.pseudo || 'Non renseigné'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 py-3 border-b border-gray-100">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Nom complet</p>
                <p className="font-semibold text-gray-800">
                  {user.user_metadata?.nom_complet || 'Non renseigné'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 py-3 border-b border-gray-100">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="font-semibold text-gray-800">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}
      </div>

      {/* Actions du compte */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Actions</h2>
        
        {/* Déconnexion */}
        <button
          onClick={handleLogout}
          className="w-full mb-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition-colors"
        >
          Se déconnecter
        </button>

        {/* Suppression du compte */}
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-3 rounded-lg transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer mon compte
          </button>
        ) : (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800 font-semibold mb-3">
              ⚠️ Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAccount}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Suppression...' : 'Oui, supprimer'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-lg transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProfilPage
