import { useMemo, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { Plus, Edit2, Trash2, Search, Mail, Phone, Filter } from 'lucide-react'
import TenantModal from './TenantModal'

export default function TenantsPage() {
  const { profile } = useAuth()

  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // all | active | inactive
  const [showModal, setShowModal] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState(null)

  const canManage = useMemo(() => {
    const r = profile?.role
    return r === 'admin' || r === 'manager'
  }, [profile?.role])

  useEffect(() => {
    fetchTenants()
  }, [])

  const fetchTenants = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('company_name', { ascending: true })

      if (error) {
        console.error('❌ Erreur chargement locataires:', error)
        console.error('Code:', error.code)
        console.error('Message:', error.message)
        console.error('Details:', error.details)
        console.error('Hint:', error.hint)
        throw error
      }
      
      console.log('✅ Locataires chargés:', data?.length || 0)
      setTenants(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('❌ Erreur chargement locataires:', error)
      alert('Erreur lors du chargement des locataires. Vérifiez la console (F12) pour plus de détails.')
      setTenants([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!canManage) return
    if (!confirm('Confirmer la suppression de ce locataire ?')) return

    try {
      const { error } = await supabase.from('tenants').delete().eq('id', id)
      if (error) throw error
      fetchTenants()
    } catch (error) {
      alert('Erreur suppression: ' + (error?.message || 'Erreur inconnue'))
    }
  }

  const filteredTenants = useMemo(() => {
    const q = (searchTerm || '').toLowerCase().trim()

    return tenants.filter((tenant) => {
      const company = String(tenant.company_name || '').toLowerCase()
      const contact = String(tenant.contact_name || '').toLowerCase()
      const email = String(tenant.email || '').toLowerCase()

      const matchesSearch = !q || company.includes(q) || contact.includes(q) || email.includes(q)

      const isActive = !!tenant.active
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && isActive) ||
        (statusFilter === 'inactive' && !isActive)

      return matchesSearch && matchesStatus
    })
  }, [tenants, searchTerm, statusFilter])

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
          <h2 className="text-3xl font-bold text-gray-900">Locataires</h2>
          <p className="text-gray-600 mt-1">
            Les locataires sont créés automatiquement lors de l'inscription
          </p>
        </div>

        {canManage && false ? (
          <button
            type="button"
            onClick={() => {
              setSelectedTenant(null)
              setShowModal(true)
            }}
            className="btn-primary flex items-center gap-2"
            disabled
            title="Les locataires sont créés automatiquement via l'inscription"
          >
            <Plus className="w-5 h-5" />
            Ajouter un locataire
          </button>
        ) : null}
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher par entreprise, contact ou email..."
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

      <div className="space-y-4">
        {filteredTenants.map((tenant) => (
          <div key={tenant.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xl font-bold text-gray-900">
                    {tenant.company_name || '-'}
                  </h3>
                  <span className={`badge ${tenant.active ? 'badge-success' : 'badge-danger'}`}>
                    {tenant.active ? 'Actif' : 'Inactif'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Contact</p>
                    <p className="font-medium">{tenant.contact_name || '-'}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email</p>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <p className="font-medium text-primary-600">{tenant.email || '-'}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Téléphone</p>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <p className="font-medium">{tenant.phone || '-'}</p>
                    </div>
                  </div>

                  {tenant.business_type ? (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Type d’activité</p>
                      <p className="font-medium">{tenant.business_type}</p>
                    </div>
                  ) : null}

                  {tenant.tax_id ? (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Identifiant fiscal</p>
                      <p className="font-medium">{tenant.tax_id}</p>
                    </div>
                  ) : null}

                  {tenant.registration_number ? (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Numéro d’enregistrement</p>
                      <p className="font-medium">{tenant.registration_number}</p>
                    </div>
                  ) : null}
                </div>

                {tenant.notes ? (
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">{tenant.notes}</p>
                  </div>
                ) : null}
              </div>

              {canManage ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTenant(tenant)
                      setShowModal(true)
                    }}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Modifier
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(tenant.id)}
                    className="btn-danger flex items-center gap-2"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {filteredTenants.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">Aucun locataire trouvé</p>
        </div>
      ) : null}

      {showModal ? (
        <TenantModal
          tenant={selectedTenant}
          onClose={() => {
            setShowModal(false)
            setSelectedTenant(null)
          }}
          onSuccess={() => {
            fetchTenants()
            setShowModal(false)
            setSelectedTenant(null)
          }}
        />
      ) : null}
    </div>
  )
}
