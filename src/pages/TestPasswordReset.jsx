import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AlertCircle, CheckCircle, Info, Mail, Key, ArrowRight } from 'lucide-react'

export default function TestPasswordReset() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleTestReset = async () => {
    if (!email.trim()) return

    setLoading(true)
    setStatus(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error

      setStatus({
        type: 'success',
        message: 'Email de reinitialisation envoye. Verifiez votre boite email et vos spams.'
      })
    } catch (err) {
      setStatus({
        type: 'error',
        message: err?.message || 'Erreur lors de envoi de email'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Test reinitialisation mot de passe
          </h1>
          <p className="text-gray-600">
            Page de test pour verifier le mot de passe oublie
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start">
            <Info className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                Fonctionnement du reset
              </h3>
              <ol className="space-y-3 text-sm text-blue-800">
                <li className="flex items-start">
                  <span className="mr-2 bg-blue-200 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">1</span>
                  <span>Utilisateur va sur /forgot-password et saisit son email</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 bg-blue-200 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">2</span>
                  <span>Supabase envoie un email avec un lien</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 bg-blue-200 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">3</span>
                  <span>Utilisateur clique sur le lien et arrive sur /reset-password</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 bg-blue-200 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">4</span>
                  <span>Utilisateur saisit un nouveau mot de passe</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 bg-blue-200 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">5</span>
                  <span>Mot de passe mis a jour puis retour vers /login</span>
                </li>
              </ol>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Mail className="h-6 w-6 text-primary-600 mr-2" />
            Envoi email de reset
          </h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="test-email" className="block text-sm font-medium text-gray-700 mb-2">
                Email du compte
              </label>
              <input
                id="test-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemple@gmail.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                Saisissez l email d un compte existant
              </p>
            </div>

            <button
              onClick={handleTestReset}
              disabled={loading || !email.trim()}
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Envoi en cours...' : "Envoyer l email de reset"}
            </button>

            {status && (
              <div
                className={`mt-4 p-4 rounded-lg flex items-start ${
                  status.type === 'success'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                {status.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                )}
                <span className={status.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                  {status.message}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-yellow-900 mb-3 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            Problemes courants
          </h3>

          <div className="space-y-3 text-sm text-yellow-800">
            <div>
              <div className="block mb-1">Compte inexistant</div>
              <p className="ml-4">Creez un compte sur /signup puis reessayez</p>
            </div>

            <div>
              <div className="block mb-1">Email non recu</div>
              <ul className="ml-4 list-disc list-inside space-y-1">
                <li>Verifier le dossier spam</li>
                <li>Attendre quelques minutes</li>
                <li>Verifier la configuration email dans Supabase</li>
              </ul>
            </div>

            <div>
              <div className="block mb-1">Lien invalide ou expire</div>
              <p className="ml-4">Demandez un nouveau lien. Les liens expirent.</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center">
            <Key className="h-5 w-5 mr-2" />
            Configuration Supabase si email ne fonctionne pas
          </h3>

          <div className="text-sm text-purple-800 space-y-3">
            <p>Verifier dans le dashboard Supabase :</p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>
                Authentication puis Email Templates puis Reset Password actif
              </li>
              <li>
                Authentication puis URL Configuration puis ajouter redirect URL vers /reset-password
              </li>
              <li>
                Settings puis Auth puis verifier les options email
              </li>
            </ol>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/forgot-password"
            className="bg-white border-2 border-primary-200 rounded-lg p-4 hover:border-primary-400 transition group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Forgot Password</h4>
                <p className="text-xs text-gray-600">Page utilisateur</p>
              </div>
              <ArrowRight className="h-5 w-5 text-primary-600 group-hover:translate-x-1 transition" />
            </div>
          </Link>

          <Link
            to="/reset-password"
            className="bg-white border-2 border-primary-200 rounded-lg p-4 hover:border-primary-400 transition group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Reset Password</h4>
                <p className="text-xs text-gray-600">Page reset</p>
              </div>
              <ArrowRight className="h-5 w-5 text-primary-600 group-hover:translate-x-1 transition" />
            </div>
          </Link>

          <Link
            to="/login"
            className="bg-white border-2 border-primary-200 rounded-lg p-4 hover:border-primary-400 transition group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Login</h4>
                <p className="text-xs text-gray-600">Retour connexion</p>
              </div>
              <ArrowRight className="h-5 w-5 text-primary-600 group-hover:translate-x-1 transition" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
