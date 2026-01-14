import { useMemo, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { Plus, Edit2, Trash2, Search, Filter } from 'lucide-react'
import ShopModal from './ShopModal'

export default function ShopsPage() {
  const { profile } = useAuth()

  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [selectedShop, setSelectedShop] = useState(null)

  const canManage = useMemo(() => {
    const r = profile?.role
    return r === 'admin' || r === 'manager'
  }, [profile?.role])

  useEffect(() => {
    fetchShops()
  }, [])

  const fetchShops = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .order('shop_number', { ascending: true })

      if (error) throw error
      setShops(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Erreur chargement locaux:', error)
      setShops([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!canManage) return
    if (!confirm('Confirmer la suppression de ce local ?')) return

    try {
      const { error } = await supabase.from('shops').delete().eq('id', id)
      if (error) throw error
      fetchShops()
    } catch (error) {
      alert('Erreur suppression: ' + (error?.message || 'Erreur inconnue'))
    }
  }

  const statusLabel = (status) => {
    if (status === 'occupied') return 'Occupé'
    if (status === 'vacant') return 'Disponible'
    if (status === 'under_renovation') return 'En rénovation'
    return status || '-'
  }

  const getStatusBadge = (status) => {
    const styles = {
      occupied: 'badge-success',
      vacant: 'badge-warning',
      under_renovation: 'badge-info',
    }
    return (
      <span className={`badge ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabel(status)}
      </span>
    )
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

  const filteredShops = useMemo(() => {
    const q = (searchTerm || '').toLowerCase().trim()

    return shops.filter((shop) => {
      const number = String(shop.shop_number || '').toLowerCase()
      const name = String(shop.name || '').toLowerCase()

      const matchesSearch = !q || number.includes(q) || name.includes(q)
      const matchesStatus = statusFilter === 'all' || shop.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [shops, searchTerm, statusFilter])

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
          <h2 className="text-3xl font-bold text-gray-900">Locaux</h2>
          <p className="text-gray-600 mt-1">Gérer les locaux commerciaux du centre</p>
        </div>

        {canManage ? (
          <button
            type="button"
            onClick={() => {
              setSelectedShop(null)
              setShowModal(true)
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Ajouter un local
          </button>
        ) : null}
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher par numéro ou nom..."
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
              <option value="occupied">Occupé</option>
              <option value="vacant">Disponible</option>
              <option value="under_renovation">En rénovation</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredShops.map((shop) => (
          <div key={shop.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{shop.shop_number || '-'}</h3>
                {shop.name ? <p className="text-gray-600">{shop.name}</p> : null}
              </div>
              {getStatusBadge(shop.status)}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Surface</span>
                <span className="font-medium">{shop.surface_area ?? '-'} m²</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Étage</span>
                <span className="font-medium">{shop.floor || '-'}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Emplacement</span>
                <span className="font-medium">{shop.location || '-'}</span>
              </div>

              {shop.activity_category ? (
                <div className="flex justify-between">
                  <span className="text-gray-600">Catégorie</span>
                  <span className="font-medium">{shop.activity_category}</span>
                </div>
              ) : null}

              {shop.monthly_rent !== null && shop.monthly_rent !== undefined && shop.monthly_rent !== '' ? (
                <div className="flex justify-between">
                  <span className="text-gray-600">Loyer mensuel</span>
                  <span className="font-bold text-green-600">{formatMoney(shop.monthly_rent, 'EUR')}</span>
                </div>
              ) : null}
            </div>

            {canManage ? (
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedShop(shop)
                    setShowModal(true)
                  }}
                  className="flex-1 btn-secondary flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Modifier
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(shop.id)}
                  className="btn-danger flex items-center justify-center gap-2"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {filteredShops.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">Aucun local trouvé</p>
        </div>
      ) : null}

      {showModal ? (
        <ShopModal
          shop={selectedShop}
          onClose={() => {
            setShowModal(false)
            setSelectedShop(null)
          }}
          onSuccess={() => {
            fetchShops()
            setShowModal(false)
            setSelectedShop(null)
          }}
        />
      ) : null}
    </div>
  )
}
