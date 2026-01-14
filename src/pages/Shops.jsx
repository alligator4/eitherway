import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react'

export default function Shops() {
  const { profile } = useAuth()

  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editingShop, setEditingShop] = useState(null)

  const [formData, setFormData] = useState({
    shop_number: '',
    name: '',
    status: 'vacant',
    surface_area: '',
    floor: '',
    location: '',
    activity_category: '',
    monthly_rent: '',
    description: ''
  })

  useEffect(() => {
    fetchShops()

    const channel = supabase
      .channel('shops-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shops' }, () => {
        fetchShops()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchShops = async () => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .order('shop_number', { ascending: true })

      if (error) throw error
      setShops(data || [])
    } catch (err) {
      console.error('Error fetching shops:', err)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      shop_number: '',
      name: '',
      status: 'vacant',
      surface_area: '',
      floor: '',
      location: '',
      activity_category: '',
      monthly_rent: '',
      description: ''
    })
  }

  const openCreate = () => {
    setEditingShop(null)
    resetForm()
    setShowModal(true)
  }

  const openEdit = (shop) => {
    setEditingShop(shop)
    setFormData({
      shop_number: shop.shop_number || '',
      name: shop.name || '',
      status: shop.status || 'vacant',
      surface_area: shop.surface_area ?? '',
      floor: shop.floor || '',
      location: shop.location || '',
      activity_category: shop.activity_category || '',
      monthly_rent: shop.monthly_rent ?? '',
      description: shop.description || ''
    })
    setShowModal(true)
  }

  const closeModal = () => {
    if (saving) return
    setShowModal(false)
    setEditingShop(null)
    resetForm()
  }

  const parseNumberOrNull = (val) => {
    if (val === '' || val === null || val === undefined) return null
    const n = Number(val)
    return Number.isFinite(n) ? n : null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!profile?.id) {
      alert('Profil utilisateur introuvable. Reconnectez vous.')
      return
    }

    setSaving(true)

    try {
      const surfaceArea = parseNumberOrNull(formData.surface_area)
      if (surfaceArea === null) {
        alert('Surface area invalide')
        setSaving(false)
        return
      }

      const shopData = {
        shop_number: String(formData.shop_number || '').trim(),
        name: String(formData.name || '').trim() || null,
        status: formData.status,
        surface_area: surfaceArea,
        floor: String(formData.floor || '').trim(),
        location: String(formData.location || '').trim(),
        activity_category: String(formData.activity_category || '').trim() || null,
        monthly_rent: parseNumberOrNull(formData.monthly_rent),
        description: String(formData.description || '').trim() || null,
        created_by: profile.id
      }

      if (!shopData.shop_number) {
        alert('Shop number requis')
        setSaving(false)
        return
      }
      if (!shopData.floor) {
        alert('Floor requis')
        setSaving(false)
        return
      }
      if (!shopData.location) {
        alert('Location requis')
        setSaving(false)
        return
      }

      if (editingShop?.id) {
        const { error } = await supabase
          .from('shops')
          .update(shopData)
          .eq('id', editingShop.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('shops')
          .insert([shopData])

        if (error) throw error
      }

      closeModal()
      fetchShops()
    } catch (err) {
      console.error('Error saving shop:', err)
      alert('Erreur lors de la sauvegarde: ' + (err?.message || ''))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Voulez vous supprimer ce local ?')) return

    try {
      const { error } = await supabase
        .from('shops')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchShops()
    } catch (err) {
      console.error('Error deleting shop:', err)
      alert('Erreur suppression: ' + (err?.message || ''))
    }
  }

  const filteredShops = shops.filter((shop) => {
    const s = (v) => String(v || '').toLowerCase()
    const q = s(searchTerm)
    return (
      s(shop.shop_number).includes(q) ||
      s(shop.name).includes(q) ||
      s(shop.location).includes(q)
    )
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'occupied':
        return 'bg-green-100 text-green-800'
      case 'vacant':
        return 'bg-gray-100 text-gray-800'
      case 'under_renovation':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'occupied':
        return 'Occupe'
      case 'vacant':
        return 'Libre'
      case 'under_renovation':
        return 'Renovation'
      default:
        return status
    }
  }

  const canEdit = profile?.role === 'admin' || profile?.role === 'manager'

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Locaux</h1>
          <p className="mt-1 text-sm text-gray-500">Gestion des boutiques et emplacements</p>
        </div>

        {canEdit && (
          <button
            onClick={openCreate}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Ajouter
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par numero, nom ou emplacement"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredShops.map((shop) => (
          <div key={shop.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Local {shop.shop_number}</h3>
                  {shop.name ? <p className="text-sm text-gray-600">{shop.name}</p> : null}
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(shop.status)}`}>
                  {getStatusLabel(shop.status)}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Etage:</span>
                  <span className="font-medium">{shop.floor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Emplacement:</span>
                  <span className="font-medium">{shop.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Surface:</span>
                  <span className="font-medium">{shop.surface_area} m2</span>
                </div>

                {shop.activity_category ? (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Categorie:</span>
                    <span className="font-medium">{shop.activity_category}</span>
                  </div>
                ) : null}

                {shop.monthly_rent ? (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Loyer:</span>
                    <span className="font-medium">${shop.monthly_rent}/mo</span>
                  </div>
                ) : null}
              </div>

              {canEdit && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => openEdit(shop)}
                    className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(shop.id)}
                    className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredShops.length === 0 && (
        <div className="bg-white rounded-lg shadow p-10 text-center text-gray-500">
          Aucun local trouve
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingShop ? 'Modifier le local' : 'Ajouter un local'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600" disabled={saving}>
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numero *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.shop_number}
                    onChange={(e) => setFormData({ ...formData, shop_number: e.target.value })}
                    className="w-full rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut *
                  </label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                    disabled={saving}
                  >
                    <option value="vacant">Libre</option>
                    <option value="occupied">Occupe</option>
                    <option value="under_renovation">Renovation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Surface (m2) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.surface_area}
                    onChange={(e) => setFormData({ ...formData, surface_area: e.target.value })}
                    className="w-full rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Etage *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    className="w-full rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                    disabled={saving}
                    placeholder="RDC, 1er, 2e"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Emplacement *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                    disabled={saving}
                    placeholder="Aile Nord, Entree, A12"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categorie activite
                  </label>
                  <input
                    type="text"
                    value={formData.activity_category}
                    onChange={(e) => setFormData({ ...formData, activity_category: e.target.value })}
                    className="w-full rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loyer mensuel ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.monthly_rent}
                    onChange={(e) => setFormData({ ...formData, monthly_rent: e.target.value })}
                    className="w-full rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                    disabled={saving}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                  disabled={saving}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  disabled={saving}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                >
                  {saving ? 'Enregistrement...' : editingShop ? 'Mettre a jour' : 'Creer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
