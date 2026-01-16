import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import {
  Store,
  Users,
  FileText,
  DollarSign,
  AlertTriangle,
  Calendar
} from 'lucide-react'
import { format, addDays, differenceInDays } from 'date-fns'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalShops: 0,
    totalTenants: 0,
    activeContracts: 0,
    monthlyRevenue: 0,
    overdueInvoices: 0,
  })

  const [expiringContracts, setExpiringContracts] = useState([])
  const [overdueInvoices, setOverdueInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const formatMoney = (amount, currency = 'XAF') => {
    const n = Number(amount)
    if (Number.isNaN(n)) return '-'
    
    // Format spécial pour FCFA
    if (currency === 'XAF') {
      return `${n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} FCFA`
    }
    
    // Pour les autres devises, utiliser le format standard
    try {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(n)
    } catch {
      return `${n.toFixed(2)} ${currency}`
    }
  }

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      console.log('🔍 Chargement dashboard...')
      
      const [shopsRes, tenantsRes, contractsRes] = await Promise.all([
        supabase.from('shops').select('id, status', { count: 'exact' }),
        supabase
          .from('tenants')
          .select('id', { count: 'exact' })
          .eq('active', true),
        supabase
          .from('contracts')
          .select('*', { count: 'exact' })
          .eq('status', 'active'),
      ])

      if (shopsRes.error) {
        console.error('❌ Erreur shops:', shopsRes.error)
        throw shopsRes.error
      }
      if (tenantsRes.error) {
        console.error('❌ Erreur tenants:', tenantsRes.error)
        throw tenantsRes.error
      }
      if (contractsRes.error) {
        console.error('❌ Erreur contracts:', contractsRes.error)
        throw contractsRes.error
      }

      const totalShops = shopsRes.count || 0
      const totalTenants = tenantsRes.count || 0
      const activeContracts = contractsRes.count || 0

      const contracts = Array.isArray(contractsRes.data) ? contractsRes.data : []
      const monthlyRevenue = contracts.reduce((sum, c) => sum + Number(c.monthly_rent || 0), 0)

      console.log('✅ Stats:', { totalShops, totalTenants, activeContracts, monthlyRevenue })

      const ninetyDaysFromNow = format(addDays(new Date(), 90), 'yyyy-MM-dd')
      const expiring = contracts
        .filter((c) => c.end_date && c.end_date <= ninetyDaysFromNow)
        .sort((a, b) => String(a.end_date).localeCompare(String(b.end_date)))
        .slice(0, 5)

      const today = format(new Date(), 'yyyy-MM-dd')
      const overdueRes = await supabase
        .from('invoices')
        .select('*', { count: 'exact' })
        .in('status', ['unpaid', 'partial', 'overdue'])
        .lt('due_date', today)
        .order('due_date', { ascending: true })
        .limit(5)

      if (overdueRes.error) {
        console.error('❌ Erreur invoices:', overdueRes.error)
        throw overdueRes.error
      }

      console.log('✅ Factures en retard:', overdueRes.data?.length || 0)

      setStats({
        totalShops,
        totalTenants,
        activeContracts,
        monthlyRevenue,
        overdueInvoices: overdueRes.count || 0,
      })

      setExpiringContracts(expiring)
      setOverdueInvoices(Array.isArray(overdueRes.data) ? overdueRes.data : [])
    } catch (error) {
      console.error('Erreur lors du chargement du dashboard:', error)
      setStats({
        totalShops: 0,
        totalTenants: 0,
        activeContracts: 0,
        monthlyRevenue: 0,
        overdueInvoices: 0,
      })
      setExpiringContracts([])
      setOverdueInvoices([])
    } finally {
      setLoading(false)
    }
  }

  const expiringContractsUi = useMemo(() => expiringContracts, [expiringContracts])
  const overdueInvoicesUi = useMemo(() => overdueInvoices, [overdueInvoices])

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
        <h2 className="text-3xl font-bold text-gray-900">Tableau de bord</h2>
        <p className="text-gray-600 mt-1">Vue d’ensemble de la gestion du centre</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Locaux</p>
              <p className="text-3xl font-bold mt-1">{stats.totalShops}</p>
              <p className="text-blue-100 text-sm mt-2">Total enregistrés</p>
            </div>
            <Store className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Locataires actifs</p>
              <p className="text-3xl font-bold mt-1">{stats.totalTenants}</p>
              <p className="text-green-100 text-sm mt-2">Contrats actifs: {stats.activeContracts}</p>
            </div>
            <Users className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Revenu mensuel</p>
              <p className="text-3xl font-bold mt-1">
                {formatMoney(stats.monthlyRevenue, 'XAF')}
              </p>
              <p className="text-purple-100 text-sm mt-2">Somme des loyers actifs</p>
            </div>
            <DollarSign className="w-12 h-12 text-purple-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Factures en retard</p>
              <p className="text-3xl font-bold mt-1">{stats.overdueInvoices}</p>
              <p className="text-red-100 text-sm mt-2">À traiter</p>
            </div>
            <AlertTriangle className="w-12 h-12 text-red-200" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Contrats à échéance</h3>
          </div>

          {expiringContractsUi.length === 0 ? (
            <p className="text-gray-500 text-sm">Aucun contrat qui expire dans les 90 prochains jours</p>
          ) : (
            <div className="space-y-3">
              {expiringContractsUi.map((c) => {
                const daysLeft = differenceInDays(new Date(c.end_date), new Date())

                return (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Contrat #{c.id.substring(0, 8)}</p>
                      <p className="text-sm text-gray-600">Expire le {format(new Date(c.end_date), 'dd/MM/yyyy')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-orange-600">
                        {daysLeft >= 0 ? `${daysLeft} jours restants` : 'Expiré'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">Factures en retard</h3>
          </div>

          {overdueInvoicesUi.length === 0 ? (
            <p className="text-gray-500 text-sm">Aucune facture en retard</p>
          ) : (
            <div className="space-y-3">
              {overdueInvoicesUi.map((inv) => {
                const daysOverdue = differenceInDays(new Date(), new Date(inv.due_date))
                return (
                  <div key={inv.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Facture #{inv.invoice_number}</p>
                      <p className="text-sm text-gray-600">Échue depuis {daysOverdue} jours</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">
                        {formatMoney(inv.amount_total, inv.currency || 'XAF')}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
        </div>
        <p className="text-sm text-gray-600">
          Les statistiques d’occupation (occupé, vacant, rénovation) nécessitent une table ou un champ dédié.
          Si tu veux, je te propose la structure pour gérer l’occupation par historique (recommandé).
        </p>
      </div>
    </div>
  )
}
