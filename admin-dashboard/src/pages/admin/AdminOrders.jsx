import { useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const money = (value) => `$${Number(value || 0).toFixed(2)}`
const STAGES = ['Paid', 'Pickup', 'On the way', 'Out for delivery', 'Delivered']
const STATUS_BADGE = { Unpaid: 'bg-rose-50 text-rose-700 border-rose-200', Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200', Pickup: 'bg-amber-50 text-amber-700 border-amber-200', 'On the way': 'bg-blue-50 text-blue-700 border-blue-200', 'Out for delivery': 'bg-indigo-50 text-indigo-700 border-indigo-200', Delivered: 'bg-green-50 text-green-700 border-green-200', Cancelled: 'bg-gray-100 text-gray-500 border-gray-200' }

const initials = (name) => (name || 'S').split(' ').filter(Boolean).map((w) => w[0]).join('').toUpperCase().slice(0, 2)

const RANDOM_NAMES = ['Parker Brown', 'Jamie Jackson', 'Taylor Reed', 'Morgan Lee', 'Casey Diaz', 'Jordan Blake', 'Riley Chen', 'Avery Scott']
const RANDOM_PLACES = [
  ['Boston', 'MA', '02101'], ['Austin', 'TX', '73301'], ['Seattle', 'WA', '98101'],
  ['Denver', 'CO', '80201'], ['Miami', 'FL', '33101'], ['Chicago', 'IL', '60601'],
]
const RANDOM_STREETS = ['Elm St', 'Oak Ave', 'Maple Dr', 'Cedar Ln', 'Pine St', '2nd Ave']
const randomUSACustomer = () => {
  const fullName = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)]
  const [city, state, postalCode] = RANDOM_PLACES[Math.floor(Math.random() * RANDOM_PLACES.length)]
  const phone = `+1 ${Math.floor(200 + Math.random() * 700)}-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`
  const address1 = `${Math.floor(100 + Math.random() * 9000)} ${RANDOM_STREETS[Math.floor(Math.random() * RANDOM_STREETS.length)]}`
  return { fullName, phone, address1, address2: '', city, state, postalCode, country: 'United States' }
}

const emptyCustomer = { fullName: '', phone: '', address1: '', address2: '', city: '', state: '', postalCode: '', country: 'United States' }

// ---------------- Seller list (left column) ----------------

const SellerListPanel = ({ sellers, selectedSellerId, onSelect, search, setSearch, getSellerOrders }) => {
  const filtered = useMemo(() => sellers.filter((s) => {
    const q = search.toLowerCase().trim()
    if (!q) return true
    return `${s.shopName} ${s.ownerName || s.fullName} ${s.email}`.toLowerCase().includes(q)
  }), [sellers, search])

  return (
    <div className="flex h-full flex-col rounded-3xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 p-4">
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          </span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search sellers..." className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none" />
        </div>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {filtered.length ? filtered.map((s) => {
          const orders = getSellerOrders(s.id)
          const pending = orders.filter((o) => !['Delivered', 'Cancelled'].includes(o.status)).length
          const delivered = orders.filter((o) => o.status === 'Delivered').length
          return (
            <button key={s.id} onClick={() => onSelect(s.id)} className={`w-full rounded-2xl border-2 p-3 text-left transition ${selectedSellerId === s.id ? 'border-indigo-500 bg-indigo-50/60' : 'border-transparent hover:bg-gray-50'}`}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-black text-emerald-700">{initials(s.shopName)}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-black text-gray-900">{s.shopName}</p>
                  <p className="truncate text-xs text-gray-500">{s.ownerName || s.fullName}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs font-bold text-gray-500">
                <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-gray-300" />Total {orders.length}</span>
                <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" />Pending {pending}</span>
                <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Delivered {delivered}</span>
              </div>
            </button>
          )
        }) : <p className="p-6 text-center text-sm font-bold text-gray-400">No verified sellers found.</p>}
      </div>
    </div>
  )
}

// ---------------- Give order wizard (right column) ----------------

