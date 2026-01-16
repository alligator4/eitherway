import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Running scheduled tasks...')

    await supabaseClient.rpc('mark_overdue_invoices')
    console.log('✓ Marked overdue invoices')

    await supabaseClient.rpc('send_payment_reminders')
    console.log('✓ Sent payment reminders')

    await supabaseClient.rpc('auto_renew_contracts')
    console.log('✓ Processed contract renewals')

    const today = new Date()
    if (today.getDate() === 1) {
      await supabaseClient.rpc('generate_monthly_invoices')
      console.log('✓ Generated monthly invoices')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Scheduled tasks completed',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error running scheduled tasks:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
