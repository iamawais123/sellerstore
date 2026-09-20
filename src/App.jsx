import { Component } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import Navbar from './components/Navbar'
import CartDrawer from './components/CartDrawer'
import Home from './pages/Home'
import Shop from './pages/Shop'
import ProductDetail from './pages/ProductDetail'
import FeaturesBar from './components/FeaturesBar'
import Footer from './components/Footer'
import SellerLayout from './components/SellerLayout'
import SellerDashboard from './pages/seller/SellerDashboard'
import SellerProducts from './pages/seller/SellerProducts'
import SellerOrders from './pages/seller/SellerOrders'
import SellerNotifications from './pages/seller/SellerNotifications'
import SellerProfile from './pages/seller/SellerProfile'
import WithdrawFunds from './pages/seller/WithdrawFunds'
import SellerSignup from './pages/auth/SellerSignup'
import SellerLogin from './pages/auth/SellerLogin'
import CustomerLogin from './pages/auth/CustomerLogin'
import CustomerSignup from './pages/auth/CustomerSignup'

class ErrorBoundary extends Component {
  state = { error: null, info: null }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info)
    this.setState({ error, info })
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-rose-50 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl border border-rose-100 p-8">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-5">
              <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-2">Render Error</h1>
            <p className="text-gray-600 mb-5">
              The page crashed while rendering. This is the exact error — copy it when reporting:
            </p>
            <div className="rounded-2xl bg-gray-900 text-rose-300 p-4 overflow-auto text-xs font-mono mb-4">
              <div className="mb-2 font-bold text-rose-200">Message</div>
              <div>{String(this.state.error?.message || this.state.error)}</div>
              {this.state.info && (
                <>
                  <div className="mt-4 mb-2 font-bold text-rose-200">Stack</div>
                  <div className="whitespace-pre-wrap">{String(this.state.info.componentStack || '')}</div>
                </>
              )}
            </div>
            <button
              className="px-5 py-3 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition"
              onClick={() => {
                this.setState({ error: null, info: null })
                window.location.reload()
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

const StoreLayout = ({ children }) => (
  <div className="min-h-screen bg-white flex flex-col relative">
    <Navbar />
    <main className="flex-1">{children}</main>
    <FeaturesBar />
    <Footer />
    <CartDrawer />
  </div>
)

function AppInner() {
  return (
    <Routes>
      <Route path="/" element={<StoreLayout children={<Home />} />} />
      <Route path="/shop" element={<StoreLayout children={<Shop />} />} />
      <Route path="/product/:id" element={<StoreLayout children={<ProductDetail />} />} />

      <Route path="/login" element={<CustomerLogin />} />
      <Route path="/signup" element={<CustomerSignup />} />

      <Route path="/seller/login" element={<SellerLogin />} />
      <Route path="/seller/signup" element={<SellerSignup />} />

      <Route path="/seller" element={<SellerLayout />}>
        <Route index element={<SellerDashboard />} />
        <Route path="dashboard" element={<SellerDashboard />} />
        <Route path="products" element={<SellerProducts />} />
        <Route path="orders" element={<SellerOrders />} />
        <Route path="withdraw" element={<WithdrawFunds />} />
        <Route path="notifications" element={<SellerNotifications />} />
        <Route path="profile" element={<SellerProfile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <AppInner />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
