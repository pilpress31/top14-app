import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    // Validation
    if (!email) {
      setError('Veuillez entrer votre adresse email')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error

      setSuccess(true)
    } catch (error) {
      console.error('Erreur:', error)
      setError('Une erreur est survenue. Vérifiez votre adresse email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rugby-gold/10 to-rugby-orange/10 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Retour */}
        <Link 
          to="/login" 
          className="inline-flex items-center gap-2 text-rugby-gold hover:text-rugby-orange mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-semibold">Retour à la connexion</span>
        </Link>

        {/* Logo / Titre */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-rugby-gold mb-2">🔑</h1>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Mot de passe oublié ?</h2>
          <p className="text-gray-600">Pas de souci, on va vous aider !</p>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-3">Email envoyé ! 📧</h3>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 mb-2">
                  Nous avons envoyé un lien de réinitialisation à :
                </p>
                <p className="font-semibold text-blue-900">{email}</p>
                <p className="text-xs text-blue-600 mt-3 italic">
                  (Vérifiez aussi vos spams si vous ne le voyez pas)
                </p>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Cliquez sur le lien dans l'email pour créer un nouveau mot de passe.
              </p>

              <Link
                to="/login"
                className="inline-block w-full bg-rugby-gold hover:bg-rugby-orange text-white font-bold py-3 rounded-lg transition-colors text-center"
              >
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <p className="text-sm text-gray-600">
                Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse email
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

              {/* Erreur */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Bouton */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-rugby-gold hover:bg-rugby-orange text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
