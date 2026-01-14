import { useMemo, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { Plus, Trash2, Search, DollarSign, CreditCard } from 'lucide-react'
import { format } from 'date-fns'
import PaymentModal from './PaymentModal'

export default function PaymentsPage() {
  const { profile } = useAuth()

  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)

  const canManage = useMemo(() => {
    const r = profile?.role
    return r === 'admin' || r === 'manager' || r === 'accountant'
  }, [profile?.role])

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          id,
          invoice_id,
          amount,
          currency,
          method,
          paid_at,
          reference,
          notes,
          created_at,
          invoice:invoices(id, invoice_number, amount_total, currency),
          tenant:tenants(id, name)
        `)
        .order('paid_at', { ascending: false })

      if (error) throw error
      setPayments(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Erreur chargement paiements:', error)
      setPayments([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!canManage) return
    if (!confirm('Confirmer la suppression de ce paiement ?')) return

    try {
      const { error } = await supabase.from('payments').delete().eq('id', id)
      if (error) throw error
      fetchPayments()
    } catch (error) {
      alert('Erreur suppression: ' + (error?.message || 'Erreur inconnue'))
    }
  }

  const methodLabel = (m) => {
    if (m === 'bank_transfer') return 'Virement bancaire'
    if (m === 'cash') return 'Espèces'
    if (m === 'check') return 'Chèque'
    if (m === 'card') return 'Carte'
    if (m === 'other') return 'Autre'
    return m || '-'
  }

  const getPaymentMethodBadge = (method) => {
    const styles = {
      cash: 'bg-green-100 text-green-800',
      check: 'bg-blue-100 text-blue-800',
      bank_transfer: 'bg-purple-100 text-purple-800',
      card: 'bg-pink-100 text-pink-800',
      other: 'bg-gray-100 text-gray-800',
    }
    return (
      <span className={`badge ${styles[method] || 'bg-gray-100 text-gray-800'}`}>
        {methodLabel(method)}
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

  const fmtDate = (d) => {
    if (!d) return '-'
    try {
      return format(new Date(d), 'dd/MM/yyyy')
    } catch {
      return '-'
    }
  }

  const filteredPayments = useMemo(() => {
    const q = (searchTerm || '').toLowerCase().trim()

    return payments.filter((p) => {
      if (!q) return true

      const amountStr = String(p.amount ?? '')
      const invoiceNumber = (p.invoice?.invoice_number || '').toLowerCase()
      const tenantName = (p.tenant?.name || '').toLowerCase()
      const ref = (p.reference || '').toLowerCase()
      const method = methodLabel(p.method).toLowerCase()

      return (
        amountStr.includes(q) ||
        invoiceNumber.includes(q) ||
        tenantName.includes(q) ||
        ref.includes(q) ||
        method.includes(q)
      )
    })
  }, [payments, searchTerm])

  const totalsByCurrency = useMemo(() => {
    const map = new Map()
    for (const p of filteredPayments) {
      const cur = p.currency || 'EUR'
      const val = Number(p.amount || 0)
      map.set(cur, (map.get(cur) || 0) + (Number.isNaN(val) ? 0 : val))
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [filteredPayments])

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
          <h2 className="text-3xl font-bold text-gray-900">Paiements</h2>
          <p className="text-gray-600 mt-1">Suivi et enregistrement des paiements</p>
        </div>

        {canManage ? (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Enregistrer un paiement
          </button>
        ) : null}
      </div>

      <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-100 text-sm font-medium mb-1">Total encaissé</p>

            {totalsByCurrency.length === 0 ? (
              <p className="text-3xl font-bold">0</p>
            ) : (
              <div className="space-y-1">
                {totalsByCurrency.map(([cur, val]) => (
                  <p key={cur} className="text-3xl font-bold">
                    {formatMoney(val, cur)}
                  </p>
                ))}
              </div>
            )}

            <p className="text-green-100 text-sm mt-2">{filteredPayments.length} transaction(s)</p>
          </div>

          <DollarSign className="w-16 h-16 text-green-200" />
        </div>
      </div>

      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher: facture, locataire, référence, méthode, montant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredPayments.map((p) => (
          <div key={p.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <CreditCard className="w-6 h-6 text-green-600" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Paiement {p.invoice?.invoice_number ? `pour ${p.invoice.invoice_number}` : ''}
                    </h3>
                    <p className="text-sm text-gray-600">{p.tenant?.name || 'Locataire'}</p>
                  </div>
                  {getPaymentMethodBadge(p.method)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Date</p>
                    <p className="font-medium">{fmtDate(p.paid_at)}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Montant</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatMoney(p.amount, p.currency || 'EUR')}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Facture</p>
                    <p className="font-medium">{p.invoice?.invoice_number || '-'}</p>
                    {p.invoice?.amount_total !== null && p.invoice?.amount_total !== undefined ? (
                      <p className="text-xs text-gray-500">
                        Total facture: {formatMoney(p.invoice.amount_total, p.invoice.currency || 'EUR')}
                      </p>
                    ) : null}
                  </div>

                  {p.reference ? (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Référence</p>
                      <p className="font-medium text-sm">{p.reference}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Référence</p>
                      <p className="font-medium text-sm">-</p>
                    </div>
                  )}
                </div>

                {p.notes ? (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{p.notes}</p>
                  </div>
                ) : null}
              </div>

              {canManage ? (
                <button
                  type="button"
                  onClick={() => handleDelete(p.id)}
                  className="btn-danger flex items-center gap-2 ml-4"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {filteredPayments.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">Aucun paiement trouvé</p>
        </div>
      ) : null}

      {showModal ? (
        <PaymentModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            fetchPayments()
            setShowModal(false)
          }}
        />
      ) : null}
    </div>
  )
}
