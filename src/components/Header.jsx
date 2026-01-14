import { useEffect, useRef, useState } from 'react'
import { LogOut, User, Bell } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'

export default function Header({ profile }) {
  const { signOut } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)

  const hasNotifications = false

  useEffect(() => {
    const onClickOutside = (e) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(e.target)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', onClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', onClickOutside)
    }
  }, [showMenu])

  const getRoleBadge = (roleRaw) => {
    const role = (roleRaw || '').toLowerCase()
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      manager: 'bg-blue-100 text-blue-800',
      accountant: 'bg-green-100 text-green-800',
      tenant: 'bg-gray-100 text-gray-800',
      user: 'bg-gray-100 text-gray-800',
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  const roleLabel = (roleRaw) => {
    const role = (roleRaw || '').toLowerCase()
    if (role === 'admin') return 'Administrateur'
    if (role === 'manager') return 'Gérant'
    if (role === 'accountant') return 'Comptable'
    if (role === 'tenant') return 'Locataire'
    return roleRaw || ''
  }

  const fullName = profile?.full_name || profile?.email || 'Utilisateur'
  const email = profile?.email || ''
  const role = profile?.role || 'user'

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Gestion du centre commercial</h1>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
            aria-label="Notifications"
            onClick={() => {}}
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {hasNotifications ? (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            ) : null}
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowMenu((v) => !v)}
              className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{fullName}</p>
                <p className="text-xs text-gray-500">{roleLabel(role)}</p>
              </div>

              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary-600" />
              </div>
            </button>

            {showMenu ? (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="font-medium text-gray-900">{fullName}</p>
                  {email ? <p className="text-sm text-gray-500">{email}</p> : null}
                  <span
                    className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(role)}`}
                  >
                    {roleLabel(role)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => signOut()}
                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}
