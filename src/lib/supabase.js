import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] VITE_SUPABASE_URL present:', Boolean(supabaseUrl))
  console.error('[Supabase] VITE_SUPABASE_ANON_KEY present:', Boolean(supabaseAnonKey))
  throw new Error('Variables Supabase manquantes. Vérifie ton fichier .env.local à la racine du projet.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
