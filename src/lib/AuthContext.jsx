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

    const init = async () => {
      setLoading(true)
      try {
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session retrieval timeout')), 10000)
        )

        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise])
        if (error) throw error

        const u = session?.user ?? null
        if (!aliveRef.current) return

        setUser(u)

        if (u) {
          await fetchProfile(u.id)
        } else {
          setProfile(null)
        }
      } catch (err) {
        if (!aliveRef.current) return
        console.error('[AuthContext] init error:', err)
        setUser(null)
        setProfile(null)
      } finally {
        if (!aliveRef.current) return
        setLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!initializedRef.current) {
        initializedRef.current = true
        return // Skip the first call since init() already handled it
      }

      setLoading(true)

      const u = session?.user ?? null
      if (!aliveRef.current) return

      setUser(u)

      if (u) {
        try {
          await fetchProfile(u.id)
        } catch (err) {
          if (!aliveRef.current) return
          console.error('[AuthContext] onAuthStateChange fetchProfile error:', err)
          setProfile(null)
        }
      } else {
        fetchTokenRef.current++
        setProfile(null)
      }

      if (!aliveRef.current) return
      setLoading(false)
    })

    return () => {
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
