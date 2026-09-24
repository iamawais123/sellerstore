import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const money = (value) => `$${Number(value || 0).toFixed(2)}`
const STAGES = ['Paid', 'Pickup', 'On the way', 'Out for delivery', 'Delivered']
const STATUSES = ['All', 'Unpaid', 'Paid', 'Pickup', 'On the way', 'Out for delivery', 'Delivered', 'Cancelled']
const STATUS_DOT = { Unpaid: 'bg-rose-500', Paid: 'bg-emerald-500', Pickup: 'bg-amber-500', 'On the way': 'bg-blue-500', 'Out for delivery': 'bg-indigo-500', Delivered: 'bg-green-600', Cancelled: 'bg-gray-400' }
const STATUS_BADGE = { Unpaid: 'bg-rose-50 text-rose-700', Paid: 'bg-emerald-50 text-emerald-700', Pickup: 'bg-amber-50 text-amber-700', 'On the way': 'bg-blue-50 text-blue-700', 'Out for delivery': 'bg-indigo-50 text-indigo-700', Delivered: 'bg-green-50 text-green-700', Cancelled: 'bg-gray-100 text-gray-500' }

// Customer PII is masked on the seller side — only the admin (who created the order) sees it in full.
const maskWord = (word) => {
  if (!word) return word
  const visible = word.length <= 2 ? 1 : Math.min(3, word.length - 2)
  return word.slice(0, visible) + '*'.repeat(Math.max(2, word.length - visible))
}
const maskName = (name) => (name || '').split(' ').filter(Boolean).map(maskWord).join(' ') || '—'
const maskPhone = (phone) => {
  if (!phone) return '—'
  const keep = Math.min(3, phone.length)
  return phone.slice(0, keep) + phone.slice(keep).replace(/[^\s-]/g, '*')
}
const maskAddress = (customer) => {
  if (!customer) return '—'
  const city = maskWord(customer.city || '')
  const state = maskWord(customer.state || '')
  const bits = [city, state].filter(Boolean).join(', ')
  return [bits, customer.country].filter(Boolean).join(', ') || '—'
}

const PayConfirmModal = ({ order, seller, onClose, onConfirm, error, busy }) => {
  const balanceAfter = (seller.balance || 0) - order.cost
  const insufficient = balanceAfter < 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900">Confirm order payment</h2>
            <p className="mt-1 text-sm text-gray-500">The seller cost is deducted from your shop balance to process this order.</p>
          </div>
        </div>

        <div className="mt-5 flex -space-x-3">
          {order.items.slice(0, 6).map((item) => (
            <img key={item.id} src={item.image} alt="" className="h-14 w-14 rounded-xl border-2 border-white object-cover shadow" />
          ))}
        </div>

        <div className="mt-5 divide-y divide-gray-100 rounded-2xl border border-gray-100">
          <div className="flex justify-between p-3.5 text-sm"><span className="font-bold text-gray-500">Items</span><span className="font-black text-gray-900">{order.items.length} products</span></div>
          <div className="flex justify-between p-3.5 text-sm"><span className="font-bold text-gray-500">Total quantity</span><span className="font-black text-gray-900">{order.qty}</span></div>
          <div className="flex justify-between p-3.5 text-sm"><span className="font-bold text-gray-500">Seller cost</span><span className="font-black text-gray-900">{money(order.cost)}</span></div>
          <div className="flex justify-between p-3.5 text-sm"><span className="font-bold text-gray-500">Profit on delivery</span><span className="font-black text-emerald-600">+{money(order.profit)}</span></div>
          <div className="flex justify-between p-3.5 text-sm"><span className="font-bold text-gray-500">Shop balance after</span><span className={`font-black ${insufficient ? 'text-rose-600' : 'text-gray-900'}`}>{money(balanceAfter)}</span></div>
        </div>

        {(insufficient || error) && (
          <p className="mt-3 rounded-xl bg-rose-50 p-3 text-center text-sm font-bold text-rose-700">
            {error || 'Your shop balance is too low. Top up your wallet to process this order.'}
          </p>
        )}

        <div className="mt-5 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-2xl border border-gray-200 bg-white px-5 py-3 font-black text-gray-700">Cancel</button>
          <button onClick={onConfirm} disabled={insufficient || busy} className="flex-1 rounded-2xl bg-indigo-600 px-5 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-40">{busy ? 'Processing…' : 'Confirm & process'}</button>
        </div>
      </div>
    </div>
  )
}

