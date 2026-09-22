import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { ordersFor } from '../data/localOrders'

const Row = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-4">
    <dt className="sm:w-40 shrink-0 text-sm font-semibold text-gray-500">{label}</dt>
    <dd className="text-gray-900 break-words min-w-0">{value || '—'}</dd>
  </div>
)

const Profile = () => {
  const { customer, isCustomerLoggedIn, logoutCustomer } = useAuth()
  const { itemCount } = useCart()
  const { count: wishlistCount } = useWishlist()
  const navigate = useNavigate()

  if (!isCustomerLoggedIn) return <Navigate to="/login?redirect=/profile" replace />

  const orderCount = ordersFor(customer).length
  const initials = (customer.fullName || customer.email || '?')
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  const onLogout = () => {
    logoutCustomer()
    navigate('/')
  }

  const stats = [
    { label: 'Orders', value: orderCount, to: '/orders' },
    { label: 'Wishlist', value: wishlistCount, to: '/wishlist' },
    { label: 'In cart', value: itemCount, to: '/cart' },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="flex items-center gap-4 sm:gap-5 mb-8">
        <span className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#0a3d62] text-white text-xl sm:text-2xl font-bold flex items-center justify-center shrink-0">
          {initials}
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">{customer.fullName || 'My profile'}</h1>
          <p className="text-gray-500 truncate">{customer.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.to} className="rounded-2xl border border-gray-100 bg-white p-4 text-center hover:border-[#0a3d62]/30 hover:shadow-md transition-all">
            <p className="text-2xl font-extrabold text-[#0a3d62]">{stat.value}</p>
            <p className="text-xs sm:text-sm text-gray-500">{stat.label}</p>
          </Link>
        ))}
      </div>

      <section className="rounded-2xl border border-gray-100 bg-white px-5 sm:px-6 mb-8">
        <h2 className="sr-only">Account details</h2>
        <dl className="divide-y divide-gray-100">
          <Row label="Full name" value={customer.fullName} />
          <Row label="Email" value={customer.email} />
        </dl>
      </section>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link to="/orders" className="flex-1 py-3.5 text-center rounded-xl bg-[#0a3d62] text-white font-semibold hover:bg-[#0f4c81] transition-colors">
          View my orders
        </Link>
        <Link to="/shop" className="flex-1 py-3.5 text-center rounded-xl border border-gray-200 font-semibold text-gray-900 hover:bg-gray-50 transition-colors">
          Continue shopping
        </Link>
        <button type="button" onClick={onLogout} className="flex-1 py-3.5 rounded-xl border border-rose-200 text-rose-600 font-semibold hover:bg-rose-50 transition-colors">
          Log out
        </button>
      </div>
    </div>
  )
}

export default Profile
