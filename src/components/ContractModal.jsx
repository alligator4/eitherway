import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { X } from 'lucide-react'

export default function ContractModal({ contract, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    shop_id: '',
    tenant_id: '',
    title: '',
    start_date: '',
    end_date: '',
    rent_amount: '',
    currency: 'EUR',
    status: 'active',
    notes: '',
  })

  const [shops, setShops] = useState([])
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchShopsAndTenants()
  }, [])

  useEffect(() => {
    if (contract) {
      setFormData({
        shop_id: contract.shop_id || '',
        tenant_id: contract.tenant_id || '',
        title: contract.title || '',
        start_date: contract.start_date || '',
        end_date: contract.end_date || '',
        rent_amount:
          contract.rent_amount === null || contract.rent_amount === undefined
            ? ''
            : String(contract.rent_amount),
        currency: contract.currency || 'EUR',
        status: contract.status || 'active',
        notes: contract.notes || '',
      })
      return
    }

    setFormData((prev) => ({
      ...prev,
      title: '',
      start_date: '',
      end_date: '',
      rent_amount: '',
      currency: 'EUR',
      status: 'active',
      notes: '',
    }))
  }, [contract])

  const fetchShopsAndTenants = async () => {
    try {
      const [shopsRes, tenantsRes] = await Promise.all([
        supabase
          .from('shops')
          .select('id, name, shop_number, floor, location')
          .order('name', { ascending: true }),
        supabase
          .from('tenants')
          .select('id, name, status')
          .order('name', { ascending: true }),
      ])

      if (shopsRes.error) throw shopsRes.error
      if (tenantsRes.error) throw tenantsRes.error

      setShops(Array.isArray(shopsRes.data) ? shopsRes.data : [])
      setTenants(Array.isArray(tenantsRes.data) ? tenantsRes.data : [])
    } catch (err) {
      console.error('Erreur de chargement (shops/tenants):', err)
    }
  }

  const activeTenants = useMemo(() => {
    return tenants.filter((t) => (t.status || 'active') === 'active')
  }, [tenants])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const rent = Number(formData.rent_amount)
      if (Number.isNaN(rent) || rent < 0) {
        setError('Le montant du loyer est invalide.')
        setLoading(false)
        return
      }

      const payload = {
        shop_id: formData.shop_id,
        tenant_id: formData.tenant_id,
        title: (formData.title || '').trim() || null,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        rent_amount: rent,
        currency: formData.currency || 'EUR',
        status: formData.status || 'active',
        notes: (formData.notes || '').trim() || null,
      }

      if (!payload.shop_id || !payload.tenant_id) {
        setError('Veuillez sélectionner un local et un locataire.')
        setLoading(false)
        return
      }

      if (!payload.start_date) {
        setError('La date de début est obligatoire.')
        setLoading(false)
        return
      }

      if (contract?.id) {
        const { error: updateError } = await supabase
          .from('contracts')
          .update(payload)
          .eq('id', contract.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('contracts')
          .insert([payload])

        if (insertError) throw insertError
      }

      onSuccess()
    } catch (err) {
      setError(err?.message || 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  const shopLabel = (shop) => {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">
            {contract ? 'Modifier le contrat' : 'Créer un contrat'}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
              {error}
            </div>
          ) : null}

          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Informations de base</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Statut</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="pending">En attente</option>
                  <option value="active">Actif</option>
                  <option value="terminated">Résilié</option>
                </select>
              </div>

              <div>
                <label className="label">Devise</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="input-field"
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="XAF">XAF</option>
                  <option value="MAD">MAD</option>
                </select>
              </div>

              <div>
                <label className="label">Locataire</label>
                <select
                  value={formData.tenant_id}
                  onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">Sélectionner un locataire</option>
                  {activeTenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Local</label>
                <select
                  value={formData.shop_id}
                  onChange={(e) => setFormData({ ...formData, shop_id: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">Sélectionner un local</option>
                  {shops.map((shop) => (
                    <option key={shop.id} value={shop.id}>
                      {shopLabel(shop)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="label">Titre (optionnel)</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                  placeholder="Ex: Bail boutique A - Année 2026"
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Période</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Date de début</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="label">Date de fin (optionnel)</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Conditions financières</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Loyer mensuel</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.rent_amount}
                  onChange={(e) => setFormData({ ...formData, rent_amount: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Informations complémentaires</h4>
            <div>
              <label className="label">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input-field"
                rows="4"
                placeholder="Informations internes, clauses, remarques..."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : contract ? 'Mettre à jour' : 'Créer'}
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
