import { useMemo, useState } from 'react'
import { decodeEntities } from '../../lib/activityFeed'
import { fromLocalInput, quickTimes, whenLabel } from '../../lib/schedules'
import { isOnline } from '../../lib/supportChat'
import { Icon } from './icons'
import { ShopAvatar, money, useCopy } from './ui'

const RANDOM_NAMES = ['Parker Brown', 'Jamie Jackson', 'Taylor Reed', 'Morgan Lee', 'Casey Diaz', 'Jordan Blake', 'Riley Chen', 'Avery Scott']
const RANDOM_PLACES = [
  ['Boston', 'MA', '02101'],
  ['Austin', 'TX', '73301'],
  ['Seattle', 'WA', '98101'],
  ['Denver', 'CO', '80201'],
  ['Miami', 'FL', '33101'],
  ['Chicago', 'IL', '60601'],
]
const RANDOM_STREETS = ['Elm St', 'Oak Ave', 'Maple Dr', 'Cedar Ln', 'Pine St', '2nd Ave']
const pick = (list) => list[Math.floor(Math.random() * list.length)]

const randomUSACustomer = () => {
  const [city, state, postalCode] = pick(RANDOM_PLACES)
  return {
    fullName: pick(RANDOM_NAMES),
    phone: `+1 ${Math.floor(200 + Math.random() * 700)}-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`,
    address1: `${Math.floor(100 + Math.random() * 9000)} ${pick(RANDOM_STREETS)}`,
    address2: '',
    city,
    state,
    postalCode,
    country: 'United States',
  }
}

const emptyCustomer = { fullName: '', phone: '', address1: '', address2: '', city: '', state: '', postalCode: '', country: 'United States' }

const STEPS = ['Seller', 'Products', 'Review', 'Customer']

