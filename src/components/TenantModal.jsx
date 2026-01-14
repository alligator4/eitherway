import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { X } from 'lucide-react'

export default function TenantModal({ tenant, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    tax_id: '',
    registration_number: '',
    business_type: '',
    notes: '',
    active: true,
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!tenant) {
      setFormData({
        company_name: '',
        contact_name: '',
        email: '',
        phone: '',
        address: '',
        tax_id: '',
        registration_number: '',
        business_type: '',
        notes: '',
        active: true,
      })
      return
    }

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
      active: tenant.active ?? true,
    })
  }, [tenant])

  const normalizeEmail = (v) => String(v || '').trim().toLowerCase()
  const normalizeText = (v) => String(v || '').trim()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const company = normalizeText(formData.company_name)
      const contact = normalizeText(formData.contact_name)
      const email = normalizeEmail(formData.email)
      const phone = normalizeText(formData.phone)

      if (!company) {
        setError('Le nom de l’entreprise est obligatoire.')
        setLoading(false)
        return
      }
      if (!contact) {
        setError('Le nom du contact est obligatoire.')
        setLoading(false)
        return
      }
      if (!email) {
        setError('L’email est obligatoire.')
        setLoading(false)
        return
      }
      if (!phone) {
        setError('Le téléphone est obligatoire.')
        setLoading(false)
        return
      }

      const tenantData = {
        company_name: company,
        contact_name: contact,
        email,
        phone,
        address: normalizeText(formData.address) || null,
        tax_id: normalizeText(formData.tax_id) || null,
        registration_number: normalizeText(formData.registration_number) || null,
        business_type: normalizeText(formData.business_type) || null,
        notes: normalizeText(formData.notes) || null,
        active: !!formData.active,
      }

      if (tenant) {
        const { error: updateError } = await supabase
          .from('tenants')
          .update(tenantData)
          .eq('id', tenant.id)

        if (updateError) throw updateError
      } else {
        const { data: { user } } = await supabase.auth.getUser()

        const { error: insertError } = await supabase
          .from('tenants')
          .insert([{ ...tenantData, created_by: user?.id || null }])

        if (insertError) throw insertError
      }

      onSuccess()
    } catch (err) {
      setError(err?.message || 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">
            {tenant ? 'Modifier un locataire' : 'Ajouter un locataire'}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Entreprise</label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="label">Contact</label>
              <input
                type="text"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="label">Téléphone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="label">Type d’activité (optionnel)</label>
              <input
                type="text"
                value={formData.business_type}
                onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                className="input-field"
                placeholder="Ex: prêt-à-porter, restauration, services"
              />
            </div>

            <div>
              <label className="label">Identifiant fiscal (optionnel)</label>
              <input
                type="text"
                value={formData.tax_id}
                onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="label">Numéro d’enregistrement (optionnel)</label>
              <input
                type="text"
                value={formData.registration_number}
                onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="label">Statut</label>
              <select
                value={formData.active ? 'active' : 'inactive'}
                onChange={(e) => setFormData({ ...formData, active: e.target.value === 'active' })}
                className="input-field"
              >
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Adresse (optionnel)</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input-field"
              rows="2"
              placeholder="Adresse de l’entreprise..."
            />
          </div>

          <div>
            <label className="label">Notes (optionnel)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input-field"
              rows="3"
              placeholder="Informations supplémentaires..."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : tenant ? 'Mettre à jour' : 'Créer'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
