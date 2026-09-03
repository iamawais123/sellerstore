import { BrowserRouter, Routes, Route } from 'react-router-dom'
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

const StoreLayout = ({ children }) => (
  <div className="min-h-screen bg-white flex flex-col relative">
    <Navbar />
    <main className="flex-1">{children}</main>
    <FeaturesBar />
    <Footer />
    <CartDrawer />
  </div>
)

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
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
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  )
}

export default App
