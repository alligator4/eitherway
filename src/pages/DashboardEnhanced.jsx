import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Building2, 
  Users, 
  FileText, 
  Receipt, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Clock,
  Euro
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function DashboardEnhanced() {
  const [stats, setStats] = useState(null)
  const [recentContracts, setRecentContracts] = useState([])
  const [upcomingExpiries, setUpcomingExpiries] = useState([])
  const [overdueInvoices, setOverdueInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [statsRes, contractsRes, expiriesRes, invoicesRes] = await Promise.all([
        supabase.from('dashboard_stats').select('*').single(),
        supabase
          .from('contracts_full')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('contracts_full')
          .select('*')
          .eq('status', 'active')
          .gte('end_date', new Date().toISOString().split('T')[0])
          .lte('end_date', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .order('end_date', { ascending: true })
          .limit(5),
        supabase
          .from('invoices_full')
          .select('*')
          .eq('status', 'overdue')
          .order('due_date', { ascending: true })
          .limit(5)
      ])

      if (statsRes.error) throw statsRes.error
      if (contractsRes.error) throw contractsRes.error
      if (expiriesRes.error) throw expiriesRes.error
      if (invoicesRes.error) throw invoicesRes.error

      setStats(statsRes.data || {})
      setRecentContracts(contractsRes.data || [])
      setUpcomingExpiries(expiriesRes.data || [])
      setOverdueInvoices(invoicesRes.data || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0)
  }

  const formatDate = (date) => {
    if (!date) return '-'
    try {
      return new Date(date).toLocaleDateString('fr-FR')
    } catch {
      return '-'
    }
  }

  if (loading) {
    return <LoadingSpinner fullScreen text="Chargement du tableau de bord..." />
  }

  const statCards = [
    {
      title: 'Locataires actifs',
      value: stats?.active_tenants || 0,
      icon: Users,
      color: 'bg-blue-500',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Locaux occupés',
      value: stats?.occupied_shops || 0,
      icon: Building2,
      color: 'bg-green-500',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      subtitle: `${stats?.vacant_shops || 0} disponibles`
    },
    {
      title: 'Contrats actifs',
      value: stats?.active_contracts || 0,
      icon: FileText,
      color: 'bg-purple-500',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Factures en retard',
      value: stats?.overdue_invoices || 0,
      icon: AlertCircle,
      color: 'bg-red-500',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600'
    },
    {
      title: 'Paiements en attente',
      value: formatCurrency(stats?.pending_payments || 0),
      icon: Clock,
      color: 'bg-orange-500',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600'
    },
    {
      title: 'Revenus du mois',
      value: formatCurrency(stats?.current_month_revenue || 0),
      icon: TrendingUp,
      color: 'bg-emerald-500',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Tableau de bord</h2>
        <p className="text-gray-600 mt-1">Vue d'ensemble de votre centre commercial</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                {card.subtitle && (
                  <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
                )}
              </div>
              <div className={`${card.iconBg} p-3 rounded-lg`}>
                <card.icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Contrats récents</h3>
            <a href="/contracts" className="text-sm text-primary-600 hover:text-primary-700">
              Voir tout
            </a>
          </div>
          
          {recentContracts.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">Aucun contrat récent</p>
          ) : (
            <div className="space-y-3">
              {recentContracts.map(contract => (
                <div key={contract.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="bg-primary-100 p-2 rounded-lg">
                    <FileText className="w-4 h-4 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {contract.tenant_name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {contract.shop_number} • {formatCurrency(contract.monthly_rent)}/mois
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(contract.created_at), { 
                        addSuffix: true,
                        locale: fr 
                      })}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    contract.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {contract.status === 'active' ? 'Actif' : contract.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Contrats à renouveler</h3>
            <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
              {upcomingExpiries.length}
            </span>
          </div>
          
          {upcomingExpiries.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Aucun contrat à renouveler prochainement</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingExpiries.map(contract => {
                const daysUntilExpiry = Math.ceil(
                  (new Date(contract.end_date) - new Date()) / (1000 * 60 * 60 * 24)
                )
                return (
                  <div key={contract.id} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="bg-orange-100 p-2 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {contract.tenant_name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {contract.shop_number}
                      </p>
                      <p className="text-xs font-medium text-orange-600 mt-1">
                        Expire dans {daysUntilExpiry} jour{daysUntilExpiry > 1 ? 's' : ''} ({formatDate(contract.end_date)})
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {overdueInvoices.length > 0 && (
        <div className="card bg-red-50 border border-red-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-semibold text-red-900">Factures en retard</h3>
            </div>
            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
              {overdueInvoices.length}
            </span>
          </div>
          
          <div className="space-y-3">
            {overdueInvoices.map(invoice => {
              const daysOverdue = Math.ceil(
                (new Date() - new Date(invoice.due_date)) / (1000 * 60 * 60 * 24)
              )
              return (
                <div key={invoice.id} className="flex items-start gap-3 p-3 bg-white rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900">
                        {invoice.invoice_number}
                      </p>
                      <p className="text-sm font-bold text-red-600">
                        {formatCurrency(invoice.balance_due)}
                      </p>
                    </div>
                    <p className="text-xs text-gray-600">
                      {invoice.tenant_name}
                    </p>
                    <p className="text-xs text-red-600 mt-1 font-medium">
                      En retard de {daysOverdue} jour{daysOverdue > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
