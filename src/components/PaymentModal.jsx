import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { X } from 'lucide-react'
import { format } from 'date-fns'

export default function PaymentModal({ onClose, onSuccess }) {
  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), [])

  const [formData, setFormData] = useState({
    invoice_id: '',
    paid_at: today,
    amount: '',
    method: 'bank_transfer',
    reference: '',
    notes: '',
  })

  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchUnpaidInvoices()
  }, [])

  const fetchUnpaidInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          amount_total,
          currency,
          status,
          due_date,
          tenant:tenants(name),
          shop:shops(shop_number, name)
        `)
        .in('status', ['unpaid', 'partial', 'overdue'])
        .order('due_date', { ascending: true })

      if (error) throw error
      setInvoices(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Erreur chargement factures:', err)
      setInvoices([])
    }
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

  const statusLabel = (s) => {
    if (s === 'unpaid') return 'Impayée'
    if (s === 'partial') return 'Partielle'
    if (s === 'overdue') return 'En retard'
    if (s === 'paid') return 'Payée'
    if (s === 'cancelled') return 'Annulée'
    return s || '-'
  }

  const handleInvoiceSelect = (invoiceId) => {
    const inv = invoices.find((x) => x.id === invoiceId)
    if (!inv) {
      setFormData((prev) => ({ ...prev, invoice_id: invoiceId }))
      return
    }

    setFormData((prev) => ({
      ...prev,
      invoice_id: invoiceId,
      amount:
        inv.amount_total === null || inv.amount_total === undefined
          ? prev.amount
          : String(inv.amount_total),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const amount = Number(formData.amount)
      if (Number.isNaN(amount) || amount <= 0) {
        setError('Le montant doit être supérieur à 0.')
        setLoading(false)
        return
      }

      if (!formData.invoice_id) {
        setError('Veuillez sélectionner une facture.')
        setLoading(false)
        return
      }

      const { data: invoice, error: invErr } = await supabase
        .from('invoices')
        .select('id, amount_total, currency, status')
        .eq('id', formData.invoice_id)
        .single()

      if (invErr) throw invErr
      if (!invoice) throw new Error('Facture introuvable.')

      if (invoice.status === 'paid' || invoice.status === 'cancelled') {
        throw new Error('Cette facture ne peut pas être payée (payée ou annulée).')
      }

      const paymentData = {
        invoice_id: invoice.id,
        amount: amount,
        currency: invoice.currency || 'EUR',
        method: formData.method,
        paid_at: formData.paid_at,
        reference: formData.reference ? formData.reference.trim() : null,
        notes: formData.notes ? formData.notes.trim() : null,
      }

      const { error: insertError } = await supabase
        .from('payments')
        .insert([paymentData])

      if (insertError) throw insertError

      const invTotal = Number(invoice.amount_total || 0)
      const newStatus = amount >= invTotal ? 'paid' : 'partial'

      const { error: updErr } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', invoice.id)

      if (updErr) throw updErr

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
          <h3 className="text-xl font-bold text-gray-900">Enregistrer un paiement</h3>
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
              <label className="label">Date de paiement</label>
              <input
                type="date"
                value={formData.paid_at}
                onChange={(e) => setFormData({ ...formData, paid_at: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="label">Mode de paiement</label>
              <select
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                className="input-field"
                required
              >
                <option value="bank_transfer">Virement bancaire</option>
                <option value="cash">Espèces</option>
                <option value="check">Chèque</option>
                <option value="card">Carte</option>
                <option value="other">Autre</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="label">Facture</label>
              <select
                value={formData.invoice_id}
                onChange={(e) => handleInvoiceSelect(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Sélectionner une facture</option>
                {invoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoice_number} - {inv.tenant?.name || 'Locataire'} - {formatMoney(inv.amount_total, inv.currency)} ({statusLabel(inv.status)})
                  </option>
                ))}
              </select>

              {invoices.length === 0 ? (
                <p className="text-sm text-gray-500 mt-1">Aucune facture à payer</p>
              ) : null}
            </div>

            <div>
              <label className="label">Montant</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="label">Référence (optionnel)</label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                className="input-field"
                placeholder="Ex: identifiant virement, numéro chèque..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">Notes (optionnel)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input-field"
                rows="3"
                placeholder="Informations complémentaires..."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading || invoices.length === 0}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
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
