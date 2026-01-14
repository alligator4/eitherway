import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import {
  LayoutDashboard,
  Store,
  Users,
  FileText,
  Receipt,
  CreditCard,
  Menu,
  X,
  LogOut,
  User,
  Activity,
  UserCog
} from 'lucide-react'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const navigation = [
    { name: 'Tableau de bord', href: '/', icon: LayoutDashboard, roles: ['admin', 'manager', 'accountant'] },
    { name: 'Boutiques', href: '/shops', icon: Store, roles: ['admin', 'manager'] },
    { name: 'Locataires', href: '/tenants', icon: Users, roles: ['admin', 'manager'] },
    { name: 'Contrats', href: '/contracts', icon: FileText, roles: ['admin', 'manager'] },
    { name: 'Factures', href: '/invoices', icon: Receipt, roles: ['admin', 'manager', 'accountant'] },
    { name: 'Paiements', href: '/payments', icon: CreditCard, roles: ['admin', 'manager', 'accountant'] },
    { name: 'Utilisateurs', href: '/users', icon: UserCog, roles: ['admin'] },
    { name: 'Journal activite', href: '/logs', icon: Activity, roles: ['admin'] },
  ]

  const filteredNavigation = navigation.filter(item =>
    item.roles.includes(profile?.role)
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-6 border-b">
            <h1 className="text-xl font-bold text-primary-600">PropertyHub</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md hover:bg-gray-100"
              aria-label="Fermer le menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {filteredNavigation.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === '/'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </NavLink>
            ))}
          </nav>

          <div className="border-t p-4">
            <div className="flex items-center mb-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary-600" />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">{profile?.full_name || ''}</p>
                <p className="text-xs text-gray-500 capitalize">{profile?.role || ''}</p>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Deconnexion
            </button>
          </div>
        </div>
      </div>

      <div className="lg:pl-64">
        <div className="sticky top-0 z-10 bg-white border-b h-16 flex items-center px-4 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex-1 flex justify-end">
            <span className="text-sm text-gray-600">
              Bienvenue, <span className="font-medium">{profile?.full_name || ''}</span>
            </span>
          </div>
        </div>

        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
