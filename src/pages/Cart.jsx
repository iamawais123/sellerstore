import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { formatPrice } from '../data/format'
import EmptyState from '../components/EmptyState'

const BagIcon = () => (
  <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
)

const Cart = () => {
  const { items, itemCount, subtotal, removeItem, incrementQty, decrementQty, clearCart } = useCart()
  const { isCustomerLoggedIn } = useAuth()
  const navigate = useNavigate()

  const onCheckout = () => navigate(isCustomerLoggedIn ? '/checkout' : '/login?redirect=/checkout')

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <EmptyState icon={<BagIcon />} title="Your cart is empty" text="Looks like you haven't added anything yet. Browse the shop and find something you love." actionLabel="Browse Products" to="/shop" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="flex items-baseline justify-between gap-4 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Your Cart <span className="text-gray-400 font-semibold">({itemCount})</span>
        </h1>
        <button type="button" onClick={clearCart} className="text-sm font-semibold text-rose-600 hover:underline">
          Clear cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_22rem] gap-8 lg:gap-10 items-start">
        <ul className="divide-y divide-gray-100 border border-gray-100 rounded-2xl bg-white">
          {items.map((item) => (
            <li key={item.id} className="flex gap-3 sm:gap-5 p-4 sm:p-5">
              <Link to={`/product/${item.id}`} className="shrink-0 w-20 h-20 sm:w-28 sm:h-28 rounded-xl overflow-hidden border border-gray-100 bg-white">
                <img src={item.image} alt="" className="w-full h-full object-contain p-1" />
              </Link>
              <div className="flex-1 min-w-0 flex flex-col">
                <Link to={`/product/${item.id}`} className="text-sm sm:text-base font-semibold text-gray-900 leading-snug line-clamp-2 hover:text-[#0a3d62]">
                  {item.name}
                </Link>
                <p className="mt-1 text-sm text-gray-500">{formatPrice(item.price)} each</p>
                <div className="mt-auto pt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => decrementQty(item.id)}
                      disabled={item.qty <= 1}
                      aria-label="Decrease quantity"
                      className="w-9 h-9 flex items-center justify-center text-lg font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      −
                    </button>
                    <span className="w-10 text-center text-sm font-semibold text-gray-900">{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => incrementQty(item.id)}
                      aria-label="Increase quantity"
                      className="w-9 h-9 flex items-center justify-center text-lg font-bold text-gray-600 hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-gray-900">{formatPrice((Number(item.price) || 0) * item.qty)}</span>
                    <button type="button" onClick={() => removeItem(item.id)} className="text-sm font-semibold text-gray-400 hover:text-rose-600 transition-colors">
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="lg:sticky lg:top-28 border border-gray-100 rounded-2xl bg-white p-5 sm:p-6 space-y-4" aria-label="Order summary">
          <h2 className="text-lg font-bold text-gray-900">Order summary</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <dt>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</dt>
              <dd className="font-semibold text-gray-900">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-gray-600">
              <dt>Shipping</dt>
              <dd className="font-semibold text-emerald-600">Free</dd>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-3 text-base">
              <dt className="font-bold text-gray-900">Total</dt>
              <dd className="font-extrabold text-gray-900">{formatPrice(subtotal)}</dd>
            </div>
          </dl>
          <button type="button" onClick={onCheckout} className="w-full py-3.5 bg-[#0a3d62] hover:bg-[#0f4c81] text-white font-semibold rounded-xl shadow-sm transition-colors">
            {isCustomerLoggedIn ? 'Proceed to checkout' : 'Log in to checkout'}
          </button>
          <Link to="/shop" className="block w-full py-3.5 text-center border border-gray-200 rounded-xl font-semibold text-gray-900 hover:bg-gray-50 transition-colors">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  )
}

export default Cart
