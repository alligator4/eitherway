import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const aliveRef = useRef(true)
  const fetchTokenRef = useRef(0)

  const fetchProfile = async (userId, retries = 3) => {
    const token = ++fetchTokenRef.current

    try {
      let profileData = null

      for (let attempt = 0; attempt < retries; attempt++) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (!aliveRef.current) return
        if (token !== fetchTokenRef.current) return

        if (error) {
          if (attempt < retries - 1) {
            await new Promise((r) => setTimeout(r, 500))
            continue
          }
          throw error
        }

        if (data) {
          profileData = data
          break
        }

        if (attempt < retries - 1) {
          await new Promise((r) => setTimeout(r, 500))
        }
      }

      if (!aliveRef.current) return
      if (token !== fetchTokenRef.current) return

      setProfile(profileData)
    } catch (err) {
      if (!aliveRef.current) return
      if (token !== fetchTokenRef.current) return
      console.error('Error fetching profile:', err)
      setProfile(null)
    }
  }

  useEffect(() => {
    aliveRef.current = true

    const init = async () => {
      setLoading(true)
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
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
        console.error('Auth init error:', err)
        setUser(null)
        setProfile(null)
      } finally {
        if (!aliveRef.current) return
        setLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setLoading(true)

      const u = session?.user ?? null
      if (!aliveRef.current) return

      setUser(u)

      if (u) {
        await fetchProfile(u.id)
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
    fetchTokenRef.current++ // annule fetchProfile en cours
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    if (!aliveRef.current) return
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>')
  return ctx
}