const Stepper = ({ step }) => (
  <ol className="flex items-center gap-1 overflow-x-auto" aria-label="Give order steps">
    {STEPS.map((label, index) => {
      const number = index + 1
      const done = step > number
      const current = step === number
      return (
        <li key={label} className="flex shrink-0 items-center gap-1" aria-current={current ? 'step' : undefined}>
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${current ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : done ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
            <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${current ? 'bg-white/25' : done ? 'bg-indigo-600 text-white' : 'bg-white'}`}>
              {done ? <Icon name="check" className="h-2.5 w-2.5" strokeWidth={3.5} /> : number}
            </span>
            {label}
          </span>
          {number < STEPS.length && <span className={`h-px w-6 sm:w-10 ${done ? 'bg-indigo-300' : 'bg-slate-200'}`} />}
        </li>
      )
    })}
  </ol>
)

const SellerStep = ({ sellers, getSellerSlotInfo, onPick, now }) => {
  const [copied, copy] = useCopy()
  const [term, setTerm] = useState('')
  const shown = sellers.filter((seller) => `${seller.shopName} ${seller.ownerName || seller.fullName} ${seller.email}`.toLowerCase().includes(term.trim().toLowerCase()))
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Verified sellers ({sellers.length})</p>
      {sellers.length > 5 && (
        <input value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Search sellers..." aria-label="Search sellers" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none" />
      )}
      {shown.length ? (
        shown.map((seller) => {
          const slots = getSellerSlotInfo(seller.id)
          return (
            <div
              key={seller.id}
              role="button"
              tabIndex={0}
              onClick={() => onPick(seller.id)}
              onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && (event.preventDefault(), onPick(seller.id))}
              className="flex cursor-pointer items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-indigo-300 hover:bg-indigo-50/30"
            >
              <ShopAvatar name={seller.shopName} online={isOnline(seller, now)} className="h-12 w-12 text-lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-black text-slate-900">
                  {seller.shopName} <span className="text-xs font-semibold text-slate-400">· {seller.ownerName || seller.fullName}</span>
                </p>
                <p className="flex items-center gap-1.5 text-sm text-slate-500">
                  <span className="truncate">{seller.email}</span>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      copy(seller.email, seller.id)
                    }}
                    aria-label={`Copy ${seller.email}`}
                    className="shrink-0 text-slate-400 hover:text-indigo-600"
                  >
                    <Icon name={copied === seller.id ? 'check' : 'copy'} className="h-3.5 w-3.5" />
                  </button>
                </p>
              </div>
              <div className="shrink-0 space-y-1 text-right text-xs font-semibold text-slate-400">
                <p className="flex items-center justify-end gap-1.5" title="Products in their shop / product limit">
                  <Icon name="box" className="h-3.5 w-3.5" />
                  {slots.used}/{slots.limit}
                </p>
                <p className="flex items-center justify-end gap-1.5" title="Last active">
                  <Icon name="clock" className="h-3.5 w-3.5" />
                  {isOnline(seller, now) ? 'Online' : seller.lastActive || 'Just now'}
                </p>
              </div>
            </div>
          )
        })
      ) : (
        <p className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center font-semibold text-slate-400">{sellers.length ? 'No sellers match your search.' : 'No verified sellers yet. Approve a seller\'s KYC first.'}</p>
      )}
    </div>
  )
}

const ProductsStep = ({ products, selectedItems, onToggle }) => {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All categories')
  const categories = useMemo(() => ['All categories', ...new Set(products.map((product) => product.category))], [products])
  const filtered = useMemo(
    () => products.filter((product) => (category === 'All categories' || product.category === category) && (!query.trim() || decodeEntities(product.name).toLowerCase().includes(query.toLowerCase().trim()))),
    [products, category, query]
  )
  const selectedIds = new Set(selectedItems.map((item) => item.catalogId))

  if (!products.length) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
        <p className="font-bold text-slate-500">This seller has no products in their shop yet.</p>
        <p className="mt-1 text-sm text-slate-400">They need to add products from the catalogue before you can give them an order.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products..." aria-label="Search products" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10" />
        </div>
        <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Category" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700">
          {categories.map((name) => (
            <option key={name} value={name}>
              {decodeEntities(name)} ({name === 'All categories' ? products.length : products.filter((product) => product.category === name).length})
            </option>
          ))}
        </select>
      </div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
        Tap a product to select · {selectedItems.length} selected · showing {filtered.length} of {products.length}
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {filtered.map((product) => {
          const selected = selectedIds.has(product.id)
          return (
            <button key={product.id} type="button" onClick={() => onToggle(product)} aria-pressed={selected} className={`relative overflow-hidden rounded-2xl border-2 bg-white text-left transition ${selected ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-100 hover:border-slate-200'}`}>
              {selected && (
                <span className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white shadow">
                  <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
              )}
              <img src={product.image} alt="" loading="lazy" className="aspect-square w-full bg-slate-50 object-cover" />
              <div className="space-y-0.5 p-2.5">
                <p className="line-clamp-2 min-h-[2rem] text-xs font-bold leading-4 text-slate-900">{decodeEntities(product.name)}</p>
                <p className="truncate text-[11px] font-semibold text-indigo-600">{decodeEntities(product.category)}</p>
                <p className="text-xs font-black text-slate-900">Unit: {money(product.sell)}</p>
                <p className="text-[11px] font-semibold text-slate-400">Cost: {money(product.cost)}</p>
              </div>
            </button>
          )
        })}
      </div>
      {!filtered.length && <p className="py-12 text-center font-semibold text-slate-400">No products match.</p>}
    </div>
  )
}

const ReviewStep = ({ items, onQtyChange, onRemove, onClearAll }) => {
  const total = items.reduce((sum, item) => sum + item.sell * item.qty, 0)
  const cost = items.reduce((sum, item) => sum + item.cost * item.qty, 0)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Order items ({items.length})</p>
        <button type="button" onClick={onClearAll} className="text-sm font-bold text-slate-500 hover:text-rose-600">
          Clear all
        </button>
      </div>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.catalogId} className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-nowrap">
            <img src={item.image} alt="" className="h-14 w-14 shrink-0 rounded-xl bg-slate-50 object-cover" />
            <div className="min-w-0 flex-1 basis-48">
              <p className="line-clamp-2 text-sm font-bold text-slate-900">{decodeEntities(item.name)}</p>
              <p className="text-xs text-slate-500">
                {item.qty} × {money(item.sell)} = {money(item.sell * item.qty)}
              </p>
              <p className="text-xs text-slate-400">Cost: {money(item.cost)}</p>
            </div>
            <div className="flex shrink-0 items-center overflow-hidden rounded-xl border border-slate-200">
              <button type="button" onClick={() => onQtyChange(item.catalogId, -1)} disabled={item.qty <= 1} aria-label="Decrease quantity" className="px-3 py-1.5 font-black text-slate-600 hover:bg-slate-50 disabled:opacity-30">
                −
              </button>
              <span className="w-8 text-center text-sm font-black" aria-label="Quantity">
                {item.qty}
              </span>
              <button type="button" onClick={() => onQtyChange(item.catalogId, 1)} aria-label="Increase quantity" className="px-3 py-1.5 font-black text-slate-600 hover:bg-slate-50">
                +
              </button>
            </div>
            <span className="shrink-0 font-black text-indigo-600">+{money((item.sell - item.cost) * item.qty)}</span>
            <button type="button" onClick={() => onRemove(item.catalogId)} aria-label={`Remove ${decodeEntities(item.name)}`} className="shrink-0 text-slate-300 hover:text-rose-600">
              <Icon name="xCircle" className="h-5 w-5" />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-4 text-sm font-black">
        <span className="text-slate-800">Order total {money(total)}</span>
        <span className="text-slate-500">Seller pays {money(cost)}</span>
        <span className="text-indigo-600">Profit {money(total - cost)}</span>
      </div>
    </div>
  )
}

