import { useMemo, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { Plus, Edit2, Trash2, Search, FileText, Calendar, AlertTriangle } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import ContractModal from './ContractModal'

export default function ContractsPage() {
  const { profile } = useAuth()

  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [selectedContract, setSelectedContract] = useState(null)

  const canManage = useMemo(() => {
    const r = profile?.role
    return r === 'admin' || r === 'manager'
  }, [profile?.role])

  useEffect(() => {
    fetchContracts()
  }, [])

  const fetchContracts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          id,
          shop_id,
          tenant_id,
          title,
          start_date,
          end_date,
          rent_amount,
          currency,
          status,
          notes,
          created_at,
          tenant:tenants(id, company_name, contact_name, email, status),
          shop:shops(id, name, shop_number, floor, location)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setContracts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Erreur lors du chargement des contrats:', error)
      setContracts([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!canManage) return
    if (!confirm('Confirmer la suppression de ce contrat ?')) return

    try {
      const { error } = await supabase.from('contracts').delete().eq('id', id)
      if (error) throw error
      fetchContracts()
    } catch (error) {
      alert('Erreur suppression: ' + (error?.message || 'Erreur inconnue'))
    }
  }

  const filteredContracts = useMemo(() => {
    const q = (searchTerm || '').toLowerCase().trim()

    return contracts.filter((c) => {
      const title = (c.title || '').toLowerCase()
      const tenantName = (c.tenant?.name || '').toLowerCase()
      const shopNumber = (c.shop?.shop_number || '').toString().toLowerCase()
      const shopName = (c.shop?.name || '').toLowerCase()

      const matchesSearch =
        !q ||
        title.includes(q) ||
        tenantName.includes(q) ||
        shopNumber.includes(q) ||
        shopName.includes(q)

      const matchesStatus = statusFilter === 'all' || c.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [contracts, searchTerm, statusFilter])

  const getStatusBadge = (status) => {
    const s = (status || 'active').toLowerCase()
    const styles = {
      active: 'badge-success',
      terminated: 'badge-danger',
      pending: 'badge-warning',
    }
    const label = {
      active: 'Actif',
      terminated: 'Résilié',
      pending: 'En attente',
    }[s] || s

    return <span className={`badge ${styles[s] || 'badge-info'}`}>{label}</span>
  }

  const getExpiryWarning = (endDate) => {
    if (!endDate) return { show: false }

    const daysUntilExpiry = differenceInDays(new Date(endDate), new Date())
    if (Number.isNaN(daysUntilExpiry)) return { show: false }

    if (daysUntilExpiry < 0) {
      return { text: 'Expiré', color: 'text-red-600', show: true }
    }
    if (daysUntilExpiry <= 30) {
      return { text: `Expire dans ${daysUntilExpiry} jours`, color: 'text-red-600', show: true }
    }
    if (daysUntilExpiry <= 90) {
      return { text: `Expire dans ${daysUntilExpiry} jours`, color: 'text-orange-600', show: true }
    }
    return { show: false }
  }

  const formatDate = (d) => {
    if (!d) return '-'
    try {
      return format(new Date(d), 'dd/MM/yyyy')
    } catch {
      return '-'
    }
  }

  const shopLabel = (shop) => {
    if (!shop) return '-'
    const num = shop.shop_number ? String(shop.shop_number).trim() : ''
    const name = shop.name ? String(shop.name).trim() : ''
    const placeParts = []
    if (shop.floor !== null && shop.floor !== undefined && String(shop.floor) !== '') {
      placeParts.push(`Étage ${shop.floor}`)
    }
    if (shop.location) placeParts.push(String(shop.location).trim())
    const place = placeParts.length ? ` (${placeParts.join(', ')})` : ''
    if (num && name) return `${num} - ${name}${place}`
    if (num) return `${num}${place}`
    if (name) return `${name}${place}`
    return `Local ${shop.id.substring(0, 8)}...`
  }

  const formatMoney = (amount, currency = 'EUR') => {
    const n = Number(amount)
    if (Number.isNaN(n)) return '-'
    try {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(n)
    } catch {
      return `${n.toFixed(2)} ${currency}`
    }
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
          <h2 className="text-3xl font-bold text-gray-900">Contrats</h2>
          <p className="text-gray-600 mt-1">Gestion des baux et suivi des échéances</p>
        </div>

        {canManage ? (
          <button
            type="button"
            onClick={() => {
              setSelectedContract(null)
              setShowModal(true)
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nouveau contrat
          </button>
        ) : null}
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher par titre, locataire, local..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-56"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="pending">En attente</option>
            <option value="terminated">Résilié</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredContracts.map((c) => {
          const expiryWarning = getExpiryWarning(c.end_date)
          return (
            <div key={c.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <FileText className="w-6 h-6 text-primary-600" />
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {c.title || 'Contrat'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Créé le {formatDate(c.created_at)}
                      </p>
                    </div>
                    {getStatusBadge(c.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Locataire</p>
                      <p className="font-medium">{c.tenant?.name || '-'}</p>
                      {c.tenant?.email ? (
                        <p className="text-xs text-gray-500">{c.tenant.email}</p>
                      ) : null}
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-1">Local</p>
                      <p className="font-medium">{shopLabel(c.shop)}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-1">Période</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">{formatDate(c.start_date)}</p>
                          <p className="text-sm font-medium">
                            au {formatDate(c.end_date)}
                          </p>
                        </div>
                      </div>

                      {expiryWarning.show ? (
                        <div className={`flex items-center gap-1 mt-1 ${expiryWarning.color}`}>
                          <AlertTriangle className="w-3 h-3" />
                          <p className="text-xs font-medium">{expiryWarning.text}</p>
                        </div>
                      ) : null}
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-1">Loyer</p>
                      <p className="text-lg font-bold text-green-600">
                        {formatMoney(c.rent_amount, c.currency)}
                        {' '}/ mois
                      </p>
                    </div>
                  </div>

                  {c.notes ? (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        Notes: {c.notes}
                      </p>
                    </div>
                  ) : null}
                </div>

                {canManage ? (
                  <div className="flex gap-2 ml-4">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedContract(c)
                        setShowModal(true)
                      }}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Modifier
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      className="btn-danger flex items-center gap-2"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      {filteredContracts.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">Aucun contrat trouvé</p>
        </div>
      ) : null}

      {showModal ? (
        <ContractModal
          contract={selectedContract}
          onClose={() => {
            setShowModal(false)
            setSelectedContract(null)
          }}
          onSuccess={() => {
            fetchContracts()
            setShowModal(false)
            setSelectedContract(null)
          }}
        />
      ) : null}
    </div>
  )
}
