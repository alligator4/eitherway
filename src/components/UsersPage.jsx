import { useMemo, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Search, UserPlus, Edit2, Shield, Filter } from 'lucide-react'
import { format } from 'date-fns'

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // all | active | inactive

  const [currentUserId, setCurrentUserId] = useState(null)

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    } catch {
      setCurrentUserId(null)
    } finally {
      fetchUsers()
    }
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    if (!userId) return

    if (userId === currentUserId && newRole !== 'admin') {
      alert("Tu ne peux pas retirer ton propre rôle admin.")
      return
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error
      fetchUsers()
    } catch (error) {
      alert('Erreur mise à jour rôle: ' + (error?.message || 'Erreur inconnue'))
    }
  }

  const handleStatusToggle = async (userId, currentStatus) => {
    if (!userId) return

    if (userId === currentUserId) {
      alert("Tu ne peux pas désactiver ton propre compte.")
      return
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ active: !currentStatus })
        .eq('id', userId)

      if (error) throw error
      fetchUsers()
    } catch (error) {
      alert('Erreur mise à jour statut: ' + (error?.message || 'Erreur inconnue'))
    }
  }

  const filteredUsers = useMemo(() => {
    const q = (searchTerm || '').toLowerCase().trim()

    return users.filter((u) => {
      const fullName = String(u.full_name || '').toLowerCase()
      const email = String(u.email || '').toLowerCase()
      const role = String(u.role || '').toLowerCase()

      const matchesSearch = !q || fullName.includes(q) || email.includes(q) || role.includes(q)

      const isActive = !!u.active
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && isActive) ||
        (statusFilter === 'inactive' && !isActive)

      return matchesSearch && matchesStatus
    })
  }, [users, searchTerm, statusFilter])

  const getRoleBadge = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      manager: 'bg-blue-100 text-blue-800',
      accountant: 'bg-green-100 text-green-800',
    }
    const r = role || 'manager'
    return (
      <span className={`badge ${colors[r] || 'bg-gray-100 text-gray-800'}`}>
        {r === 'admin' ? 'Admin' : r === 'manager' ? 'Gestionnaire' : r === 'accountant' ? 'Comptable' : r}
      </span>
    )
  }

  const getInitial = (fullName) => {
    const v = String(fullName || '').trim()
    return v ? v.charAt(0).toUpperCase() : '?'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Gestion des utilisateurs</h2>
          <p className="text-gray-600 mt-1">Gérer les comptes et leurs rôles</p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
          <UserPlus className="w-5 h-5" />
          <span className="text-sm font-medium">
            Les nouveaux utilisateurs s’inscrivent via la page de connexion
          </span>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher par nom, email ou rôle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field w-56"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inscrit le
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Badges
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((u) => {
                const isMe = u.id === currentUserId
                const role = String(u.role || 'manager')
                const isActive = !!u.active

                return (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-semibold">
                            {getInitial(u.full_name)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {u.full_name || 'Sans nom'}
                            {isMe ? <span className="text-xs text-gray-500"> (moi)</span> : null}
                          </div>
                          <div className="text-sm text-gray-500">{u.email || '-'}</div>
                          {u.phone ? <div className="text-xs text-gray-400">{u.phone}</div> : null}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="input-field text-sm"
                        disabled={isMe}
                        title={isMe ? 'Impossible de modifier son propre rôle' : 'Modifier le rôle'}
                      >
                        <option value="admin">Admin</option>
                        <option value="manager">Gestionnaire</option>
                        <option value="accountant">Comptable</option>
                      </select>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleStatusToggle(u.id, isActive)}
                        className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`}
                        disabled={isMe}
                        title={isMe ? 'Impossible de désactiver son propre compte' : 'Activer/Désactiver'}
                      >
                        {isActive ? 'Actif' : 'Inactif'}
                      </button>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {u.created_at ? format(new Date(u.created_at), 'dd/MM/yyyy') : '-'}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getRoleBadge(role)}
                        {role === 'admin' ? <Shield className="w-4 h-4 text-purple-600" /> : null}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucun utilisateur trouvé</p>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card border-2 border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-gray-900">Admin</h3>
          </div>
          <p className="text-sm text-gray-600">
            Accès complet: utilisateurs, toutes les opérations, et journal d’activité.
          </p>
        </div>

        <div className="card border-2 border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Edit2 className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-gray-900">Gestionnaire</h3>
          </div>
          <p className="text-sm text-gray-600">
            Gestion des locaux, locataires, contrats, factures et paiements. Pas de gestion utilisateurs.
          </p>
        </div>

        <div className="card border-2 border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="w-5 h-5 text-green-600" />
            <h3 className="font-bold text-gray-900">Comptable</h3>
          </div>
          <p className="text-sm text-gray-600">
            Accès finances: tableau de bord, factures et paiements. Lecture seule sur le reste.
          </p>
        </div>
      </div>
    </div>
  )
}