const WizardSellerStep = ({ sellers, getSellerSlotInfo, onPick }) => (
  <div className="space-y-3">
    <p className="text-xs font-black uppercase tracking-wider text-gray-500">Verified sellers ({sellers.length})</p>
    {sellers.length ? sellers.map((s) => {
      const slots = getSellerSlotInfo(s.id)
      return (
        <button key={s.id} onClick={() => onPick(s.id)} className="flex w-full items-center gap-4 rounded-2xl border-2 border-gray-100 bg-white p-4 text-left hover:border-indigo-300 hover:bg-indigo-50/40">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-black text-emerald-700">{initials(s.shopName)}</div>
          <div className="min-w-0 flex-1">
            <p className="font-black text-gray-900">{s.shopName} <span className="font-semibold text-gray-400">· {s.ownerName || s.fullName}</span></p>
            <p className="truncate text-sm text-gray-500">{s.email}</p>
          </div>
          <div className="shrink-0 text-right text-xs font-bold text-gray-400">
            <p>{slots.used}/{slots.limit}</p>
            <p>{s.lastActive || 'Just now'}</p>
          </div>
        </button>
      )
    }) : <p className="rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center font-bold text-gray-400">No verified sellers yet.</p>}
  </div>
)

const WizardProductsStep = ({ products, selectedItems, onToggle }) => {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All categories')
  const categories = useMemo(() => ['All categories', ...new Set(products.map((p) => p.category))], [products])
  const filtered = useMemo(() => products.filter((p) => (
    (category === 'All categories' || p.category === category) &&
    (!query.trim() || p.name.toLowerCase().includes(query.toLowerCase().trim()))
  )), [products, category, query])
  const selectedIds = new Set(selectedItems.map((item) => item.catalogId))

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products..." className="flex-1 rounded-2xl border-2 border-gray-100 bg-white px-5 py-3 focus:border-indigo-500 focus:outline-none" />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-2xl border-2 border-gray-100 bg-white px-4 py-3 font-bold text-gray-700">
          {categories.map((c) => {
            const count = c === 'All categories' ? products.length : products.filter((p) => p.category === c).length
            return <option key={c} value={c}>{c} ({count})</option>
          })}
        </select>
      </div>
      <p className="text-sm font-bold text-gray-500">Tap a product to select ({selectedItems.length} selected) · showing {filtered.length} of {products.length}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {filtered.map((product) => {
          const isSelected = selectedIds.has(product.id)
          return (
            <button key={product.id} onClick={() => onToggle(product)} className={`relative overflow-hidden rounded-2xl border-2 bg-white text-left ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-gray-100'}`}>
              {isSelected && <span className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white"><svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></span>}
              <img src={product.image} alt={product.name} className="aspect-square w-full object-cover" />
              <div className="space-y-0.5 p-2.5">
                <p className="line-clamp-2 min-h-8 text-xs font-bold text-gray-900">{product.name}</p>
                <p className="text-[11px] font-semibold text-gray-400">{product.category}</p>
                <p className="text-xs font-black text-gray-900">Unit: {money(product.sell)}</p>
                <p className="text-[11px] font-bold text-gray-400">Cost: {money(product.cost)}</p>
              </div>
            </button>
          )
        })}
      </div>
      {!filtered.length && <p className="py-16 text-center font-bold text-gray-400">No products match.</p>}
    </div>
  )
}

const WizardReviewStep = ({ items, onQtyChange, onRemove, onClearAll }) => {
  const total = items.reduce((sum, item) => sum + item.sell * item.qty, 0)
  const cost = items.reduce((sum, item) => sum + item.cost * item.qty, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-wider text-gray-500">Order items ({items.length})</p>
        <button onClick={onClearAll} className="text-sm font-black text-rose-600">Clear all</button>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.catalogId} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
            <img src={item.image} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-bold text-gray-900">{item.name}</p>
              <p className="text-xs text-gray-500">{item.qty} x {money(item.sell)} = {money(item.sell * item.qty)}</p>
              <p className="text-xs text-gray-400">Cost {money(item.cost)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button onClick={() => onQtyChange(item.catalogId, -1)} className="rounded-lg bg-gray-100 px-2.5 py-1 font-black text-gray-700">-</button>
              <span className="w-5 text-center font-black">{item.qty}</span>
              <button onClick={() => onQtyChange(item.catalogId, 1)} className="rounded-lg bg-gray-100 px-2.5 py-1 font-black text-gray-700">+</button>
            </div>
            <span className="shrink-0 font-black text-indigo-700">+{money((item.sell - item.cost) * item.qty)}</span>
            <button onClick={() => onRemove(item.catalogId)} className="shrink-0 text-gray-300 hover:text-rose-600"><svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
        ))}
      </div>
      <div className="flex justify-between border-t border-gray-100 pt-4 font-black">
        <span>Order total {money(total)}</span>
        <span className="text-indigo-700">Profit {money(total - cost)}</span>
      </div>
    </div>
  )
}

