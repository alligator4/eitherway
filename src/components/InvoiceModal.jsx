import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { X } from 'lucide-react'
import { format, addMonths } from 'date-fns'

export default function InvoiceModal({ invoice, onClose, onSuccess }) {
  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), [])
  const nextMonth = useMemo(() => format(addMonths(new Date(), 1), 'yyyy-MM-dd'), [])

  const [formData, setFormData] = useState({
    invoice_number: '',
    contract_id: '',
    issue_date: today,
    due_date: nextMonth,
    amount_total: '',
    currency: 'EUR',
    status: 'unpaid',
    description: '',
  })

  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchContracts()

    if (invoice) {
      setFormData({
        invoice_number: invoice.invoice_number || '',
        contract_id: invoice.contract_id || '',
        issue_date: invoice.issue_date || today,
        due_date: invoice.due_date || nextMonth,
        amount_total:
          invoice.amount_total === null || invoice.amount_total === undefined
            ? ''
            : String(invoice.amount_total),
        currency: invoice.currency || 'EUR',
        status: invoice.status || 'unpaid',
        description: invoice.description || '',
      })
    } else {
      setFormData((prev) => ({
        ...prev,
        invoice_number: `FAC-${Date.now()}`,
      }))
    }
  }, [invoice, today, nextMonth])

  const fetchContracts = async () => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          id,
          title,
          rent_amount,
          currency,
          tenant_id,
          shop_id,
          tenant:tenants(company_name, contact_name),
          shop:shops(shop_number, name),
          status
        `)
        .eq('status', 'active')
        .order('start_date', { ascending: false })

      if (error) throw error
      setContracts(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Erreur chargement contrats:', err)
    }
  }

  const contractLabel = (c) => {
    const tenantName = c.tenant?.company_name || 'Locataire'
    const contactName = c.tenant?.contact_name ? ` (${c.tenant.contact_name})` : ''
    const fullTenantName = `${tenantName}${contactName}`
    const shopLabel = c.shop?.shop_number || c.shop?.name || 'Local'
    const title = (c.title || '').trim()
    if (title) return `${title} - ${fullTenantName} - ${shopLabel}`
    return `${fullTenantName} - ${shopLabel}`
  }

  const handleContractSelect = (contractId) => {
    const c = contracts.find((x) => x.id === contractId)
    if (!c) {
      setFormData((prev) => ({ ...prev, contract_id: contractId }))
      return
    }

    setFormData((prev) => ({
      ...prev,
      contract_id: contractId,
      currency: c.currency || prev.currency || 'EUR',
      amount_total:
        c.rent_amount === null || c.rent_amount === undefined
          ? prev.amount_total
          : String(c.rent_amount),
      description: prev.description || `Loyer - ${contractLabel(c)}`,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const amount = Number(formData.amount_total)
      if (Number.isNaN(amount) || amount < 0) {
        setError('Le montant total est invalide.')
        setLoading(false)
        return
      }

      if (!formData.contract_id) {
        setError('Veuillez sélectionner un contrat.')
        setLoading(false)
        return
      }

      if (!formData.issue_date || !formData.due_date) {
        setError('Veuillez renseigner la date d’émission et la date d’échéance.')
        setLoading(false)
        return
      }

      const { data: contract, error: contractErr } = await supabase
        .from('contracts')
        .select('tenant_id, shop_id')
        .eq('id', formData.contract_id)
        .single()

      if (contractErr) throw contractErr
      if (!contract) throw new Error('Contrat introuvable.')

      const invoiceData = {
        invoice_number: formData.invoice_number,
        contract_id: formData.contract_id,
        tenant_id: contract.tenant_id,
        shop_id: contract.shop_id,
        issue_date: formData.issue_date,
        due_date: formData.due_date,
        amount_total: amount,
        currency: formData.currency || 'EUR',
        status: formData.status || 'unpaid',
        description: (formData.description || '').trim() || null,
      }

      if (invoice?.id) {
        const { error: updateError } = await supabase
          .from('invoices')
          .update(invoiceData)
          .eq('id', invoice.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('invoices')
          .insert([invoiceData])

        if (insertError) throw insertError
      }

      onSuccess()
    } catch (err) {
      setError(err?.message || 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  const totalPreview = useMemo(() => {
    const n = Number(formData.amount_total)
    if (Number.isNaN(n)) return 0
    return n
  }, [formData.amount_total])

  const currencyPreview = formData.currency || 'EUR'
  const formatMoney = (n) => {
    try {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currencyPreview }).format(n)
    } catch {
      return `${n.toFixed(2)} ${currencyPreview}`
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">
            {invoice ? 'Modifier la facture' : 'Créer une facture'}
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
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Détails de la facture</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Numéro de facture</label>
                <input
                  type="text"
                  value={formData.invoice_number}
                  onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                  className="input-field"
                  required
                  readOnly={!!invoice}
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
                  <option value="unpaid">Impayée</option>
                  <option value="partial">Partielle</option>
                  <option value="paid">Payée</option>
                  <option value="overdue">En retard</option>
                  <option value="cancelled">Annulée</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="label">Contrat</label>
                <select
                  value={formData.contract_id}
                  onChange={(e) => handleContractSelect(e.target.value)}
                  className="input-field"
                  required
                  disabled={!!invoice}
                >
                  <option value="">Sélectionner un contrat</option>
                  {contracts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {contractLabel(c)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Dates</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Date d’émission</label>
                <input
                  type="date"
                  value={formData.issue_date}
                  onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="label">Date d’échéance</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Montant</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <label className="label">Montant total</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount_total}
                  onChange={(e) => setFormData({ ...formData, amount_total: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div className="bg-green-50 p-4 rounded-lg md:col-span-2">
                <p className="text-sm text-green-700 font-medium mb-1">Aperçu total</p>
                <p className="text-2xl font-bold text-green-600">{formatMoney(totalPreview)}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="label">Description (optionnel)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field"
              rows="3"
              placeholder="Ex: Loyer du mois, pénalités, informations de paiement..."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : invoice ? 'Mettre à jour' : 'Créer'}
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
