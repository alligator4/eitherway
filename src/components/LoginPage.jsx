import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { Building2, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const { signIn, signUp } = useAuth()

  const translateSupabaseError = (message) => {
    let m = message || 'Une erreur est survenue'

    if (m.includes('Invalid login credentials')) {
      m = 'Email ou mot de passe incorrect.'
    } else if (m.includes('Email not confirmed')) {
      m = 'Veuillez confirmer votre email avant de vous connecter.'
    } else if (m.includes('User already registered')) {
      m = 'Cet email est déjà enregistré. Cliquez sur "Se connecter".'
    } else if (m.includes('Password should be at least')) {
      m = 'Le mot de passe doit contenir au moins 6 caractères.'
    }

    return m
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (isLogin) {
        await signIn(email, password)
      } else {
        if (!fullName.trim()) {
          setError('Le nom complet est requis.')
          setLoading(false)
          return
        }

        await signUp(email, password, fullName.trim())
        setSuccess('Compte créé avec succès. Vous pouvez maintenant vous connecter.')
        setIsLogin(true)
        setPassword('')
      }
    } catch (err) {
      setError(translateSupabaseError(err?.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <Building2 className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion du centre</h1>
          <p className="text-gray-600 mt-2">
            {isLogin ? 'Connexion à votre compte' : 'Créer un compte'}
          </p>
        </div>

        {success ? (
          <div className="mb-4 p-4 rounded-lg flex items-start gap-3 bg-green-50 text-green-800">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{success}</p>
          </div>
        ) : null}

        {error ? (
          <div className="mb-4 p-4 rounded-lg flex items-start gap-3 bg-red-50 text-red-800">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin ? (
            <div>
              <label className="label">Nom complet</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-field"
                placeholder="Ex: Jean Dupont"
                required
              />
            </div>
          ) : null}

          <div>
            <label className="label">Adresse email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="exemple@mail.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="label">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Veuillez patienter...' : isLogin ? 'Se connecter' : 'Créer le compte'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin((v) => !v)
              setError('')
              setSuccess('')
            }}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            {isLogin ? "Je n'ai pas de compte, créer un compte" : "J'ai déjà un compte, me connecter"}
          </button>
        </div>
      </div>
    </div>
  )
}
