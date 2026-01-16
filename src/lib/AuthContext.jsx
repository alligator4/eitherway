import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const aliveRef = useRef(true)
  const fetchTokenRef = useRef(0)
  const initializedRef = useRef(false)

  const fetchProfile = async (userId, retries = 5) => {
    const token = ++fetchTokenRef.current

    try {
      for (let attempt = 0; attempt < retries; attempt++) {
        const query = supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        )

        const { data, error } = await Promise.race([query, timeoutPromise])

        if (!aliveRef.current) return
        if (token !== fetchTokenRef.current) return

        if (data) {
          setProfile(data)
          return
        }

        // PGRST116 = row not found, normal juste après signup le temps du trigger
        if (error && error.code && error.code !== 'PGRST116') {
          throw error
        }

        if (attempt < retries - 1) {
          await new Promise((r) => setTimeout(r, 1000))
        }
      }

      if (!aliveRef.current) return
      if (token !== fetchTokenRef.current) return
      setProfile(null)
    } catch (err) {
      if (!aliveRef.current) return
      if (token !== fetchTokenRef.current) return
      console.error('[AuthContext] fetchProfile error:', err)
      setProfile(null)
    }
  }

  useEffect(() => {
    aliveRef.current = true
    let isSubscribed = true

    const init = async () => {
      if (!isSubscribed) return
      setLoading(true)
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error

        if (!isSubscribed || !aliveRef.current) return

        const u = session?.user ?? null
        setUser(u)

        if (u) {
          await fetchProfile(u.id)
        } else {
          setProfile(null)
        }
        
        initializedRef.current = true
      } catch (err) {
        if (!isSubscribed || !aliveRef.current) return
        console.error('[AuthContext] init error:', err)
        setUser(null)
        setProfile(null)
      } finally {
        if (isSubscribed && aliveRef.current) {
          setLoading(false)
        }
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isSubscribed || !initializedRef.current) return

      // Ignorer TOKEN_REFRESHED et INITIAL_SESSION
      if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        return
      }

      console.log('[AuthContext] Auth change:', event)

      // Pour SIGNED_IN, vérifier si c'est le même utilisateur
      if (event === 'SIGNED_IN') {
        const newUserId = session?.user?.id
        const currentUserId = user?.id
        if (newUserId && newUserId === currentUserId) {
          console.log('[AuthContext] Skip reload - même user')
          return
        }
      }

      // Pour SIGNED_OUT, nettoyer immédiatement SANS loading
      if (event === 'SIGNED_OUT') {
        if (!isSubscribed) return
        setUser(null)
        setProfile(null)
        return
      }

      // Pour USER_UPDATED, juste refresh le profil SANS loading
      if (event === 'USER_UPDATED') {
        if (!isSubscribed) return
        const u = session?.user ?? null
        if (u && u.id === user?.id) {
          // Même user, juste refresh le profil en arrière-plan
          fetchProfile(u.id)
          return
        }
      }

      // Pour les autres événements, ne PAS afficher loading
      if (!isSubscribed) return
      
      const u = session?.user ?? null
      setUser(u)

      if (u) {
        try {
          await fetchProfile(u.id)
        } catch (err) {
          console.error('[AuthContext] Profile fetch error:', err)
          setProfile(null)
        }
      } else {
        setProfile(null)
      }
    })

    return () => {
      isSubscribed = false
      aliveRef.current = false
      subscription?.unsubscribe()
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
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })
    if (error) throw error
  }

  const signOut = async () => {
    fetchTokenRef.current++
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    if (!aliveRef.current) return
    setUser(null)
    setProfile(null)
  }

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  }

  const updatePassword = async (newPassword) => {
    try {
      await supabase.auth.refreshSession()
    } catch (refreshError) {
      console.warn('[AuthContext] Failed to refresh session:', refreshError)
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>')
  return ctx
}
