import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Store, AlertCircle, CheckCircle } from 'lucide-react'

export default function TestResetPassword() {
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleRequestReset = async (e) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setResult(null)

    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error

      setResult({
        type: 'success',
        message: 'Email de reset envoye. Verifiez votre boite email et vos spams.',
        details: data
      })
    } catch (err) {
      setResult({
        type: 'error',
        message: err?.message || 'Erreur lors de envoi de email',
        details: err
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDirectUpdate = async (e) => {
    e.preventDefault()
    if (!newPassword) return

    setLoading(true)
    setResult(null)

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      setResult({
        type: 'success',
        message: 'Mot de passe mis a jour avec succes.',
        details: data
      })
    } catch (err) {
      setResult({
        type: 'error',
        message: err?.message || 'Erreur lors de mise a jour du mot de passe',
        details: err
      })
    } finally {
      setLoading(false)
    }
  }

  const checkSession = async () => {
    setLoading(true)
    setResult(null)

    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error

      setResult({
        type: 'info',
        message: data?.session?.user?.email
          ? `Session active: ${data.session.user.email}`
          : 'Aucune session active',
        details: data
      })
    } catch (err) {
      setResult({
        type: 'error',
        message: err?.message || 'Erreur lors de verification de session',
        details: err
      })
    } finally {
      setLoading(false)
    }
  }

  const resultStyles =
    result?.type === 'success'
      ? 'bg-green-50 border-2 border-green-200'
      : result?.type === 'error'
      ? 'bg-red-50 border-2 border-red-200'
      : 'bg-blue-50 border-2 border-blue-200'

  const Icon =
    result?.type === 'success'
      ? CheckCircle
      : AlertCircle

  const iconColor =
    result?.type === 'success'
      ? 'text-green-600'
      : result?.type === 'error'
      ? 'text-red-600'
      : 'text-blue-600'

  const titleColor =
    result?.type === 'success'
      ? 'text-green-900'
      : result?.type === 'error'
      ? 'text-red-900'
      : 'text-blue-900'

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg">
              <Store className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="mt-6 text-3xl font-bold text-gray-900">Test reset mot de passe</h1>
          <p className="mt-2 text-sm text-gray-600">
            Page de test pour verifier mot de passe oublie
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Verifier la session actuelle</h2>
          <button
            onClick={checkSession}
            disabled={loading}
            className="w-full py-3 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition"
          >
            {loading ? 'Verification...' : 'Verifier la session'}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Test 1: demander un email de reset</h2>
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email du compte
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="exemple@gmail.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full py-3 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition"
            >
              {loading ? 'Envoi...' : 'Envoyer email de reset'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Test 2: changer le mot de passe si connecte</h2>
          <form onSubmit={handleDirectUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Minimum 6 caracteres"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
            >
              {loading ? 'Mise a jour...' : 'Mettre a jour le mot de passe'}
            </button>
          </form>
          <p className="mt-2 text-xs text-gray-500">
            Cette methode necessite une session active
          </p>
        </div>

        {result && (
          <div className={`rounded-xl shadow-xl p-6 ${resultStyles}`}>
            <div className="flex items-start">
              <Icon className={`h-6 w-6 mr-3 flex-shrink-0 mt-0.5 ${iconColor}`} />
              <div className="flex-1">
                <h3 className={`font-semibold mb-2 ${titleColor}`}>
                  {result.message}
                </h3>
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
                    Details techniques
                  </summary>
                  <pre className="mt-2 p-3 bg-white rounded text-xs overflow-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-xl p-6">
          <h3 className="font-semibold mb-3">Instructions</h3>
          <ol className="space-y-2 text-sm text-gray-700">
            <li className="flex">
              <span className="mr-2">1.</span>
              <span>Cliquer sur Verifier la session</span>
            </li>
            <li className="flex">
              <span className="mr-2">2.</span>
              <span>Si aucune session, demander un email de reset</span>
            </li>
            <li className="flex">
              <span className="mr-2">3.</span>
              <span>Cliquer sur le lien recu pour arriver sur /reset-password</span>
            </li>
            <li className="flex">
              <span className="mr-2">4.</span>
              <span>Sinon si session active, tester updateUser</span>
            </li>
          </ol>
        </div>

        <div className="text-center">
          <a href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            Retour a la page de connexion
          </a>
        </div>
      </div>
    </div>
  )
}
