import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SuperAuthProvider, useSuperAuth } from './context/AuthContext'
import SuperAdminLayout from './components/SuperAdminLayout'
import SuperAdminLogin from './pages/auth/SuperAdminLogin'
import SuperDashboard from './pages/super/SuperDashboard'
import SuperAdminsDirectory from './pages/super/AdminsDirectory'
import SuperAdminsManage from './pages/super/SuperAdminsManage'
import SuperActivity from './pages/super/SuperActivity'

// Shown while Firebase works out who (if anyone) is signed in, so a page refresh never bounces a
// signed-in super admin through the login screen.
const Splash = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50" role="status" aria-label="Loading">
    <div className="w-10 h-10 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
  </div>
)

const ProtectedRoute = ({ children }) => {
  const { isSuperAdminLoggedIn, loading } = useSuperAuth()
  if (loading) return <Splash />
  if (!isSuperAdminLoggedIn) return <Navigate to="/login" replace />
  return children
}

const LoginRoute = ({ children }) => {
  const { isSuperAdminLoggedIn, loading, bootstrapReady } = useSuperAuth()
  if (loading || !bootstrapReady) return <Splash />
  if (isSuperAdminLoggedIn) return <Navigate to="/dashboard" replace />
  return children
}

function App() {
  return (
    <SuperAuthProvider>
      <BrowserRouter basename="/super-admin-app">
        <Routes>
          <Route
            path="/login"
            element={
              <LoginRoute>
                <SuperAdminLogin />
              </LoginRoute>
            }
          />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <SuperAdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<SuperDashboard />} />
            <Route path="admins" element={<SuperAdminsDirectory />} />
            <Route path="super-admins" element={<SuperAdminsManage />} />
            <Route path="activity" element={<SuperActivity />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </SuperAuthProvider>
  )
}

export default App
