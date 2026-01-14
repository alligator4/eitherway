import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Activity, Search, Filter } from 'lucide-react'
import { format } from 'date-fns'

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [entityFilter, setEntityFilter] = useState('all')

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select(`
          id,
          created_at,
          action,
          entity,
          entity_id,
          details,
          actor_id,
          shop_id,
          actor:profiles!activity_logs_actor_id_fkey(full_name, email, role)
        `)
        .order('created_at', { ascending: false })
        .limit(500)

      if (error) throw error
      setLogs(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Erreur lors du chargement des journaux:', error)
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  const normalizeEntity = (log) => {
    return log.entity || log.entity_type || ''
  }

  const normalizeActorName = (log) => {
    return (log.actor?.full_name || log.actor?.email || '').trim()
  }

  const filteredLogs = useMemo(() => {
    const q = (searchTerm || '').toLowerCase().trim()

    return logs.filter((log) => {
      const action = (log.action || '').toLowerCase()
      const actorName = normalizeActorName(log).toLowerCase()
      const entity = normalizeEntity(log).toLowerCase()

      const matchesSearch =
        !q ||
        action.includes(q) ||
        actorName.includes(q) ||
        entity.includes(q)

      const matchesEntity =
        entityFilter === 'all' || normalizeEntity(log) === entityFilter

      return matchesSearch && matchesEntity
    })
  }, [logs, searchTerm, entityFilter])

  const getActionBadge = (actionRaw) => {
    const action = (actionRaw || '').toLowerCase()

    if (action.includes('create') || action.includes('insert')) {
      return <span className="badge badge-success">Création</span>
    }
    if (action.includes('update')) {
      return <span className="badge badge-info">Modification</span>
    }
    if (action.includes('delete')) {
      return <span className="badge badge-danger">Suppression</span>
    }
    if (action.includes('login') || action.includes('signin')) {
      return <span className="badge bg-purple-100 text-purple-800">Connexion</span>
    }
    if (action.includes('logout') || action.includes('signout')) {
      return <span className="badge bg-gray-100 text-gray-800">Déconnexion</span>
    }

    return <span className="badge badge-info">{actionRaw || 'Action'}</span>
  }

  const uniqueEntityTypes = useMemo(() => {
    const vals = logs
      .map((l) => normalizeEntity(l))
      .filter((v) => typeof v === 'string' && v.trim().length > 0)

    return [...new Set(vals)]
  }, [logs])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Journal d’activité</h2>
          <p className="text-gray-600 mt-1">
            Suivi des actions réalisées dans le système
          </p>
        </div>

        <button
          type="button"
          onClick={fetchLogs}
          className="btn btn-secondary"
        >
          Actualiser
        </button>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher par action, utilisateur ou élément..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="input-field w-56"
            >
              <option value="all">Tous les éléments</option>
              {uniqueEntityTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
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
                  Date et heure
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Élément
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Détails
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => {
                const entity = normalizeEntity(log)
                const actorName = normalizeActorName(log) || 'Utilisateur inconnu'

                return (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Activity className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {log.created_at
                              ? format(new Date(log.created_at), 'dd/MM/yyyy')
                              : '-'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {log.created_at
                              ? format(new Date(log.created_at), 'HH:mm:ss')
                              : ''}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {actorName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {log.actor?.role ? (
                          <span className="capitalize">{log.actor.role}</span>
                        ) : null}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{entity || '-'}</div>
                      {log.entity_id ? (
                        <div className="text-xs text-gray-500 font-mono">
                          {String(log.entity_id).substring(0, 8)}...
                        </div>
                      ) : null}
                    </td>

                    <td className="px-6 py-4">
                      {log.details ? (
                        <div className="text-sm text-gray-600 max-w-md truncate">
                          {typeof log.details === 'string'
                            ? log.details
                            : JSON.stringify(log.details)}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400">-</div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucun log trouvé</p>
          </div>
        ) : null}
      </div>

      <div className="text-sm text-gray-500">
        Affichage de {filteredLogs.length} sur {logs.length} logs au total
      </div>
    </div>
  )
}