const WizardCustomerStep = ({ customer, setCustomer, timing, setTiming, scheduledFor, setScheduledFor }) => {
  const set = (key, value) => setCustomer((current) => ({ ...current, [key]: value }))
  const fields = [
    ['fullName', 'Full name'], ['phone', 'Phone'],
    ['address1', 'Address line 1'], ['address2', 'Address line 2 (optional)'],
    ['city', 'City'], ['state', 'State'],
    ['postalCode', 'Postal code'],
  ]
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Enter customer info or use a random USA customer to test.</p>
        <button onClick={() => setCustomer(randomUSACustomer())} className="shrink-0 rounded-xl bg-amber-100 px-4 py-2 text-sm font-black text-amber-700 hover:bg-amber-200">✨ Random USA</button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(([key, label]) => (
          <label key={key} className="text-sm font-bold text-gray-600">
            {label}
            <input value={customer[key]} onChange={(e) => set(key, e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 focus:border-indigo-500 focus:outline-none" />
          </label>
        ))}
        <label className="text-sm font-bold text-gray-600">Country
          <select value={customer.country} onChange={(e) => set('country', e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3">
            <option>United States</option>
            <option>Canada</option>
            <option>United Kingdom</option>
            <option>India</option>
          </select>
        </label>
      </div>
      <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-gray-500">When to create this order</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <button onClick={() => setTiming('instant')} className={`rounded-2xl border-2 p-4 text-left ${timing === 'instant' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}>
            <p className="font-black">Instant</p><p className="text-sm text-gray-500">Create the order now</p>
          </button>
          <button onClick={() => setTiming('scheduled')} className={`rounded-2xl border-2 p-4 text-left ${timing === 'scheduled' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}>
            <p className="font-black">Scheduled</p><p className="text-sm text-gray-500">Auto-create at a future time</p>
          </button>
        </div>
        {timing === 'scheduled' && <input type="datetime-local" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} className="mt-3 w-full rounded-xl border border-gray-200 px-4 py-3" />}
      </div>
    </div>
  )
}

const GiveOrderWizard = ({ verifiedSellers, getSellerSlotInfo, getSellerShopProductsFull, createOrderForSeller, onDone, onExit }) => {
  const [step, setStep] = useState(1)
  const [sellerId, setSellerId] = useState(null)
  const [items, setItems] = useState([])
  const [customer, setCustomer] = useState(emptyCustomer)
  const [timing, setTiming] = useState('instant')
  const [scheduledFor, setScheduledFor] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const products = sellerId ? getSellerShopProductsFull(sellerId) : []

  const pickSeller = (id) => { setSellerId(id); setStep(2) }

  const toggleProduct = (product) => setItems((current) => {
    const exists = current.find((item) => item.catalogId === product.id)
    if (exists) return current.filter((item) => item.catalogId !== product.id)
    return [...current, { catalogId: product.id, name: product.name, image: product.image, cost: product.cost, sell: product.sell, qty: 1 }]
  })

  const changeQty = (catalogId, delta) => setItems((current) => current.map((item) => item.catalogId === catalogId ? { ...item, qty: Math.max(1, item.qty + delta) } : item))
  const removeItem = (catalogId) => setItems((current) => current.filter((item) => item.catalogId !== catalogId))

  const steps = ['Seller', 'Products', 'Review', 'Customer']

  const goBack = () => {
    if (step === 1) return onExit()
    setStep((s) => s - 1)
  }

  const submit = async () => {
    if (submitting) return
    setSubmitting(true)
    setError('')
    const result = await createOrderForSeller(sellerId, { items, customer, scheduledFor: timing === 'scheduled' ? scheduledFor : null })
    setSubmitting(false)
    if (!result.success) { setError(result.error); return }
    const totalQty = items.reduce((sum, item) => sum + item.qty, 0)
    onDone(sellerId, `Order created for ${customer.fullName || 'customer'} (${items.length} item${items.length === 1 ? '' : 's'} of ${totalQty})`)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={goBack} className="rounded-xl border border-gray-200 bg-white px-4 py-2 font-bold text-gray-700">← Back</button>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {steps.map((label, index) => (
            <div key={label} className={`rounded-full px-3.5 py-1.5 text-xs font-black whitespace-nowrap ${step === index + 1 ? 'bg-indigo-600 text-white' : step > index + 1 ? 'bg-emerald-100 text-emerald-700' : 'border border-gray-200 bg-white text-gray-500'}`}>{index + 1} {label}</div>
          ))}
        </div>
        <span className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-black text-gray-400">Viewing Give Order</span>
      </div>

      {step === 1 && <WizardSellerStep sellers={verifiedSellers} getSellerSlotInfo={getSellerSlotInfo} onPick={pickSeller} />}
      {step === 2 && <WizardProductsStep products={products} selectedItems={items} onToggle={toggleProduct} />}
      {step === 3 && <WizardReviewStep items={items} onQtyChange={changeQty} onRemove={removeItem} onClearAll={() => setItems([])} />}
      {step === 4 && <WizardCustomerStep customer={customer} setCustomer={setCustomer} timing={timing} setTiming={setTiming} scheduledFor={scheduledFor} setScheduledFor={setScheduledFor} />}

      {error && <p className="rounded-xl bg-rose-50 p-3 text-center font-bold text-rose-700">{error}</p>}

      {step > 1 && step < 4 && (
        <button
          onClick={() => setStep((s) => s + 1)}
          disabled={step === 2 && !items.length}
          className="w-full rounded-2xl bg-indigo-600 px-5 py-4 font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {step === 2 ? `Next: Review items (${items.length})` : 'Next: Customer'}
        </button>
      )}
      {step === 4 && (
        <button onClick={submit} disabled={!customer.fullName.trim() || submitting} className="w-full rounded-2xl bg-indigo-600 px-5 py-4 font-black text-white disabled:cursor-not-allowed disabled:opacity-40">
          Create order
        </button>
      )}
    </div>
  )
}

// ---------------- Seller order detail (right column, normal mode) ----------------

const AdminOrderCard = ({ order, onStatusChange }) => {
  const [open, setOpen] = useState(false)
  const nextOptions = STAGES.slice(STAGES.indexOf(order.status) + 1)
  const canAdvance = order.status !== 'Unpaid' && !['Delivered', 'Cancelled'].includes(order.status)

  return (
    <article className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 p-4 text-left">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-lg font-black text-gray-500">{order.items.length}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-black text-gray-900">{order.customer?.fullName || 'Customer'} <span className="font-semibold text-gray-400">{order.items.length} items</span></p>
          <p className="text-xs font-semibold text-gray-500">{order.qty} units · {new Date(order.createdAt).toLocaleDateString()} · {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-black text-gray-900">{money(order.total)}</p>
          <p className="text-xs font-bold text-emerald-600">Profit {money(order.profit)}</p>
        </div>
        <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-black ${STATUS_BADGE[order.status] || 'bg-gray-100 text-gray-500'}`}>{order.status}</span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-gray-100 p-4">
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
            <div><p className="text-xs font-black uppercase tracking-wider text-gray-400">Customer</p><p className="mt-0.5 font-bold text-gray-800">{order.customer?.fullName || '—'}</p></div>
            <div><p className="text-xs font-black uppercase tracking-wider text-gray-400">Phone</p><p className="mt-0.5 font-bold text-gray-800">{order.customer?.phone || '—'}</p></div>
            <div><p className="text-xs font-black uppercase tracking-wider text-gray-400">Address</p><p className="mt-0.5 font-bold text-gray-800">{[order.customer?.address1, order.customer?.city, order.customer?.state, order.customer?.postalCode].filter(Boolean).join(', ') || '—'}</p></div>
          </div>
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
          {canAdvance ? (
            <label className="flex items-center gap-2 text-sm font-bold text-gray-600">
              Update status
              <select value="" onChange={(e) => e.target.value && onStatusChange(order.id, e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 font-bold text-gray-900">
                <option value="">Choose next stage…</option>
                {nextOptions.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
                <option value="Cancelled">Cancelled</option>
              </select>
            </label>
          ) : order.status === 'Unpaid' ? (
            <p className="text-sm font-bold text-amber-600">Waiting for the seller to pay and process this order.</p>
          ) : (
            <p className="text-sm font-bold text-gray-400">This order is {order.status.toLowerCase()}.</p>
          )}
        </div>
      )}
    </article>
  )
}

const SellerOrdersPanel = ({ seller, orders, onStatusChange }) => {
  const [showHidden, setShowHidden] = useState(false)
  const visible = orders.filter((o) => showHidden || o.status !== 'Cancelled')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900">{seller.shopName}</h2>
        <button onClick={() => setShowHidden((v) => !v)} className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm font-bold text-gray-600 hover:bg-gray-50">
          {showHidden ? 'Hide cancelled' : 'Show hidden'}
        </button>
      </div>
      {visible.length ? (
        <div className="space-y-3">{visible.map((order) => <AdminOrderCard key={order.id} order={order} onStatusChange={onStatusChange} />)}</div>
      ) : (
        <div className="rounded-3xl border-2 border-dashed border-gray-200 p-16 text-center font-bold text-gray-400">No orders for this seller yet.</div>
      )}
    </div>
  )
}

// ---------------- Root page ----------------

const AdminOrders = () => {
  const { admin, getVerifiedSellersForAdmin, getSellerSlotInfo, getSellerShopProductsFull, getSellerOrders, createOrderForSeller, updateGivenOrderStatus } = useAuth()
  const [search, setSearch] = useState('')
  const [selectedSellerId, setSelectedSellerId] = useState(null)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [statusError, setStatusError] = useState('')

  const verifiedSellers = getVerifiedSellersForAdmin(admin.id)
  const selectedSeller = verifiedSellers.find((s) => s.id === selectedSellerId)

  const handleWizardDone = (sellerId, message) => {
    setWizardOpen(false)
    setSelectedSellerId(sellerId)
    setToast(message)
    setTimeout(() => setToast(''), 4000)
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">Fulfillment queue</p>
          <h1 className="mt-1 text-3xl font-black text-gray-900">Orders</h1>
          <p className="mt-1 text-gray-500">Update seller orders through pickup, delivering, and completed.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-2xl border border-gray-200 bg-white px-4 py-3 font-bold text-gray-700 hover:bg-gray-50">📅 Schedules</button>
          <button
            onClick={() => !wizardOpen && setWizardOpen(true)}
            disabled={wizardOpen}
            className="rounded-2xl bg-indigo-600 px-5 py-3 font-black text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
          >
            {wizardOpen ? 'Viewing Give Order' : '+ Give Order'}
          </button>
        </div>
      </div>

      {toast && <p className="rounded-2xl bg-emerald-50 p-3.5 text-center font-bold text-emerald-700">✅ {toast}</p>}
      {statusError && <p className="rounded-2xl bg-rose-50 p-3.5 text-center font-bold text-rose-700">{statusError}</p>}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[340px_1fr]">
        <div className="lg:h-[calc(100vh-260px)] lg:min-h-[420px]">
          <SellerListPanel sellers={verifiedSellers} selectedSellerId={selectedSellerId} onSelect={(id) => { setSelectedSellerId(id); setWizardOpen(false) }} search={search} setSearch={setSearch} getSellerOrders={getSellerOrders} />
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm lg:p-6">
          {wizardOpen ? (
            <GiveOrderWizard
              verifiedSellers={verifiedSellers}
              getSellerSlotInfo={getSellerSlotInfo}
              getSellerShopProductsFull={getSellerShopProductsFull}
              createOrderForSeller={createOrderForSeller}
              onDone={handleWizardDone}
              onExit={() => setWizardOpen(false)}
            />
          ) : selectedSeller ? (
            <SellerOrdersPanel
              seller={selectedSeller}
              orders={getSellerOrders(selectedSeller.id)}
              onStatusChange={async (orderId, status) => {
                const result = await updateGivenOrderStatus(selectedSeller.id, orderId, status)
                setStatusError(result.success ? '' : result.error || 'Could not update the order.')
              }}
            />
          ) : (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 text-gray-300">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </div>
              <p className="text-xl font-black text-gray-800">No seller selected</p>
              <p className="mt-2 max-w-sm text-gray-500">Pick a seller from the list to see their active orders and update pickup, delivering, and completion status from here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminOrders
