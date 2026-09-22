import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { COUNTRIES } from '../data/countries'
import { formatPrice } from '../data/format'
import { ORDERS_ARE_LOCAL_ONLY, placeOrder } from '../data/localOrders'
import EmptyState from '../components/EmptyState'

const FIELD = 'w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0a3d62]/20 focus:border-[#0a3d62]/40 bg-white'

const Field = ({ label, error, children, className = '' }) => (
  <label className={`block ${className}`}>
    <span className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</span>
    {children}
    {error && <span className="block mt-1 text-sm text-rose-600">{error}</span>}
  </label>
)

const Checkout = () => {
  const { items, itemCount, subtotal, clearCart } = useCart()
  const { customer, isCustomerLoggedIn } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    fullName: customer?.fullName || '',
    phone: '',
    address: '',
    city: '',
    region: '',
    postalCode: '',
    country: 'United States',
  })
  const [errors, setErrors] = useState({})
  const [placing, setPlacing] = useState(false)

  if (!isCustomerLoggedIn) return <Navigate to="/login?redirect=/checkout" replace />

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <EmptyState
          icon={<span className="text-3xl">🛒</span>}
          title="Nothing to check out"
          text="Your cart is empty. Add a few products first."
          actionLabel="Browse Products"
          to="/shop"
        />
      </div>
    )
  }

  const set = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  const validate = () => {
    const next = {}
    if (form.fullName.trim().length < 2) next.fullName = 'Enter your full name.'
    if (form.phone.replace(/\D/g, '').length < 7) next.phone = 'Enter a valid phone number.'
    if (form.address.trim().length < 5) next.address = 'Enter your street address.'
    if (form.city.trim().length < 2) next.city = 'Enter your city.'
    if (form.postalCode.trim().length < 3) next.postalCode = 'Enter your postal code.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const onSubmit = (e) => {
    e.preventDefault()
    if (placing || !validate()) return
    setPlacing(true)
    const order = placeOrder({
      customer,
      items,
      shipping: { ...form, email: customer?.email || '' },
      paymentMethod: 'Cash on delivery',
    })
    clearCart()
    navigate('/orders', { replace: true, state: { placed: order.id } })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Checkout</h1>

      {ORDERS_ARE_LOCAL_ONLY && (
        <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Demo checkout: no payment is taken and orders are saved in this browser only.
        </p>
      )}

      <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_24rem] gap-8 lg:gap-10 items-start">
        <div className="space-y-8">
          <section className="border border-gray-100 rounded-2xl bg-white p-5 sm:p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Delivery details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full name" error={errors.fullName}>
                <input value={form.fullName} onChange={set('fullName')} autoComplete="name" className={`${FIELD} ${errors.fullName ? 'border-rose-300' : 'border-gray-200'}`} />
              </Field>
              <Field label="Phone" error={errors.phone}>
                <input value={form.phone} onChange={set('phone')} type="tel" inputMode="tel" autoComplete="tel" className={`${FIELD} ${errors.phone ? 'border-rose-300' : 'border-gray-200'}`} />
              </Field>
              <Field label="Street address" error={errors.address} className="sm:col-span-2">
                <input value={form.address} onChange={set('address')} autoComplete="street-address" className={`${FIELD} ${errors.address ? 'border-rose-300' : 'border-gray-200'}`} />
              </Field>
              <Field label="City" error={errors.city}>
                <input value={form.city} onChange={set('city')} autoComplete="address-level2" className={`${FIELD} ${errors.city ? 'border-rose-300' : 'border-gray-200'}`} />
              </Field>
              <Field label="State / Region">
                <input value={form.region} onChange={set('region')} autoComplete="address-level1" className={`${FIELD} border-gray-200`} />
              </Field>
              <Field label="Postal code" error={errors.postalCode}>
                <input value={form.postalCode} onChange={set('postalCode')} autoComplete="postal-code" className={`${FIELD} ${errors.postalCode ? 'border-rose-300' : 'border-gray-200'}`} />
              </Field>
              <Field label="Country">
                <select value={form.country} onChange={set('country')} autoComplete="country-name" className={`${FIELD} border-gray-200`}>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </Field>
            </div>
          </section>

          <section className="border border-gray-100 rounded-2xl bg-white p-5 sm:p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Payment</h2>
            <div className="flex items-start gap-3 rounded-xl border-2 border-[#0a3d62] bg-[#0a3d62]/5 p-4">
              <span className="mt-1 w-4 h-4 rounded-full border-4 border-[#0a3d62] bg-white shrink-0" aria-hidden="true" />
              <div>
                <p className="font-semibold text-gray-900">Cash on delivery</p>
                <p className="text-sm text-gray-500">Pay when your order arrives.</p>
              </div>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-28 border border-gray-100 rounded-2xl bg-white p-5 sm:p-6 space-y-4" aria-label="Order summary">
          <h2 className="text-lg font-bold text-gray-900">Order summary</h2>
          <ul className="max-h-64 overflow-y-auto divide-y divide-gray-100 -mx-1 px-1">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3">
                <div className="relative shrink-0 w-14 h-14 rounded-lg border border-gray-100 bg-white">
                  <img src={item.image} alt="" className="w-full h-full object-contain p-1" />
                  <span className="absolute -top-2 -right-2 min-w-[1.25rem] h-5 px-1 rounded-full bg-gray-800 text-white text-[11px] font-bold flex items-center justify-center">{item.qty}</span>
                </div>
                <p className="flex-1 min-w-0 text-sm text-gray-800 line-clamp-2">{item.name}</p>
                <span className="text-sm font-semibold text-gray-900">{formatPrice((Number(item.price) || 0) * item.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <dt>Subtotal ({itemCount})</dt>
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
          <button
            type="submit"
            disabled={placing}
            className="w-full py-3.5 bg-[#0a3d62] hover:bg-[#0f4c81] text-white font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-60"
          >
            {placing ? 'Placing order…' : `Place order · ${formatPrice(subtotal)}`}
          </button>
          <Link to="/cart" className="block text-center text-sm font-semibold text-[#0a3d62] hover:underline">
            Back to cart
          </Link>
        </aside>
      </form>
    </div>
  )
}

export default Checkout
