import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function DebugDashboard() {
  const [debug, setDebug] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    runDebug()
  }, [])

  const runDebug = async () => {
    setLoading(true)
    const results = {}

    try {
      console.log('🔍 [DEBUG] Début diagnostic complet...')

      // 1. Test Shops
      const { data: shops, error: shopsError } = await supabase
        .from('shops')
        .select('*')
      
      results.shops = {
        error: shopsError?.message,
        count: shops?.length || 0,
        sample: shops?.[0] || null,
        statuses: shops?.reduce((acc, s) => {
          acc[s.status] = (acc[s.status] || 0) + 1
          return acc
        }, {})
      }
      console.log('✅ [DEBUG] Shops:', results.shops)

      // 2. Test Tenants
      const { data: tenants, error: tenantsError } = await supabase
        .from('tenants')
        .select('*')
      
      results.tenants = {
        error: tenantsError?.message,
        count: tenants?.length || 0,
        sample: tenants?.[0] || null,
        active: tenants?.filter(t => t.active === true).length || 0
      }
      console.log('✅ [DEBUG] Tenants:', results.tenants)

      // 3. Test Contracts
      const { data: contracts, error: contractsError } = await supabase
        .from('contracts')
        .select('*')
      
      results.contracts = {
        error: contractsError?.message,
        count: contracts?.length || 0,
        sample: contracts?.[0] || null,
        statuses: contracts?.reduce((acc, c) => {
          acc[c.status] = (acc[c.status] || 0) + 1
          return acc
        }, {}),
        totalRent: contracts?.reduce((sum, c) => sum + Number(c.monthly_rent || 0), 0)
      }
      console.log('✅ [DEBUG] Contracts:', results.contracts)

      // 4. Test Invoices - CRITIQUE
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
      
      results.invoices = {
        error: invoicesError?.message,
        count: invoices?.length || 0,
        sample: invoices?.[0] || null,
        columns: invoices?.[0] ? Object.keys(invoices[0]) : [],
        hasTotal: invoices?.[0] ? 'total_amount' in invoices[0] : false,
        hasAmount: invoices?.[0] ? 'amount_total' in invoices[0] : false,
        statuses: invoices?.reduce((acc, i) => {
          acc[i.status] = (acc[i.status] || 0) + 1
          return acc
        }, {})
      }
      console.log('✅ [DEBUG] Invoices:', results.invoices)

      // 5. Test COUNT avec différentes méthodes
      const { count: tenantsCount } = await supabase
        .from('tenants')
        .select('*', { count: 'exact', head: true })
        .eq('active', true)

      results.tenantsCountTest = {
        method: 'count with eq(active, true)',
        count: tenantsCount
      }

      setDebug(results)
      console.log('✅ [DEBUG] Diagnostic complet:', results)

    } catch (err) {
      console.error('❌ [DEBUG] Exception:', err)
      results.exception = err.message
      setDebug(results)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold mb-2">🔍 Diagnostic Dashboard Complet</h1>
        <p className="text-gray-600 mb-4">Analyse de toutes les tables et données</p>
        <button
          onClick={runDebug}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          🔄 Re-tester
        </button>
      </div>

      {/* SHOPS */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          🏪 Shops
          <span className="text-sm font-normal text-gray-500">
            ({debug.shops?.count || 0} locaux)
          </span>
        </h2>
        {debug.shops?.error && (
          <div className="bg-red-50 text-red-800 p-3 rounded mb-4">
            ❌ Erreur: {debug.shops.error}
          </div>
        )}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-600">Total</div>
              <div className="text-2xl font-bold">{debug.shops?.count || 0}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-600">Statuts</div>
              <pre className="text-xs mt-1">{JSON.stringify(debug.shops?.statuses, null, 2)}</pre>
            </div>
          </div>
          <details className="mt-2">
            <summary className="cursor-pointer text-sm text-blue-600">Voir exemple</summary>
            <pre className="bg-gray-100 p-3 rounded text-xs mt-2 overflow-auto">
              {JSON.stringify(debug.shops?.sample, null, 2)}
            </pre>
          </details>
        </div>
      </div>

      {/* TENANTS */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          👥 Tenants
          <span className="text-sm font-normal text-gray-500">
            ({debug.tenants?.count || 0} locataires)
          </span>
        </h2>
        {debug.tenants?.error && (
          <div className="bg-red-50 text-red-800 p-3 rounded mb-4">
            ❌ Erreur: {debug.tenants.error}
          </div>
        )}
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-600">Total</div>
              <div className="text-2xl font-bold">{debug.tenants?.count || 0}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-600">Actifs (active=true)</div>
              <div className="text-2xl font-bold">{debug.tenants?.active || 0}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-600">Test COUNT</div>
              <div className="text-2xl font-bold">{debug.tenantsCountTest?.count ?? '?'}</div>
            </div>
          </div>
          <details className="mt-2">
            <summary className="cursor-pointer text-sm text-blue-600">Voir exemple</summary>
            <pre className="bg-gray-100 p-3 rounded text-xs mt-2 overflow-auto">
              {JSON.stringify(debug.tenants?.sample, null, 2)}
            </pre>
          </details>
        </div>
      </div>

      {/* CONTRACTS */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          📄 Contracts
          <span className="text-sm font-normal text-gray-500">
            ({debug.contracts?.count || 0} contrats)
          </span>
        </h2>
        {debug.contracts?.error && (
          <div className="bg-red-50 text-red-800 p-3 rounded mb-4">
            ❌ Erreur: {debug.contracts.error}
          </div>
        )}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-600">Statuts</div>
              <pre className="text-xs mt-1">{JSON.stringify(debug.contracts?.statuses, null, 2)}</pre>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-600">Revenu total (monthly_rent)</div>
              <div className="text-2xl font-bold">{debug.contracts?.totalRent?.toLocaleString() || 0} FCFA</div>
            </div>
          </div>
          <details className="mt-2">
            <summary className="cursor-pointer text-sm text-blue-600">Voir exemple</summary>
            <pre className="bg-gray-100 p-3 rounded text-xs mt-2 overflow-auto">
              {JSON.stringify(debug.contracts?.sample, null, 2)}
            </pre>
          </details>
        </div>
      </div>

      {/* INVOICES - CRITIQUE */}
      <div className="bg-white rounded-lg shadow p-6 border-4 border-red-500">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          🧾 Invoices (CRITIQUE)
          <span className="text-sm font-normal text-gray-500">
            ({debug.invoices?.count || 0} factures)
          </span>
        </h2>
        {debug.invoices?.error && (
          <div className="bg-red-50 text-red-800 p-3 rounded mb-4">
            ❌ Erreur: {debug.invoices.error}
          </div>
        )}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-yellow-50 p-3 rounded border border-yellow-300">
              <div className="text-sm text-gray-600">Colonne "total_amount" existe ?</div>
              <div className="text-2xl font-bold">
                {debug.invoices?.hasTotal ? '✅ OUI' : '❌ NON'}
              </div>
            </div>
            <div className="bg-yellow-50 p-3 rounded border border-yellow-300">
              <div className="text-sm text-gray-600">Colonne "amount_total" existe ?</div>
              <div className="text-2xl font-bold">
                {debug.invoices?.hasAmount ? '✅ OUI' : '❌ NON'}
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded">
            <div className="text-sm font-medium text-blue-900 mb-2">📋 Colonnes disponibles:</div>
            <div className="flex flex-wrap gap-2">
              {debug.invoices?.columns?.map(col => (
                <span 
                  key={col} 
                  className={`px-2 py-1 rounded text-xs ${
                    col.includes('total') || col.includes('amount') 
                      ? 'bg-red-200 text-red-900 font-bold' 
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {col}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">Statuts</div>
            <pre className="text-xs mt-1">{JSON.stringify(debug.invoices?.statuses, null, 2)}</pre>
          </div>

          <details className="mt-2">
            <summary className="cursor-pointer text-sm text-blue-600">Voir exemple facture complète</summary>
            <pre className="bg-gray-100 p-3 rounded text-xs mt-2 overflow-auto max-h-96">
              {JSON.stringify(debug.invoices?.sample, null, 2)}
            </pre>
          </details>
        </div>
      </div>

      {/* RAW JSON */}
      <details className="bg-white rounded-lg shadow p-6">
        <summary className="cursor-pointer text-lg font-bold">🗂️ Données brutes complètes</summary>
        <pre className="bg-gray-100 p-4 rounded text-xs mt-4 overflow-auto max-h-96">
          {JSON.stringify(debug, null, 2)}
        </pre>
      </details>
    </div>
  )
}
