import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Store,
  Users,
  FileText,
  Receipt,
  CreditCard,
  Activity,
  UserCog
} from 'lucide-react'

export default function Sidebar({ userRole }) {
  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', to: '/', icon: LayoutDashboard, roles: ['admin', 'manager', 'accountant'] },
    { id: 'shops', label: 'Locaux', to: '/shops', icon: Store, roles: ['admin', 'manager'] },
    { id: 'tenants', label: 'Locataires', to: '/tenants', icon: Users, roles: ['admin', 'manager'] },
    { id: 'contracts', label: 'Contrats', to: '/contracts', icon: FileText, roles: ['admin', 'manager'] },
    { id: 'invoices', label: 'Factures', to: '/invoices', icon: Receipt, roles: ['admin', 'manager', 'accountant'] },
    { id: 'payments', label: 'Paiements', to: '/payments', icon: CreditCard, roles: ['admin', 'manager', 'accountant'] },
    { id: 'activity-logs', label: 'Journal d’activité', to: '/logs', icon: Activity, roles: ['admin'] },
    { id: 'users', label: 'Utilisateurs', to: '/users', icon: UserCog, roles: ['admin'] },
  ]

  const allowedItems = menuItems.filter((item) => item.roles.includes(userRole))

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <nav className="p-4 space-y-1">
        {allowedItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.id}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-gray-500'}`} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
