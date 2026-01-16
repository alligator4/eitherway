import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function TestInvoiceSchema() {
  const [result, setResult] = useState(null)

  useEffect(() => {
    testSchema()
  }, [])

  const testSchema = async () => {
    console.log('🧪 Test structure table invoices...')
    
    try {
      // Test 1: SELECT * pour voir toutes les colonnes
      const { data: invoices, error: error1 } = await supabase
        .from('invoices')
        .select('*')
        .limit(1)

      if (error1) {
        console.error('❌ Test 1 échoué:', error1)
        setResult({ test1: { error: error1.message } })
        return
      }

      console.log('✅ Test 1 - Première facture:', invoices)
      
      if (invoices && invoices.length > 0) {
        const columns = Object.keys(invoices[0])
        console.log('📋 Colonnes disponibles:', columns)
        
        const hasTotal = columns.includes('total_amount')
        const hasAmount = columns.includes('amount_total')
        
        setResult({
          test1: {
            success: true,
            columns: columns,
            hasTotal: hasTotal ? '✅ total_amount existe' : '❌ total_amount n\'existe pas',
            hasAmount: hasAmount ? '✅ amount_total existe' : '❌ amount_total n\'existe pas',
            firstInvoice: invoices[0]
          }
        })
      } else {
        setResult({
          test1: {
            success: true,
            message: 'Aucune facture dans la base de données'
          }
        })
      }
    } catch (err) {
      console.error('❌ Exception:', err)
      setResult({ error: err.message })
    }
  }

  return (
    <div className="p-8 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">🧪 Test Schéma Invoice</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
        {JSON.stringify(result, null, 2)}
      </pre>
      <button
        onClick={testSchema}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Re-tester
      </button>
    </div>
  )
}