const OrderStepper = ({ status }) => {
  if (status === 'Cancelled') {
    return <p className="rounded-xl bg-gray-100 px-4 py-2.5 text-center text-sm font-black text-gray-500">This order was cancelled.</p>
  }
  const currentIndex = STAGES.indexOf(status)
  return (
    <div className="flex items-center">
      {STAGES.map((stage, index) => {
        const reached = currentIndex >= index
        return (
          <div key={stage} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${reached ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>{index + 1}</div>
              <span className={`whitespace-nowrap text-[11px] font-bold ${reached ? 'text-gray-800' : 'text-gray-400'}`}>{stage}</span>
            </div>
            {index < STAGES.length - 1 && <div className={`mx-1 mb-4 h-0.5 flex-1 ${currentIndex > index ? 'bg-indigo-600' : 'bg-gray-100'}`} />}
          </div>
        )
      })}
    </div>
  )
}

const OrderCard = ({ order, seller, onPay }) => {
  const [open, setOpen] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [payError, setPayError] = useState('')
  const [paying, setPaying] = useState(false)
  const thumb = order.items[0]

  const handleConfirm = async () => {
    if (paying) return
    setPaying(true)
    const result = await onPay(order.id)
    setPaying(false)
    if (result.success) {
      setPayOpen(false)
      setPayError('')
    } else {
      setPayError(result.error)
    }
  }

  return (
    <article className="rounded-3xl border border-gray-100 bg-white shadow-sm">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 p-4 text-left">
        <div className="relative shrink-0">
          <img src={thumb?.image} alt="" className="h-14 w-14 rounded-xl object-cover" />
          {order.qty > 1 && <span className="absolute -bottom-1 -left-1 rounded-md bg-indigo-600 px-1.5 py-0.5 text-[10px] font-black text-white">{order.qty}x</span>}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-gray-900">{order.productName}</p>
          <p className="mt-0.5 text-xs font-semibold text-gray-500">{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ×{order.items.length}</p>
          <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-black ${STATUS_BADGE[order.status] || 'bg-gray-100 text-gray-600'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[order.status] || 'bg-gray-400'}`} />
            {order.status}
          </span>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-black text-gray-900">{money(order.total)}</p>
          <p className="text-xs font-bold text-emerald-600">↗ +{money(order.profit)}</p>
        </div>
        <svg className={`h-5 w-5 shrink-0 text-gray-300 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>

      {open && (
        <div className="space-y-4 border-t border-gray-100 p-4">
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
            <div><p className="text-xs font-black uppercase tracking-wider text-gray-400">Customer</p><p className="mt-0.5 font-bold text-gray-800">{maskName(order.customer?.fullName)}</p></div>
            <div><p className="text-xs font-black uppercase tracking-wider text-gray-400">Phone</p><p className="mt-0.5 font-bold text-gray-800">{maskPhone(order.customer?.phone)}</p></div>
            <div><p className="text-xs font-black uppercase tracking-wider text-gray-400">Shipping address</p><p className="mt-0.5 font-bold text-gray-800">{maskAddress(order.customer)}</p></div>
          </div>

          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-wider text-gray-400">Items ({order.items.length})</p>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-xl bg-gray-50 p-2.5">
                  <img src={item.image} alt="" className="h-11 w-11 rounded-lg object-cover" />
                  <span className="flex-1 truncate text-sm font-bold text-gray-800">{item.name}</span>
                  <span className="shrink-0 text-sm font-bold text-gray-500">×{item.qty}</span>
                  <span className="shrink-0 font-black text-gray-900">{money(item.sell * item.qty)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3 text-sm">
            <span className="font-bold text-gray-500">Cost <span className="font-black text-gray-900">{money(order.cost)}</span></span>
            <span className="font-bold text-gray-500">Profit <span className="font-black text-emerald-600">+{money(order.profit)}</span></span>
            <span className="font-bold text-gray-500">Order <span className="font-black text-gray-900">#{order.id.slice(-6)}</span></span>
          </div>

          <OrderStepper status={order.status} />

          {order.status === 'Unpaid' && (
            <button onClick={() => setPayOpen(true)} className="w-full rounded-2xl bg-indigo-600 px-5 py-3.5 font-black text-white hover:bg-indigo-700">
              Pay {money(order.cost)} to process
            </button>
          )}
        </div>
      )}

      {payOpen && <PayConfirmModal order={order} seller={seller} error={payError} busy={paying} onClose={() => { setPayOpen(false); setPayError('') }} onConfirm={handleConfirm} />}
    </article>
  )
}

const ORDER_FLOW = ['Unpaid', 'Paid', 'Pickup', 'On the way', 'Out for delivery', 'Delivered']

const SellerOrders = () => {
  const { seller, getSellerOrders, paySellerOrder, advanceSellerOrderStatus, getSellerNotifications, markNotificationRead } = useAuth()
  const [status, setStatus] = useState('All')
  const orders = getSellerOrders(seller.id)
  const visibleOrders = useMemo(() => orders.filter((order) => status === 'All' || order.status === status), [orders, status])

  // Clear the order badge when this page is opened
  useEffect(() => {
    const unread = getSellerNotifications().filter((n) => !n.read && n.type === 'order')
    unread.forEach((n) => markNotificationRead(seller.id, n.id))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-advance paid orders through delivery stages based on stageTimestamps
  useEffect(() => {
    const advance = () => {
      const now = Date.now()
      orders.forEach((order) => {
        if (!order.stageTimestamps || order.status === 'Delivered' || order.status === 'Cancelled' || order.status === 'Unpaid') return
        const currentIdx = ORDER_FLOW.indexOf(order.status)
        if (currentIdx === -1 || currentIdx >= ORDER_FLOW.length - 1) return
        const nextStatus = ORDER_FLOW[currentIdx + 1]
        const nextAt = order.stageTimestamps[nextStatus]
        if (nextAt && now >= new Date(nextAt).getTime()) {
          advanceSellerOrderStatus(order.id, nextStatus)
        }
      })
    }
    advance()
    const timer = setInterval(advance, 30_000)
    return () => clearInterval(timer)
  }, [orders]) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePay = (orderId) => paySellerOrder(seller.id, orderId)

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">Orders</p>
        <h1 className="mt-1 text-3xl font-black text-gray-900">Your assigned orders</h1>
        <p className="mt-1 text-gray-500">When your admin assigns an order to your shop it will appear in this list.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUSES.map((item) => (
          <button key={item} onClick={() => setStatus(item)} className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold ${status === item ? 'bg-gray-900 text-white' : 'border border-gray-200 bg-white text-gray-600'}`}>
            {item !== 'All' && <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[item]}`} />}
            {item}
            <span className="opacity-60">{item === 'All' ? orders.length : orders.filter((o) => o.status === item).length}</span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {visibleOrders.length ? (
          visibleOrders.map((order) => <OrderCard key={order.id} order={order} seller={seller} onPay={handlePay} />)
        ) : (
          <div className="rounded-3xl border-2 border-dashed border-gray-200 p-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 text-gray-300">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <p className="text-xl font-black text-gray-700">No orders here yet</p>
            <p className="mt-2 text-gray-500">When your admin assigns an order to your shop it will appear in this list.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SellerOrders
