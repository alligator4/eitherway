import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { X } from 'lucide-react'

export default function ShopModal({ shop, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    shop_number: '',
    name: '',
    status: 'vacant',
    surface_area: '',
    floor: '',
    location: '',
    activity_category: '',
    monthly_rent: '',
    description: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!shop) {
      setFormData({
        shop_number: '',
        name: '',
        status: 'vacant',
        surface_area: '',
        floor: '',
        location: '',
        activity_category: '',
        monthly_rent: '',
        description: '',
      })
      return
    }

    setFormData({
      shop_number: shop.shop_number || '',
      name: shop.name || '',
      status: shop.status || 'vacant',
      surface_area: shop.surface_area ?? '',
      floor: shop.floor || '',
      location: shop.location || '',
      activity_category: shop.activity_category || '',
      monthly_rent: shop.monthly_rent ?? '',
      description: shop.description || '',
    })
  }, [shop])

  const toNumberOrNull = (v) => {
    const s = String(v ?? '').trim()
    if (!s) return null
    const n = Number(s)
    return Number.isNaN(n) ? null : n
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const surface = toNumberOrNull(formData.surface_area)
      if (surface === null) {
        setError('La surface est obligatoire.')
        setLoading(false)
        return
      }

      const shopData = {
        shop_number: String(formData.shop_number || '').trim(),
        name: String(formData.name || '').trim() || null,
        status: formData.status,
        surface_area: surface,
        floor: String(formData.floor || '').trim(),
        location: String(formData.location || '').trim(),
        activity_category: String(formData.activity_category || '').trim() || null,
        monthly_rent: toNumberOrNull(formData.monthly_rent),
        description: String(formData.description || '').trim() || null,
      }

      if (!shopData.shop_number) {
        setError('Le numéro du local est obligatoire.')
        setLoading(false)
        return
      }
      if (!shopData.floor) {
        setError('L’étage est obligatoire.')
        setLoading(false)
        return
      }
      if (!shopData.location) {
        setError('L’emplacement est obligatoire.')
        setLoading(false)
        return
      }

      if (shop) {
        const { error: updateError } = await supabase
          .from('shops')
          .update(shopData)
          .eq('id', shop.id)

        if (updateError) throw updateError
      } else {
        const { data: { user } } = await supabase.auth.getUser()

        const { error: insertError } = await supabase
          .from('shops')
          .insert([{ ...shopData, created_by: user?.id || null }])

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
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">
            {shop ? 'Modifier un local' : 'Ajouter un local'}
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
              <label className="label">Numéro du local</label>
              <input
                type="text"
                value={formData.shop_number}
                onChange={(e) => setFormData({ ...formData, shop_number: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="label">Nom du local (optionnel)</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="label">Statut</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input-field"
                required
              >
                <option value="vacant">Disponible</option>
                <option value="occupied">Occupé</option>
                <option value="under_renovation">En rénovation</option>
              </select>
            </div>

            <div>
              <label className="label">Surface (m²)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.surface_area}
                onChange={(e) => setFormData({ ...formData, surface_area: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="label">Étage</label>
              <input
                type="text"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                className="input-field"
                placeholder="Ex: RDC, 1er étage"
                required
              />
            </div>

            <div>
              <label className="label">Emplacement</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="input-field"
                placeholder="Ex: Aile Nord, près de l’entrée"
                required
              />
            </div>

            <div>
              <label className="label">Catégorie d’activité (optionnel)</label>
              <input
                type="text"
                value={formData.activity_category}
                onChange={(e) => setFormData({ ...formData, activity_category: e.target.value })}
                className="input-field"
                placeholder="Ex: vêtements, restauration, électronique"
              />
            </div>

            <div>
              <label className="label">Loyer mensuel (optionnel)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.monthly_rent}
                onChange={(e) => setFormData({ ...formData, monthly_rent: e.target.value })}
                className="input-field"
                placeholder="Ex: 1500"
              />
            </div>
          </div>

          <div>
            <label className="label">Description (optionnel)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field"
              rows="3"
              placeholder="Notes sur le local..."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : shop ? 'Mettre à jour' : 'Créer'}
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
