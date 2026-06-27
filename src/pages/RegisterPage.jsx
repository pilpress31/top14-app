import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { Mail, Lock, User, AlertCircle, CheckCircle, AtSign, Loader2, Ticket } from 'lucide-react'
import axios from 'axios'

const API_URL = 'https://api.top14pronos.fr'

function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [pseudo, setPseudo] = useState('')
  const [invitationCode, setInvitationCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  // Pseudo
  const [checkingPseudo, setCheckingPseudo] = useState(false)
  const [pseudoAvailable, setPseudoAvailable] = useState(null)
  const [pseudoError, setPseudoError] = useState('')

  // Code d'invitation
  const [checkingCode, setCheckingCode] = useState(false)
  const [codeValid, setCodeValid] = useState(null)
  const [codeMessage, setCodeMessage] = useState('')

  // ── Parrainage : lien ?ref=<token> ──
  const [searchParams] = useSearchParams()
  const refToken = searchParams.get('ref') || ''
  // null = pas vérifié ; true/false = résultat ; objet pour le pseudo du parrain
  const [parrainageValide, setParrainageValide] = useState(false)
  const [pseudoParrain, setPseudoParrain] = useState('')

  const { signUp } = useAuth()
  const navigate = useNavigate()

  // ── Vérification du token de parrainage (?ref=) au chargement ──
  useEffect(() => {
    if (!refToken) return
    let annule = false
    ;(async () => {
      try {
        const res = await axios.get(`${API_URL}/api/referral/check`, {
          params: { ref: refToken },
        })
        if (annule) return
        if (res.data?.valid) {
          setParrainageValide(true)
          setPseudoParrain(res.data.pseudo_parrain || '')
        } else {
          setParrainageValide(false)
        }
      } catch {
        if (!annule) setParrainageValide(false)
      }
    })()
    return () => { annule = true }
  }, [refToken])

  // ── Vérification pseudo en temps réel (debounced) ──
  useEffect(() => {
    if (!pseudo || pseudo.length < 4) {
      setPseudoAvailable(null)
      setPseudoError('')
      return
    }
    const timer = setTimeout(() => checkPseudoAvailability(pseudo), 500)
    return () => clearTimeout(timer)
  }, [pseudo])

  const checkPseudoAvailability = async (pseudoToCheck) => {
    setCheckingPseudo(true)
    setPseudoError('')
    try {
      const response = await axios.get(`${API_URL}/api/check-pseudo/${pseudoToCheck}`)
      if (response.data.available) {
        setPseudoAvailable(true)
        setPseudoError('')
      } else {
        setPseudoAvailable(false)
        setPseudoError(response.data.reason || 'Ce pseudo n\'est pas disponible')
      }
    } catch {
      setPseudoAvailable(null)
      setPseudoError('Erreur lors de la vérification')
    } finally {
      setCheckingPseudo(false)
    }
  }

  // ── Vérification code d'invitation en temps réel (debounced) ──
  useEffect(() => {
    if (!invitationCode || invitationCode.trim().length < 5) {
      setCodeValid(null)
      setCodeMessage('')
      return
    }
    const timer = setTimeout(() => checkInvitationCode(invitationCode), 600)
    return () => clearTimeout(timer)
  }, [invitationCode])

  const checkInvitationCode = async (code) => {
    setCheckingCode(true)
    setCodeMessage('')
    try {
      const response = await axios.post(`${API_URL}/api/invitations/validate`, {
        code: code.trim().toUpperCase()
      })
      setCodeValid(response.data.valid)
      setCodeMessage(response.data.message || '')
    } catch {
      setCodeValid(false)
      setCodeMessage('Erreur lors de la vérification du code')
    } finally {
      setCheckingCode(false)
    }
  }

  const validatePseudo = (value) => {
    const validPattern = /^[a-zA-Z0-9_-]+$/
    if (value.length < 4) return 'Le pseudo doit contenir au moins 4 caractères'
    if (value.length > 20) return 'Le pseudo ne peut pas dépasser 20 caractères'
    if (!validPattern.test(value)) return 'Le pseudo ne peut contenir que des lettres, chiffres, _ et -'
    return null
  }

  const handlePseudoChange = (e) => {
    const value = e.target.value
    setPseudo(value)
    const validationError = validatePseudo(value)
    if (validationError) {
      setPseudoError(validationError)
      setPseudoAvailable(false)
    } else {
      setPseudoError('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    // Validations
    if (!email || !password || !nom || !prenom || !pseudo || (!invitationCode && !parrainageValide)) {
      setError(parrainageValide
        ? 'Veuillez remplir tous les champs'
        : 'Veuillez remplir tous les champs, y compris le code d\'invitation')
      setLoading(false)
      return
    }

    const pseudoValidation = validatePseudo(pseudo)
    if (pseudoValidation) {
      setError(pseudoValidation)
      setLoading(false)
      return
    }

    if (!pseudoAvailable) {
      setError('Le pseudo choisi n\'est pas disponible')
      setLoading(false)
      return
    }

    if (!parrainageValide && !codeValid) {
      setError('Le code d\'invitation est invalide ou déjà utilisé')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setLoading(false)
      return
    }

    // ── Inscription Supabase ──
    const { data, error: signUpError } = await signUp(email, password, {
      nom,
      prenom,
      pseudo,
      nom_complet: `${prenom} ${nom}`
    })

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        setError('Cette adresse email est déjà utilisée')
      } else if (signUpError.message.toLowerCase().includes('password') || signUpError.message.includes('weak')) {
        setError(
          /at least|caractère|length|short/i.test(signUpError.message)
            ? 'Mot de passe trop court : au moins 8 caractères.'
            : /pwned|leaked|compromis|breach/i.test(signUpError.message)
              ? 'Ce mot de passe est trop courant ou a été divulgué dans une fuite connue. Choisissez-en un autre.'
              : 'Mot de passe refusé : essayez un mélange de majuscules, minuscules et chiffres, 10+ caractères.'
        )
      } else {
        setError(`Erreur : ${signUpError.message}`)
      }
      setLoading(false)
      return
    }

    const userId = data.user.id

    // ── Créer le profil ──
    try {
      await axios.post(`${API_URL}/api/user-profiles`, {
        user_id: userId,
        pseudo,
        nom,
        prenom,
        // Parrainage : transmet le token si présent. Le backend valide à
        // nouveau et, si OK, crée le compte en 'early' + parrain_id.
        ...(parrainageValide && refToken ? { ref: refToken } : {})
      })
    } catch (profileError) {
      console.error('Erreur création profil:', profileError)
      // On continue — le trigger SQL peut l'avoir créé
    }

    // ── Consommer le code d'invitation → marque is_beta = true ──
    // (sauté en cas de parrainage : aucun code à consommer)
    if (!parrainageValide) {
      try {
        await axios.post(`${API_URL}/api/invitations/consume`, {
          code: invitationCode.trim().toUpperCase(),
          user_id: userId
        })
        console.log('✅ Code d\'invitation consommé — accès bêta accordé')
      } catch (codeError) {
        console.error('Erreur consommation code:', codeError)
        // On continue — l'utilisateur est créé, on gérera le code manuellement si besoin
      }
    }

    setSuccess(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rugby-gold/10 to-rugby-orange/10 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo / Titre */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-rugby-gold mb-2">🏉 Top 14 Pronos</h1>
          <p className="text-gray-600">Créez votre compte</p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-3">Compte créé avec succès ! 🎉</h3>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-800 font-semibold mb-1">
                  🎟️ Accès activé !
                </p>
                <p className="text-sm text-green-700">
                  Vous bénéficiez d'un accès gratuit jusqu'au 30 septembre 2026, puis d'une offre de lancement préférentielle. Bienvenue dans l'équipe !
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 font-semibold mb-2">
                  📧 Un email de confirmation vous a été envoyé
                </p>
                <p className="text-sm text-blue-700">
                  Vérifiez votre boîte de réception et cliquez sur le lien pour activer votre compte.
                </p>
                <p className="text-xs text-blue-600 mt-2 italic">
                  (Pensez à vérifier vos spams si vous ne le voyez pas)
                </p>
              </div>

              <button
                onClick={() => navigate('/login')}
                className="w-full bg-rugby-gold hover:bg-rugby-orange text-white font-bold py-3 rounded-lg transition-colors"
              >
                Aller à la page de connexion
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">

              {parrainageValide ? (
                /* Parrainage valide : pas de code requis */
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
                  <p className="text-sm text-green-800 font-semibold flex items-center gap-1">
                    🎉 Invitation acceptée{pseudoParrain ? ` — parrainé par ${pseudoParrain}` : ''}
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Pas besoin de code : ton accès est offert jusqu'au 30 septembre 2026. Crée ton compte ci-dessous !
                  </p>
                </div>
              ) : (
                <>
                  {/* Encart bêta */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
                    <p className="text-xs text-green-800">
                      🎟️ <strong>Phase bêta</strong> — Un code d'invitation est requis pour s'inscrire.
                      Contactez <a href="mailto:contact@top14pronos.fr" className="underline">contact@top14pronos.fr</a> pour en obtenir un.
                    </p>
                  </div>

                  {/* Code d'invitation — en premier pour l'aspect "sésame" */}
                  <div>
                    <label htmlFor="invitationCode" className="block text-sm font-medium text-gray-700 mb-2">
                      Code d'invitation <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Ticket className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        id="invitationCode"
                        type="text"
                        value={invitationCode}
                        onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                        className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 transition-colors font-mono tracking-wider ${
                          invitationCode && codeValid === true
                            ? 'border-green-500 focus:ring-green-500 bg-green-50'
                            : invitationCode && codeValid === false
                            ? 'border-red-500 focus:ring-red-500 bg-red-50'
                            : 'border-gray-300 focus:ring-rugby-gold'
                        }`}
                        placeholder="TOP14-XXXX-XXXX"
                        disabled={loading}
                        maxLength={16}
                      />
                      <div className="absolute right-3 top-3">
                        {checkingCode && <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />}
                        {!checkingCode && invitationCode && codeValid === true && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        {!checkingCode && invitationCode && codeValid === false && (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    </div>
                    {codeMessage && (
                      <p className={`text-xs mt-1 flex items-center gap-1 ${codeValid ? 'text-green-600' : 'text-red-600'}`}>
                        {codeValid
                          ? <CheckCircle className="h-3 w-3" />
                          : <AlertCircle className="h-3 w-3" />
                        }
                        {codeMessage}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Pseudo */}
              <div>
                <label htmlFor="pseudo" className="block text-sm font-medium text-gray-700 mb-2">
                  Pseudo <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    id="pseudo"
                    type="text"
                    value={pseudo}
                    onChange={handlePseudoChange}
                    className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 transition-colors ${
                      pseudo && pseudoAvailable === true
                        ? 'border-green-500 focus:ring-green-500'
                        : pseudo && pseudoAvailable === false
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-rugby-gold'
                    }`}
                    placeholder="RugbyFan"
                    disabled={loading}
                    maxLength={20}
                  />
                  <div className="absolute right-3 top-3">
                    {checkingPseudo && <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />}
                    {!checkingPseudo && pseudo && pseudoAvailable === true && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {!checkingPseudo && pseudo && pseudoAvailable === false && (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">4-20 caractères (lettres, chiffres, _ -)</p>
                {pseudoError && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />{pseudoError}
                  </p>
                )}
                {!checkingPseudo && pseudoAvailable === true && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />Ce pseudo est disponible !
                  </p>
                )}
              </div>

              {/* Prénom */}
              <div>
                <label htmlFor="prenom" className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    id="prenom"
                    type="text"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rugby-gold focus:border-transparent"
                    placeholder="Jean"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Nom */}
              <div>
                <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    id="nom"
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rugby-gold focus:border-transparent"
                    placeholder="Dupont"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rugby-gold focus:border-transparent"
                    placeholder="votre@email.com"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rugby-gold focus:border-transparent"
                    placeholder="••••••••"
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Au moins 8 caractères</p>
              </div>

              {/* Confirmation mot de passe */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le mot de passe <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rugby-gold focus:border-transparent"
                    placeholder="••••••••"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Erreur */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Bouton d'inscription */}
              <button
                type="submit"
                disabled={loading || checkingPseudo || checkingCode || pseudoAvailable !== true || (!parrainageValide && codeValid !== true)}
                className="w-full bg-rugby-gold hover:bg-rugby-orange text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Création...' : 'Créer mon compte'}
              </button>

            </form>
          )}

          {!success && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Vous avez déjà un compte ?{' '}
                <Link to="/login" className="text-rugby-gold font-semibold hover:underline">
                  Se connecter
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
