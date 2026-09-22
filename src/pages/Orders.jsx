import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { cancelOrder, ordersFor } from '../data/localOrders'
import { formatPrice } from '../data/format'
import EmptyState from '../components/EmptyState'

const STATUS_STYLE = {
  Processing: 'bg-amber-50 text-amber-700 border-amber-200',
  Shipped: 'bg-sky-50 text-sky-700 border-sky-200',
  Delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
}

const BoxIcon = () => (
  <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
)

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

const Orders = () => {
  const { customer, isCustomerLoggedIn } = useAuth()
  const location = useLocation()
  const [version, setVersion] = useState(0)
  const placedId = location.state?.placed

  if (!isCustomerLoggedIn) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <EmptyState
          icon={<BoxIcon />}
          title="Log in to see your orders"
          text="Sign in to view and track the orders you've placed."
          actionLabel="Log in"
          to="/login?redirect=/orders"
        />
      </div>
    )
  }

  // `version` re-reads storage after a cancellation.
  const orders = ordersFor(customer, version)

  const onCancel = (orderId) => {
    if (window.confirm('Cancel this order?')) {
      cancelOrder(orderId)
      setVersion((v) => v + 1)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">My Orders</h1>

      {placedId && (
        <div role="status" className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
          <p className="font-semibold">Thank you! Your order {placedId} has been placed.</p>
          <p className="text-sm">We'll get it ready for delivery.</p>
        </div>
      )}

      {orders.length === 0 ? (
        <EmptyState icon={<BoxIcon />} title="No orders yet" text="When you place an order it will show up here." actionLabel="Start shopping" to="/shop" />
      ) : (
        <ul className="space-y-5">
          {orders.map((order) => (
            <li key={order.id} className="border border-gray-100 rounded-2xl bg-white overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 bg-gray-50 border-b border-gray-100">
                <div>
                  <p className="font-bold text-gray-900">{order.id}</p>
                  <p className="text-sm text-gray-500">Placed {formatDate(order.createdAt)}</p>
                </div>
                <span className={`px-3 py-1 rounded-full border text-xs font-bold ${STATUS_STYLE[order.status] || STATUS_STYLE.Processing}`}>
                  {order.status}
                </span>
              </div>
              <ul className="divide-y divide-gray-100 px-4 sm:px-6">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 sm:gap-4 py-4">
                    <Link to={`/product/${item.id}`} className="shrink-0 w-16 h-16 rounded-lg border border-gray-100 bg-white">
                      <img src={item.image} alt="" className="w-full h-full object-contain p-1" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/product/${item.id}`} className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-2 hover:text-[#0a3d62]">
                        {item.name}
                      </Link>
                      <p className="text-sm text-gray-500">Qty {item.qty} · {formatPrice(item.price)}</p>
                    </div>
                    <span className="font-semibold text-gray-900">{formatPrice(item.price * item.qty)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 min-w-0">
                  Deliver to <span className="text-gray-800">{order.shipping?.fullName}</span>, {order.shipping?.city}
                </p>
                <div className="flex items-center gap-4">
                  {order.status === 'Processing' && (
                    <button type="button" onClick={() => onCancel(order.id)} className="text-sm font-semibold text-rose-600 hover:underline">
                      Cancel order
                    </button>
                  )}
                  <p className="font-extrabold text-gray-900">Total {formatPrice(order.total)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Orders
