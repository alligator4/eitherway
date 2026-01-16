import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function TestContracts() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const testQuery1 = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('Test 1 - Contrats sans JOIN:', { data, error })
      setResult({ test: 'Contrats sans JOIN', data, error })
    } catch (err) {
      console.error('Test 1 error:', err)
      setResult({ test: 'Contrats sans JOIN', error: err.message })
    } finally {
      setLoading(false)
    }
  }

  const testQuery2 = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          tenant:tenants!tenant_id(id, company_name, contact_name, email, active),
          shop:shops!shop_id(id, name, shop_number, floor, location)
        `)
        .order('created_at', { ascending: false })

      console.log('Test 2 - Contrats avec JOIN explicite:', { data, error })
      setResult({ test: 'Contrats avec JOIN explicite', data, error })
    } catch (err) {
      console.error('Test 2 error:', err)
      setResult({ test: 'Contrats avec JOIN explicite', error: err.message })
    } finally {
      setLoading(false)
    }
  }

  const testQuery3 = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          tenant:tenant_id(id, company_name, contact_name, email, active),
          shop:shop_id(id, name, shop_number, floor, location)
        `)
        .order('created_at', { ascending: false })

      console.log('Test 3 - Contrats avec JOIN implicite:', { data, error })
      setResult({ test: 'Contrats avec JOIN implicite', data, error })
    } catch (err) {
      console.error('Test 3 error:', err)
      setResult({ test: 'Contrats avec JOIN implicite', error: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Test Diagnostic Contrats</h2>
      
      <div className="flex gap-4">
        <button
          onClick={testQuery1}
          disabled={loading}
          className="btn-primary"
        >
          Test 1: Sans JOIN
        </button>
        
        <button
          onClick={testQuery2}
          disabled={loading}
          className="btn-primary"
        >
          Test 2: JOIN explicite (!tenant_id)
        </button>
        
        <button
          onClick={testQuery3}
          disabled={loading}
          className="btn-primary"
        >
          Test 3: JOIN implicite (tenant_id)
        </button>
      </div>

      {loading && <p>Chargement...</p>}

      {result && (
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-bold mb-2">{result.test}</h3>
          {result.error && (
            <div className="bg-red-100 p-3 rounded mb-2">
              <p className="text-red-800 font-mono text-sm">
                Erreur: {JSON.stringify(result.error, null, 2)}
              </p>
            </div>
          )}
          {result.data && (
            <div className="bg-green-100 p-3 rounded">
              <p className="text-green-800 mb-2">
                ✅ {result.data.length} contrat(s) trouvé(s)
              </p>
              <pre className="text-xs overflow-auto max-h-96">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
