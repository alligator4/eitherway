import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { Plus, Search, Edit2, Trash2, X, Mail, Phone, Building2 } from 'lucide-react'

export default function Tenants() {
  const { profile } = useAuth()

  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editingTenant, setEditingTenant] = useState(null)

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    active: true
  })

  useEffect(() => {
    fetchTenants()

    const channel = supabase
      .channel('tenants-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tenants' }, () => {
        fetchTenants()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchTenants = async () => {
    try {
      console.log('✅ Chargement des locataires depuis la table tenants...')

      const { data, error } = await supabase
        .from('tenants')
        .select(`
          *,
          profile:profiles(email, full_name, role)
        `)
        .order('company_name', { ascending: true })

      if (error) {
        console.error('❌ Erreur chargement locataires:', error)
        setTenants([])
        return
      }

      console.log('✅ Locataires chargés:', data?.length || 0, data)
      setTenants(data || [])
    } catch (err) {
      console.error('❌ Erreur in fetchTenants:', err)
      setTenants([])
    } finally {
      setLoading(false)
    }
  }

  const fixMissingEmails = async () => {
    try {
      // Récupérer tous les profils sans email
      const { data: profilesWithoutEmail, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .is('email', null)

      if (fetchError) throw fetchError

      if (profilesWithoutEmail && profilesWithoutEmail.length > 0) {
        console.log('Found profiles without email:', profilesWithoutEmail)

        // Pour chaque profil, essayer de récupérer l'email depuis auth.users
        for (const profile of profilesWithoutEmail) {
          try {
            // Note: Cette requête peut nécessiter des permissions spéciales
            const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.id)

            if (authError) {
              console.warn(`Could not get auth user for ${profile.id}:`, authError)
              continue
            }

            if (authUser?.user?.email) {
              const { error: updateError } = await supabase
                .from('profiles')
                .update({ email: authUser.user.email })
                .eq('id', profile.id)

              if (updateError) {
                console.error(`Failed to update email for ${profile.id}:`, updateError)
              } else {
                console.log(`Updated email for ${profile.id}: ${authUser.user.email}`)
              }
            }
          } catch (err) {
            console.error(`Error processing profile ${profile.id}:`, err)
          }
        }

        // Recharger les données
        fetchTenants()
      }
    } catch (err) {
      console.error('Error fixing missing emails:', err)
    }
  }

  const openCreate = () => {
    setEditingTenant(null)
    resetForm()
    setShowModal(true)
  }

  const openEdit = (tenant) => {
    setEditingTenant(tenant)
    setFormData({
      company_name: tenant.company_name || '',
      contact_name: tenant.contact_name || '',
      email: tenant.email || '',
      phone: tenant.phone || '',
      address: tenant.address || '',
      tax_id: tenant.tax_id || '',
      registration_number: tenant.registration_number || '',
      business_type: tenant.business_type || '',
      notes: tenant.notes || '',
      active: tenant.active ?? true
    })
    setShowModal(true)
  }

  const closeModal = () => {
    if (saving) return
    setShowModal(false)
    setEditingTenant(null)
    resetForm()
  }

  const canEdit = profile?.role === 'admin' || profile?.role === 'manager'

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!profile?.id) {
      alert('Profil utilisateur introuvable. Reconnectez vous.')
      return
    }

    setSaving(true)

    try {
      const tenantData = {
        company_name: String(formData.company_name || '').trim(),
        contact_name: String(formData.contact_name || '').trim(),
        email: String(formData.email || '').trim(),
        phone: String(formData.phone || '').trim(),
        address: String(formData.address || '').trim() || null,
        tax_id: String(formData.tax_id || '').trim() || null,
        registration_number: String(formData.registration_number || '').trim() || null,
        business_type: String(formData.business_type || '').trim() || null,
        notes: String(formData.notes || '').trim() || null,
        active: !!formData.active,
        created_by: profile.id
      }

      if (!tenantData.full_name) {
        alert('Nom complet requis')
        setSaving(false)
        return
      }
      if (!tenantData.email) {
        alert('Email requis')
        setSaving(false)
        return
      }

      if (editingTenant?.id) {
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: tenantData.full_name,
            email: tenantData.email,
            phone: tenantData.phone,
            active: tenantData.active
          })
          .eq('id', editingTenant.id)

        if (error) throw error
      } else {
        alert('Les locataires sont créés automatiquement lors de l\'inscription')
        setSaving(false)
        return
      }

      closeModal()
      fetchTenants()
    } catch (err) {
      console.error('Error saving tenant:', err)
      alert('Erreur lors de la sauvegarde: ' + (err?.message || ''))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Voulez vous désactiver ce locataire ? (Il pourra être réactivé plus tard)')) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ active: false })
        .eq('id', id)

      if (error) throw error
      fetchTenants()
    } catch (err) {
      console.error('Error deactivating tenant:', err)
      alert('Erreur lors de la désactivation: ' + (err?.message || ''))
    }
  }

  const filteredTenants = tenants.filter((tenant) => {
    const s = (v) => String(v || '').toLowerCase()
    const q = s(searchTerm)
    return s(tenant.full_name).includes(q) || s(tenant.email).includes(q) || s(tenant.phone).includes(q)
  })

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
          <h1 className="text-3xl font-bold text-gray-900">Locataires</h1>
          <p className="mt-1 text-sm text-gray-500">Gestion des marchands et contacts</p>
        </div>

        {canEdit && (
          <div className="flex items-center space-x-3">
            <button
              onClick={fixMissingEmails}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Mail className="h-4 w-4 mr-2" />
              Corriger emails manquants
            </button>
            <div className="text-sm text-gray-600">
              Les locataires sont créés automatiquement lors de l'inscription
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom ou email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Locataire</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coordonnees</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              {canEdit && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              )}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTenants.map((tenant) => (
              <tr key={tenant.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-primary-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{tenant.full_name}</div>
                      <div className="text-sm text-gray-500">Locataire</div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    {tenant.email || <span className="text-red-500 italic">Email manquant</span>}
                  </div>
                  {tenant.phone && (
                    <div className="text-sm text-gray-500 flex items-center mt-1">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      {tenant.phone}
                    </div>
                  )}
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      tenant.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {tenant.active ? 'Actif' : 'Inactif'}
                  </span>
                </td>

                {canEdit && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => openEdit(tenant)} className="text-primary-600 hover:text-primary-900 mr-4">
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDelete(tenant.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {filteredTenants.length === 0 && (
          <div className="p-10 text-center text-gray-500">Aucun locataire trouve</div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Modifier le locataire
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600" disabled={saving}>
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telephone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                    disabled={saving}
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      disabled={saving}
                    />
                    <span className="ml-2 text-sm text-gray-700">Actif</span>
                  </label>
                </div>
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
                  {saving ? 'Enregistrement...' : editingTenant ? 'Mettre a jour' : 'Creer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
