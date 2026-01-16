import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import {
  Store,
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Calendar,
  CheckCircle,
} from 'lucide-react'
import { isAfter, parseISO } from 'date-fns'

export default function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({
    totalShops: 0,
    occupiedShops: 0,
    vacantShops: 0,
    renovationShops: 0,
    totalTenants: 0,
    activeContracts: 0,
    monthlyRevenue: 0,
    unpaidInvoicesAmount: 0,
    unpaidInvoicesCount: 0,
    overdueInvoicesCount: 0,
  })

  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const safeNumber = (v) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : 0
  }

  const fetchDashboardData = async () => {
    try {
      console.log('🔍 [Dashboard] Début chargement...')
      const today = new Date()

      // Shops
      const { data: shops, error: shopsError } = await supabase
        .from('shops')
        .select('status, monthly_rent')

      if (shopsError) {
        console.error('❌ [Dashboard] Erreur shops:', shopsError)
        throw shopsError
      }
      console.log('✅ [Dashboard] Shops chargés:', shops?.length, shops)

      const totalShops = shops?.length || 0
      const occupiedShops = shops?.filter(s => s.status === 'occupied').length || 0
      const vacantShops = shops?.filter(s => s.status === 'vacant').length || 0
      const renovationShops = shops?.filter(s => s.status === 'under_renovation').length || 0

      // Tenants count
      const { count: totalTenants, error: tenantsCountError } = await supabase
        .from('tenants')
        .select('*', { count: 'exact', head: true })
        .eq('active', true)

      if (tenantsCountError) {
        console.error('❌ [Dashboard] Erreur tenants:', tenantsCountError)
        throw tenantsCountError
      }
      console.log('✅ [Dashboard] Tenants actifs:', totalTenants)

      // Active contracts
      const { data: contracts, error: contractsError } = await supabase
        .from('contracts')
        .select('status, monthly_rent, end_date')
        .eq('status', 'active')

      if (contractsError) {
        console.error('❌ [Dashboard] Erreur contracts:', contractsError)
        throw contractsError
      }
      console.log('✅ [Dashboard] Contrats actifs:', contracts?.length, contracts)

      const activeContracts = contracts?.length || 0

      // Monthly revenue = rent seulement (charges retirées car colonne peut ne pas exister)
      const monthlyRevenue =
        contracts?.reduce((sum, c) => {
          const rent = safeNumber(c.monthly_rent)
          return sum + rent
        }, 0) || 0

      // Expiring contracts (<= 90 jours)
      const expiringContracts =
        contracts?.filter(c => {
          if (!c.end_date) return false
          const endDate = parseISO(c.end_date)
          const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          return diffDays > 0 && diffDays <= 90
        }) || []

      // Unpaid invoices: montant + count + overdue count
      // ATTENTION: Votre base utilise 'amount_total' et statut 'unpaid'
      const { data: unpaidInvoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('invoice_number, amount_total, due_date, status')
        .in('status', ['unpaid', 'overdue', 'pending', 'sent'])

      if (invoicesError) {
        console.error('❌ [Dashboard] Erreur invoices:', invoicesError)
        throw invoicesError
      }
      console.log('✅ [Dashboard] Factures impayées:', unpaidInvoices?.length, unpaidInvoices)

      const unpaidInvoicesAmount =
        unpaidInvoices?.reduce((sum, inv) => sum + safeNumber(inv.amount_total), 0) || 0

      const unpaidInvoicesCount = unpaidInvoices?.length || 0

      const overdueInvoicesCount =
        unpaidInvoices?.filter(inv => {
          if (!inv.due_date) return false
          return isAfter(today, parseISO(inv.due_date))
        }).length || 0

      // Alerts
      const newAlerts = []

      if (vacantShops > 0) {
        newAlerts.push({
          type: 'warning',
          message: `${vacantShops} local${vacantShops > 1 ? 'x' : ''} vacant${vacantShops > 1 ? 's' : ''}`,
          icon: Store,
        })
      }

      expiringContracts.forEach(c => {
        const endDate = parseISO(c.end_date)
        const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        newAlerts.push({
          type: 'info',
          message: `Contrat qui expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`,
          icon: Calendar,
        })
      })

      if (overdueInvoicesCount > 0) {
        newAlerts.push({
          type: 'error',
          message: `${overdueInvoicesCount} facture${overdueInvoicesCount > 1 ? 's' : ''} en retard`,
          icon: AlertTriangle,
        })
      }

      setStats({
        totalShops,
        occupiedShops,
        vacantShops,
        renovationShops,
        totalTenants: totalTenants || 0,
        activeContracts,
        monthlyRevenue,
        unpaidInvoicesAmount,
        unpaidInvoicesCount,
        overdueInvoicesCount,
      })

      setAlerts(newAlerts)
      
      console.log('✅ [Dashboard] Stats finales:', {
        totalShops,
        occupiedShops,
        vacantShops,
        totalTenants,
        activeContracts,
        monthlyRevenue,
        unpaidInvoicesAmount,
        unpaidInvoicesCount
      })
    } catch (error) {
      console.error('❌ [Dashboard] Exception:', error)
    } finally {
      setLoading(false)
    }
  }

  const occupancyRate =
    stats.totalShops > 0 ? ((stats.occupiedShops / stats.totalShops) * 100).toFixed(1) : '0.0'

  const formatMoney = (amount) => {
    const n = Number(amount)
    if (Number.isNaN(n)) return '-'
    return `${n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} FCFA`
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="mt-1 text-sm text-gray-500">Vue globale du centre commercial</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Store className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Taux d’occupation</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{occupancyRate}%</div>
                    <div className="ml-2 text-sm text-gray-600">
                      {stats.occupiedShops}/{stats.totalShops}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-gray-600">{stats.vacantShops} vacant</span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Revenu mensuel</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatMoney(stats.monthlyRevenue)}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm text-green-600 flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              Contrats actifs
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Locataires actifs</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{stats.totalTenants}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm text-gray-600">{stats.activeContracts} contrats actifs</div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Factures impayées</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatMoney(stats.unpaidInvoicesAmount)}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm text-orange-600">
              {stats.unpaidInvoicesCount} facture{stats.unpaidInvoicesCount > 1 ? 's' : ''} (retard: {stats.overdueInvoicesCount})
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Alertes</h2>
          <div className="space-y-3">
            {alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`flex items-start p-4 rounded-lg ${
                  alert.type === 'error'
                    ? 'bg-red-50 border border-red-200'
                    : alert.type === 'warning'
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-blue-50 border border-blue-200'
                }`}
              >
                <alert.icon
                  className={`h-5 w-5 mt-0.5 ${
                    alert.type === 'error'
                      ? 'text-red-600'
                      : alert.type === 'warning'
                      ? 'text-yellow-600'
                      : 'text-blue-600'
                  }`}
                />
                <span
                  className={`ml-3 text-sm font-medium ${
                    alert.type === 'error'
                      ? 'text-red-800'
                      : alert.type === 'warning'
                      ? 'text-yellow-800'
                      : 'text-blue-800'
                  }`}
                >
                  {alert.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shop Status Distribution */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Répartition des locaux</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Occupés</span>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">{stats.occupiedShops}</p>
            <p className="mt-1 text-sm text-gray-500">
              {stats.totalShops > 0 ? ((stats.occupiedShops / stats.totalShops) * 100).toFixed(1) : '0.0'}% du total
            </p>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Vacants</span>
              <Store className="h-5 w-5 text-gray-400" />
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">{stats.vacantShops}</p>
            <p className="mt-1 text-sm text-gray-500">
              {stats.totalShops > 0 ? ((stats.vacantShops / stats.totalShops) * 100).toFixed(1) : '0.0'}% du total
            </p>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">En rénovation</span>
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">{stats.renovationShops}</p>
            <p className="mt-1 text-sm text-gray-500">
              {stats.totalShops > 0 ? ((stats.renovationShops / stats.totalShops) * 100).toFixed(1) : '0.0'}% du total
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
