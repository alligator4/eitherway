import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    setLoading(true)
    try {
      // DÉSACTIVÉ: Table notifications n'existe pas encore dans Supabase
      // Activer une fois la table créée dans les migrations
      setNotifications([])
      setUnreadCount(0)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  useEffect(() => {
    if (!user) return
    // DÉSACTIVÉ: Realtime notifications - table n'existe pas
  }, [user])

  const markAsRead = useCallback(async (notificationId) => {
    // DÉSACTIVÉ: Table notifications n'existe pas
    console.log('markAsRead désactivé - table notifications manquante')
  }, [])

  const markAllAsRead = useCallback(async () => {
    // DÉSACTIVÉ: Table notifications n'existe pas
    console.log('markAllAsRead désactivé - table notifications manquante')
  }, [])

  const deleteNotification = useCallback(async (notificationId) => {
    // DÉSACTIVÉ: Table notifications n'existe pas
    console.log('deleteNotification désactivé - table notifications manquante')
  }, [])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refresh: fetchNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}
