import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-md w-full text-center">
          <div className="text-lg font-semibold text-gray-900 mb-2">
            Profil utilisateur indisponible
          </div>
          <div className="text-sm text-gray-600">
            Le compte est connecte mais le profil n est pas accessible. Verifie les regles RLS de la table profiles.
          </div>
          <div className="mt-4">
            <button
              onClick={() => window.location.reload()}
              className="btn-primary px-4 py-2"
            >
              Recharger
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Pour la transition : les utilisateurs avec un rôle existant (non-null) gardent l'accès admin
  // À terme, seuls les 'admin' explicites auront accès
  if (allowedRoles.length > 0 && allowedRoles.includes('admin') && !profile.role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You do not have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return children
}
