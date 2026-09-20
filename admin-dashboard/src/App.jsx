import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AdminLayout from './components/AdminLayout'
import AdminLogin from './pages/auth/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminSellers from './pages/admin/AdminSellers'
import AdminKYC from './pages/admin/AdminKYC'
import AdminOrders from './pages/admin/AdminOrders'
import AdminSupport from './pages/admin/AdminSupport'
import AdminWithdrawals from './pages/admin/AdminWithdrawals'
import AdminRecentActions from './pages/admin/AdminRecentActions'
import AdminMyLogs from './pages/admin/AdminMyLogs'

const ProtectedRoute = ({ children }) => {
  const { isAdminLoggedIn } = useAuth()
  if (!isAdminLoggedIn) return <Navigate to="/login" replace />
  return children
}

const LoginRoute = ({ children }) => {
  const { isAdminLoggedIn } = useAuth()
  if (isAdminLoggedIn) return <Navigate to="/dashboard" replace />
  return children
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/admin-app">
        <Routes>
          <Route
            path="/login"
            element={
              <LoginRoute>
                <AdminLogin />
              </LoginRoute>
            }
          />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="sellers" element={<AdminSellers />} />
            <Route path="kyc" element={<AdminKYC />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="support" element={<AdminSupport />} />
            <Route path="withdrawals" element={<AdminWithdrawals />} />
            <Route path="recent-actions" element={<AdminRecentActions />} />
            <Route path="my-logs" element={<AdminMyLogs />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
