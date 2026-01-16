import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { ThemeProvider } from './contexts/ThemeContext'
import ErrorBoundary from './components/ErrorBoundary'
import LoadingSpinner from './components/LoadingSpinner'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import TestPasswordReset from './pages/TestPasswordReset'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Layout from './components/Layout'
import ShopsPage from './pages/Shops'
import TenantsPage from './pages/Tenants'
import ContractsPage from './components/ContractsPage'
import InvoicesPage from './components/InvoicesPage'
import PaymentsPage from './components/PaymentsPage'
import ActivityLogsPage from './components/ActivityLogsPage'

function AppContent() {
  const { loading } = useAuth()

  if (loading) {
    return <LoadingSpinner fullScreen text="Chargement de l'application..." />
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/test-password-reset" element={<TestPasswordReset />} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />

        <Route
          path="/shops"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ShopsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tenants"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <TenantsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/contracts"
          element={<ContractsPage />}
        />

        <Route
          path="/invoices"
          element={<InvoicesPage />}
        />

        <Route
          path="/payments"
          element={<PaymentsPage />}
        />

        <Route
          path="/logs"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ActivityLogsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Users />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