const Input = ({ label, value, onChange, error, ...rest }) => (
  <label className="block text-xs font-bold text-slate-600">
    {label}
    <input value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={!!error} className={`mt-1 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-4 ${error ? 'border-rose-300 focus:ring-rose-500/10' : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-500/10'}`} {...rest} />
  </label>
)

const CustomerStep = ({ customer, setCustomer, timing, setTiming, scheduledLocal, setScheduledLocal, whenError }) => {
  const set = (key) => (value) => setCustomer((current) => ({ ...current, [key]: value }))
  const quick = quickTimes()
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-500">Enter the customer's details, or fill in a random US customer to try it out.</p>
        <button type="button" onClick={() => setCustomer(randomUSACustomer())} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-amber-100 px-3.5 py-2 text-sm font-bold text-amber-700 hover:bg-amber-200">
          <Icon name="sparkles" className="h-4 w-4" />
          Random USA
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Full name" value={customer.fullName} onChange={set('fullName')} maxLength={80} />
        <Input label="Phone" value={customer.phone} onChange={set('phone')} maxLength={30} inputMode="tel" />
        <Input label="Address line 1" value={customer.address1} onChange={set('address1')} maxLength={120} />
        <Input label="Address line 2 (optional)" value={customer.address2} onChange={set('address2')} maxLength={120} />
        <Input label="City" value={customer.city} onChange={set('city')} maxLength={60} />
        <Input label="State" value={customer.state} onChange={set('state')} maxLength={60} />
        <Input label="Postal code" value={customer.postalCode} onChange={set('postalCode')} maxLength={20} />
        <label className="block text-xs font-bold text-slate-600">
          Country
          <select value={customer.country} onChange={(event) => set('country')(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900">
            {['United States', 'Canada', 'United Kingdom', 'India'].map((country) => (
              <option key={country}>{country}</option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="rounded-2xl border border-slate-200 bg-white p-4">
        <legend className="px-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">When to create this order</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ['instant', 'Instant', 'Create the order now', 'play'],
            ['scheduled', 'Scheduled', 'Create it automatically at a chosen time', 'calendarClock'],
          ].map(([value, title, hint, icon]) => (
            <button key={value} type="button" onClick={() => setTiming(value)} aria-pressed={timing === value} className={`flex items-start gap-3 rounded-xl border-2 p-3.5 text-left transition ${timing === value ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}>
              <span className={`mt-0.5 ${timing === value ? 'text-indigo-600' : 'text-slate-400'}`}>
                <Icon name={icon} className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-black text-slate-900">{title}</span>
                <span className="block text-xs text-slate-500">{hint}</span>
              </span>
            </button>
          ))}
        </div>
        {timing === 'scheduled' && (
          <div className="mt-4 space-y-3">
            <label className="block text-xs font-bold text-slate-600">
              Date and time
              <input type="datetime-local" value={scheduledLocal} onChange={(event) => setScheduledLocal(event.target.value)} aria-invalid={!!whenError} className={`mt-1 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-4 ${whenError ? 'border-rose-300 focus:ring-rose-500/10' : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-500/10'}`} />
            </label>
            <div className="flex flex-wrap gap-2">
              {quick.map((choice) => (
                <button key={choice.label} type="button" onClick={() => setScheduledLocal(choice.value)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${scheduledLocal === choice.value ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {choice.label}
                </button>
              ))}
            </div>
            {whenError ? (
              <p className="text-xs font-semibold text-rose-600">{whenError}</p>
            ) : (
              <p className="text-xs text-slate-400">Scheduled orders are created while the admin console is open. If the time passes while it is closed, the order is created the next time you open it.</p>
            )}
          </div>
        )}
      </fieldset>
    </div>
  )
}

const GiveOrderWizard = ({ verifiedSellers, getSellerSlotInfo, getSellerShopProductsFull, createOrderForSeller, scheduleOrderForSeller, onDone, onExit, now }) => {
  const [step, setStep] = useState(1)
  const [sellerId, setSellerId] = useState(null)
  const [items, setItems] = useState([])
  const [customer, setCustomer] = useState(emptyCustomer)
  const [timing, setTiming] = useState('instant')
  const [scheduledLocal, setScheduledLocal] = useState(() => quickTimes()[2].value)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const products = sellerId ? getSellerShopProductsFull(sellerId) : []
  const seller = verifiedSellers.find((candidate) => candidate.id === sellerId)
  const total = items.reduce((sum, item) => sum + item.sell * item.qty, 0)
  const profit = items.reduce((sum, item) => sum + (item.sell - item.cost) * item.qty, 0)

  const scheduledIso = fromLocalInput(scheduledLocal)
  const whenError = timing !== 'scheduled' ? '' : !scheduledIso ? 'Pick a date and time.' : Date.parse(scheduledIso) <= Date.now() ? 'Pick a time in the future.' : ''
  const canCreate = !!customer.fullName.trim() && !whenError && !submitting

  const pickSeller = (id) => {
    // A different seller has different products: start the order over.
    if (id !== sellerId) setItems([])
    setSellerId(id)
    setStep(2)
  }

  const toggleProduct = (product) =>
    setItems((current) =>
      current.some((item) => item.catalogId === product.id)
        ? current.filter((item) => item.catalogId !== product.id)
        : [...current, { catalogId: product.id, name: product.name, image: product.image, cost: product.cost, sell: product.sell, qty: 1 }]
    )
  const changeQty = (catalogId, delta) => setItems((current) => current.map((item) => (item.catalogId === catalogId ? { ...item, qty: Math.max(1, item.qty + delta) } : item)))
  const removeItem = (catalogId) => setItems((current) => current.filter((item) => item.catalogId !== catalogId))

  const back = () => (step === 1 ? onExit() : setStep((current) => current - 1))

  const submit = async () => {
    if (!canCreate) return
    setSubmitting(true)
    setError('')
    const cleaned = Object.fromEntries(Object.entries(customer).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]))
    const scheduled = timing === 'scheduled'
    const result = scheduled ? await scheduleOrderForSeller(sellerId, { items, customer: cleaned, scheduledFor: scheduledIso }) : await createOrderForSeller(sellerId, { items, customer: cleaned })
    setSubmitting(false)
    if (!result.success) return setError(result.error || 'Could not create the order.')
    const units = items.reduce((sum, item) => sum + item.qty, 0)
    const summary = `${cleaned.fullName} (${items.length} item${items.length === 1 ? '' : 's'} of ${units})`
    onDone(sellerId, scheduled ? `Order scheduled for ${summary} — ${whenLabel(scheduledIso)}` : `Order created for ${summary}`, scheduled)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={back} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100">
          <Icon name="arrowLeft" className="h-4 w-4" />
          Back
        </button>
        <Stepper step={step} />
        {seller && step > 1 && <span className="ml-auto hidden truncate text-xs font-semibold text-slate-400 lg:block">for {seller.shopName}</span>}
      </div>

      {step === 1 && <SellerStep sellers={verifiedSellers} getSellerSlotInfo={getSellerSlotInfo} onPick={pickSeller} now={now} />}
      {step === 2 && <ProductsStep products={products} selectedItems={items} onToggle={toggleProduct} />}
      {step === 3 && <ReviewStep items={items} onQtyChange={changeQty} onRemove={removeItem} onClearAll={() => setItems([])} />}
      {step === 4 && <CustomerStep customer={customer} setCustomer={setCustomer} timing={timing} setTiming={setTiming} scheduledLocal={scheduledLocal} setScheduledLocal={setScheduledLocal} whenError={whenError} />}

      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </p>
      )}

      {step > 1 && (
        <div className="sticky bottom-0 -mx-5 -mb-5 flex items-center justify-between gap-3 rounded-b-3xl border-t border-slate-100 bg-white/95 px-5 py-3 backdrop-blur lg:-mx-6 lg:-mb-6 lg:px-6">
          <p className="min-w-0 truncate text-xs font-semibold text-slate-500">
            {items.length ? `${items.length} item${items.length === 1 ? '' : 's'} · ${money(total)} · profit ${money(profit)}` : 'No products selected yet'}
          </p>
          {step < 4 ? (
            <button type="button" onClick={() => setStep((current) => current + 1)} disabled={!items.length} className="shrink-0 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none">
              {step === 2 ? `Next: Review items${items.length ? ` (${items.length})` : ''}` : 'Next: Customer'}
            </button>
          ) : (
            <button type="button" onClick={submit} disabled={!canCreate} className="shrink-0 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none">
              {submitting ? 'Working…' : timing === 'scheduled' ? 'Schedule order' : 'Create order'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default GiveOrderWizard
