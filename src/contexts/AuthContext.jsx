import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
})

async function ensureProfileExists(user) {
  // 1) Tenter de lire le profil
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (data) return data

  // Si row not found (souvent PGRST116), on cree un profil minimal
  // Si autre erreur (RLS, etc.), on remonte l erreur
  if (error && error.code !== 'PGRST116') {
    throw error
  }

  const fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')?.[0] ||
    'User'

  const profileToInsert = {
    id: user.id,
    email: user.email,
    full_name: fullName,
    role: null, // Pas de rôle par défaut, les utilisateurs sont implicitement des locataires
    active: true,
    created_at: new Date().toISOString(),
  }

  const { data: created, error: insertError } = await supabase
    .from('profiles')
    .upsert(profileToInsert, { onConflict: 'id' })
    .select('*')
    .single()

  if (insertError) throw insertError
  return created
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadSessionAndProfile = async (session) => {
    try {
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (!currentUser) {
        setProfile(null)
        return
      }

      const p = await ensureProfileExists(currentUser)
      setProfile(p)
    } catch (e) {
      console.error('[AuthContext] loadSessionAndProfile error:', e)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    const init = async () => {
      try {
        setLoading(true)
        const { data } = await supabase.auth.getSession()
        if (!isMounted) return
        await loadSessionAndProfile(data?.session)
      } catch (e) {
        console.error('[AuthContext] init error:', e)
        if (!isMounted) return
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    }

    init()

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isMounted) return
        setLoading(true)
        await loadSessionAndProfile(session)
      }
    )

    return () => {
      isMounted = false
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email, password, fullName) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setProfile(null)
  }

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
