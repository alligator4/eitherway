import { useMemo, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { Plus, Edit2, Trash2, Search, FileText } from 'lucide-react'
import { format } from 'date-fns'
import InvoiceModal from './InvoiceModal'

export default function InvoicesPage() {
  const { profile } = useAuth()

  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)

  const canManage = useMemo(() => {
    const r = profile?.role
    return r === 'admin' || r === 'manager' || r === 'accountant'
  }, [profile?.role])

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          contract_id,
          tenant_id,
          shop_id,
          issue_date,
          due_date,
          amount_total,
          currency,
          status,
          description,
          created_at,
          tenant:tenants(id, name, email),
          shop:shops(id, shop_number, name),
          contract:contracts(id, title)
        `)
        .order('issue_date', { ascending: false })

      if (error) throw error
      setInvoices(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Erreur lors du chargement des factures:', error)
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!canManage) return
    if (!confirm('Confirmer la suppression de cette facture ?')) return

    try {
      const { error } = await supabase.from('invoices').delete().eq('id', id)
      if (error) throw error
      fetchInvoices()
    } catch (error) {
      alert('Erreur suppression: ' + (error?.message || 'Erreur inconnue'))
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    if (!canManage) return

    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error
      fetchInvoices()
    } catch (error) {
      alert('Erreur mise à jour statut: ' + (error?.message || 'Erreur inconnue'))
    }
  }

  const filteredInvoices = useMemo(() => {
    const q = (searchTerm || '').toLowerCase().trim()

    return invoices.filter((inv) => {
      const matchesSearch =
        !q ||
        (inv.invoice_number || '').toLowerCase().includes(q) ||
        (inv.tenant?.name || '').toLowerCase().includes(q) ||
        (inv.contract?.title || '').toLowerCase().includes(q)

      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [invoices, searchTerm, statusFilter])

  const statusLabel = (statusRaw) => {
    const s = (statusRaw || '').toLowerCase()
    if (s === 'unpaid') return 'Impayée'
    if (s === 'partial') return 'Partielle'
    if (s === 'paid') return 'Payée'
    if (s === 'overdue') return 'En retard'
    if (s === 'cancelled') return 'Annulée'
    return statusRaw || '-'
  }

  const getStatusBadge = (statusRaw) => {
    const s = (statusRaw || '').toLowerCase()
    const styles = {
      unpaid: 'badge-warning',
      partial: 'badge-info',
      paid: 'badge-success',
      overdue: 'badge-danger',
      cancelled: 'bg-gray-100 text-gray-800',
    }
    return <span className={`badge ${styles[s] || 'badge-info'}`}>{statusLabel(s)}</span>
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

  const getTotalStats = useMemo(() => {
    const total = filteredInvoices.reduce((sum, inv) => sum + Number(inv.amount_total || 0), 0)
    const paid = filteredInvoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + Number(inv.amount_total || 0), 0)

    const pending = filteredInvoices
      .filter((inv) => ['unpaid', 'partial', 'overdue'].includes(inv.status))
      .reduce((sum, inv) => sum + Number(inv.amount_total || 0), 0)

    return { total, paid, pending }
  }, [filteredInvoices])

  const fmtDate = (d) => {
    if (!d) return '-'
    try {
      return format(new Date(d), 'dd/MM/yyyy')
    } catch {
      return '-'
    }
  }

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
          <h2 className="text-3xl font-bold text-gray-900">Factures</h2>
          <p className="text-gray-600 mt-1">Création et suivi des factures</p>
        </div>

        {canManage ? (
          <button
            type="button"
            onClick={() => {
              setSelectedInvoice(null)
              setShowModal(true)
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nouvelle facture
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <p className="text-blue-100 text-sm font-medium mb-1">Total facturé</p>
          <p className="text-3xl font-bold">
            {formatMoney(getTotalStats.total, 'EUR')}
          </p>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <p className="text-green-100 text-sm font-medium mb-1">Payé</p>
          <p className="text-3xl font-bold">
            {formatMoney(getTotalStats.paid, 'EUR')}
          </p>
        </div>

        <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <p className="text-orange-100 text-sm font-medium mb-1">À encaisser</p>
          <p className="text-3xl font-bold">
            {formatMoney(getTotalStats.pending, 'EUR')}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher par numéro, locataire ou contrat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-56"
          >
            <option value="all">Tous les statuts</option>
            <option value="unpaid">Impayée</option>
            <option value="partial">Partielle</option>
            <option value="paid">Payée</option>
            <option value="overdue">En retard</option>
            <option value="cancelled">Annulée</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredInvoices.map((inv) => (
          <div key={inv.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <FileText className="w-6 h-6 text-primary-600" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{inv.invoice_number}</h3>
                    <p className="text-sm text-gray-600">{inv.tenant?.name || '-'}</p>
                  </div>
                  {getStatusBadge(inv.status)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Date d’émission</p>
                    <p className="font-medium">{fmtDate(inv.issue_date)}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Échéance</p>
                    <p className="font-medium">{fmtDate(inv.due_date)}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Contrat</p>
                    <p className="text-sm font-medium">{inv.contract?.title || '-'}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Montant</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatMoney(inv.amount_total, inv.currency || 'EUR')}
                    </p>
                  </div>
                </div>

                {inv.description ? (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{inv.description}</p>
                  </div>
                ) : null}
              </div>

              {canManage ? (
                <div className="flex flex-col gap-2 ml-4">
                  {inv.status !== 'paid' && inv.status !== 'cancelled' ? (
                    <select
                      value={inv.status}
                      onChange={(e) => handleStatusChange(inv.id, e.target.value)}
                      className="input-field text-sm"
                    >
                      <option value="unpaid">Impayée</option>
                      <option value="partial">Partielle</option>
                      <option value="paid">Payée</option>
                      <option value="overdue">En retard</option>
                      <option value="cancelled">Annulée</option>
                    </select>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedInvoice(inv)
                      setShowModal(true)
                    }}
                    className="btn-secondary flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Modifier
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(inv.id)}
                    className="btn-danger flex items-center justify-center gap-2"
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

      {filteredInvoices.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">Aucune facture trouvée</p>
        </div>
      ) : null}

      {showModal ? (
        <InvoiceModal
          invoice={selectedInvoice}
          onClose={() => {
            setShowModal(false)
            setSelectedInvoice(null)
          }}
          onSuccess={() => {
            fetchInvoices()
            setShowModal(false)
            setSelectedInvoice(null)
          }}
        />
      ) : null}
    </div>
  )
}
