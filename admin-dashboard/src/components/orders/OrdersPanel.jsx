import { useEffect, useMemo, useRef, useState } from 'react'
import { decodeEntities } from '../../lib/activityFeed'
import { FILTERS, STAGES, bulkTargets, filterOrders, nextStages, orderAge, planBulkMove, statusCounts } from '../../lib/orders'
import { Icon } from './icons'
import { ConfirmDialog, STATUS_STYLE, StatusPill, money, useOutside } from './ui'

const when = (iso) => {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : `${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}, ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}`
}

const Field = ({ label, children }) => (
  <div className="min-w-0">
    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
    <p className="mt-0.5 break-words text-sm font-semibold text-slate-800">{children || '—'}</p>
  </div>
)

// Unpaid → Paid → Pickup → … → Delivered, with where this order is highlighted.
const Timeline = ({ status }) => {
  if (status === 'Cancelled') return <p className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-500">This order was cancelled.</p>
  const steps = ['Unpaid', ...STAGES]
  const at = steps.indexOf(status)
  return (
    <ol className="flex items-center gap-1 overflow-x-auto pb-1" aria-label="Order progress">
      {steps.map((step, index) => (
        <li key={step} className="flex shrink-0 items-center gap-1">
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${index < at ? 'bg-emerald-100 text-emerald-700' : index === at ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
            {index < at ? '✓ ' : ''}
            {step}
          </span>
          {index < steps.length - 1 && <span className={`h-px w-3 ${index < at ? 'bg-emerald-300' : 'bg-slate-200'}`} />}
        </li>
      ))}
    </ol>
  )
}

// The status pill; for an order that can still move, it opens the stages it can move to.
const StatusMenu = ({ order, onPick }) => {
  const [open, setOpen] = useState(false)
  const ref = useOutside(open, () => setOpen(false))
  const options = [...nextStages(order), ...(order.status === 'Delivered' || order.status === 'Cancelled' ? [] : ['Cancelled'])]
  if (!options.length) return <StatusPill status={order.status} />
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          setOpen((value) => !value)
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Status ${order.status}: change`}
        className="inline-flex items-center gap-1 rounded-full"
      >
        <StatusPill status={order.status} />
        <Icon name="chevronDown" className="h-3.5 w-3.5 text-slate-400" />
      </button>
      {open && (
        <ul role="menu" className="absolute right-0 top-full z-30 mt-1.5 w-48 overflow-hidden rounded-xl border border-slate-100 bg-white py-1 shadow-xl">
          <li className="px-3 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Move to</li>
          {options.map((status) => (
            <li key={status}>
              <button
                type="button"
                role="menuitem"
                onClick={(event) => {
                  event.stopPropagation()
                  setOpen(false)
                  onPick(status)
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold hover:bg-slate-50 ${status === 'Cancelled' ? 'text-rose-600' : 'text-slate-700'}`}
              >
                <span className={`h-2 w-2 rounded-full ${STATUS_STYLE[status].dot}`} />
                {status}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const OrderRow = ({ order, open, onToggle, checked, onCheck, now, onMove, busy }) => {
  const options = nextStages(order)
  const customer = order.customer || {}
  const address = [customer.address1, customer.address2, customer.city, customer.state, customer.postalCode, customer.country].filter(Boolean).join(', ')
  const ref = useRef(null)
  useEffect(() => {
    if (open && order.focus) ref.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [open, order.focus])

  return (
    <article ref={ref} className={`rounded-2xl border bg-white shadow-sm transition ${checked ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-slate-100'}`}>
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={onToggle}
        onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && (event.preventDefault(), onToggle())}
        className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-2 p-3.5 sm:flex-nowrap"
      >
        <button
          type="button"
          role="checkbox"
          aria-checked={checked}
          aria-label={`Select order for ${customer.fullName || 'customer'}`}
          onClick={(event) => {
            event.stopPropagation()
            onCheck()
          }}
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${checked ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 hover:border-indigo-400'}`}
        >
          {checked && <Icon name="check" className="h-3 w-3" strokeWidth={3.5} />}
        </button>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg font-black text-slate-500">{order.items.length}</span>
        <div className="min-w-0 flex-1 basis-40">
          <p className="flex items-center gap-2">
            <span className="truncate font-black text-slate-900">{customer.fullName || 'Customer'}</span>
            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">
              {order.items.length} item{order.items.length === 1 ? '' : 's'}
            </span>
            {order.scheduledFor && (
              <span title={`Scheduled for ${when(order.scheduledFor)}`} className="shrink-0 text-indigo-500">
                <Icon name="calendarClock" className="h-4 w-4" />
              </span>
            )}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs font-medium text-slate-500">
            <span>
              {order.qty} unit{order.qty === 1 ? '' : 's'}
            </span>
            <span aria-hidden>•</span>
            <span>{when(order.createdAt)}</span>
            <span aria-hidden>•</span>
            <span className={`inline-flex items-center gap-1 font-semibold ${order.status === 'Unpaid' ? 'text-rose-500' : 'text-slate-400'}`} title="Time since the order was given">
              <Icon name="clock" className="h-3.5 w-3.5" />
              {orderAge(order.createdAt, now)}
            </span>
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-black text-slate-900">{money(order.total)}</p>
          <p className="text-xs font-semibold text-slate-400">Profit: {money(order.profit)}</p>
        </div>
        <StatusMenu order={order} onPick={(status) => onMove([order], status)} />
        <Icon name="chevronDown" className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>

      {open && (
        <div className="space-y-4 border-t border-slate-100 p-4">
          <Timeline status={order.status} />

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Customer">{customer.fullName}</Field>
            <Field label="Phone">{customer.phone}</Field>
            <Field label="Address">{address}</Field>
          </div>

          <ul className="space-y-2">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5">
                <img src={item.image} alt="" className="h-12 w-12 shrink-0 rounded-lg bg-white object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-800">{decodeEntities(item.name)}</p>
                  <p className="text-xs text-slate-500">
                    {item.qty} × {money(item.sell)} · cost {money(item.cost)}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-black text-slate-900">{money(item.sell * item.qty)}</span>
              </li>
            ))}
          </ul>

          <div className="grid grid-cols-3 gap-3 rounded-xl border border-slate-100 p-3 text-center">
            <Field label="Order total">{money(order.total)}</Field>
            <Field label="Seller pays">{money(order.cost)}</Field>
            <Field label="Seller profit">{money(order.profit)}</Field>
          </div>

          {order.status === 'Unpaid' && <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">Waiting for the seller to pay {money(order.cost)} to start this order.</p>}
          {order.scheduledFor && <p className="text-xs font-medium text-slate-400">Scheduled for {when(order.scheduledFor)}, created {when(order.createdAt)}.</p>}

          {(options.length > 0 || (order.status !== 'Delivered' && order.status !== 'Cancelled')) && (
            <div className="flex flex-wrap items-center gap-2">
              {options[0] && (
                <button type="button" disabled={busy} onClick={() => onMove([order], options[0])} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50">
                  Mark {options[0]}
                </button>
              )}
              {options.slice(1).length > 0 && (
                <select
                  value=""
                  disabled={busy}
                  onChange={(event) => event.target.value && onMove([order], event.target.value)}
                  aria-label="Move to another stage"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                >
                  <option value="">Skip ahead to…</option>
                  {options.slice(1).map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              )}
              {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                <button type="button" disabled={busy} onClick={() => onMove([order], 'Cancelled')} className="ml-auto rounded-xl border border-rose-200 px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50">
                  Cancel order
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  )
}

// One seller's orders: filter by stage, search, pick several to move together, expand one for its details.
const OrdersPanel = ({ seller, orders, now, moveOrder, notify, focusOrderId }) => {
  const [status, setStatus] = useState('All')
  const [term, setTerm] = useState('')
  const [showCancelled, setShowCancelled] = useState(false)
  const [open, setOpen] = useState(() => new Set(focusOrderId ? [focusOrderId] : []))
  const [picked, setPicked] = useState(() => new Set())
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)

  const counts = useMemo(() => statusCounts(orders, showCancelled), [orders, showCancelled])
  const visible = useMemo(() => filterOrders(orders, { status, term, showCancelled }), [orders, status, term, showCancelled])
  const selection = orders.filter((order) => picked.has(order.id))
  const cancelledCount = orders.filter((order) => order.status === 'Cancelled').length

  // Whatever leaves the list (cancelled and now hidden, or removed) also leaves the selection.
  useEffect(() => {
    setPicked((current) => {
      const ids = new Set(visible.map((order) => order.id))
      const next = new Set([...current].filter((id) => ids.has(id)))
      return next.size === current.size ? current : next
    })
  }, [visible])

  const toggle = (set, setter, id) =>
    setter((current) => {
      const next = new Set(current)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const run = async (targets, to) => {
    setBusy(true)
    const plan = planBulkMove(targets, to)
    let failed = 0
    let firstError = ''
    for (const order of plan.move) {
      const result = await moveOrder(order.id, to)
      if (!result.success) {
        failed += 1
        firstError = firstError || result.error
      }
    }
    setBusy(false)
    setConfirm(null)
    setPicked(new Set())
    const moved = plan.move.length - failed
    if (moved) {
      const skipped = plan.skip.length ? ` ${plan.skip.length} skipped (cannot move to ${to}).` : ''
      notify(to === 'Cancelled' ? `Cancelled ${moved} order${moved === 1 ? '' : 's'}.${skipped}` : `Moved ${moved} order${moved === 1 ? '' : 's'} to ${to}.${skipped}`)
    }
    if (failed) notify(firstError || 'Some orders could not be updated.', 'error')
    else if (!moved) notify(`${targets.length === 1 ? 'This order' : 'These orders'} cannot move to ${to}.`, 'error')
  }

  const request = (targets, to) => {
    const eligible = to === 'Cancelled' ? planBulkMove(targets, 'Cancelled').move : []
    if (eligible.length) setConfirm({ targets: eligible })
    else run(targets, to)
  }

  const allShownPicked = visible.length > 0 && visible.every((order) => picked.has(order.id))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-bold text-slate-700">
          <Icon name="store" className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="truncate">{seller.shopName}</span>
        </span>
        {cancelledCount > 0 && (
          <button
            type="button"
            onClick={() => setShowCancelled((value) => !value)}
            aria-pressed={showCancelled}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <Icon name="trash" className="h-4 w-4" />
            {showCancelled ? 'Hide cancelled' : `Show hidden (${cancelledCount})`}
          </button>
        )}
      </div>

      {orders.length > 0 && (
        <>
          <div className="relative">
            <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Search customer, city or product..."
              aria-label="Search orders"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Filter by status">
            {FILTERS.filter((filter) => filter === 'All' || counts[filter] > 0 || filter === status).map((filter) => (
              <button
                key={filter}
                type="button"
                role="tab"
                aria-selected={status === filter}
                onClick={() => setStatus(filter)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition ${status === filter ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {filter} <span className={status === filter ? 'text-slate-300' : 'text-slate-400'}>{counts[filter]}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {selection.length > 0 && (
        <div className="sticky top-2 z-20 flex flex-wrap items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-white shadow-xl">
          <span className="text-sm font-bold">{selection.length} selected</span>
          <select
            value=""
            disabled={busy}
            onChange={(event) => event.target.value && request(selection, event.target.value)}
            aria-label="Move selected orders"
            className="ml-auto rounded-lg border-0 bg-white/15 px-3 py-1.5 text-sm font-semibold text-white"
          >
            <option value="" className="text-slate-900">
              Move to…
            </option>
            {bulkTargets(selection).map((to) => (
              <option key={to} value={to} className="text-slate-900">
                {to === 'Cancelled' ? 'Cancel orders' : to}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => setPicked(new Set())} className="rounded-lg px-2.5 py-1.5 text-sm font-semibold text-white/80 hover:bg-white/10">
            Clear
          </button>
        </div>
      )}

      {visible.length > 0 ? (
        <>
          <label className="flex items-center gap-2 px-1 text-xs font-semibold text-slate-500">
            <input
              type="checkbox"
              checked={allShownPicked}
              onChange={() => setPicked(allShownPicked ? new Set() : new Set(visible.map((order) => order.id)))}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600"
            />
            Select all shown ({visible.length})
          </label>
          <div className="space-y-3">
            {visible.map((order) => (
              <OrderRow
                key={order.id}
                order={order.id === focusOrderId ? { ...order, focus: true } : order}
                open={open.has(order.id)}
                onToggle={() => toggle(open, setOpen, order.id)}
                checked={picked.has(order.id)}
                onCheck={() => toggle(picked, setPicked, order.id)}
                now={now}
                busy={busy}
                onMove={request}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
          <p className="font-bold text-slate-500">{orders.length === 0 ? 'No orders for this seller yet.' : 'No orders match.'}</p>
          <p className="mt-1 text-sm text-slate-400">{orders.length === 0 ? 'Use Give Order to assign them one.' : 'Try another status or search.'}</p>
        </div>
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm.targets.length === 1 ? 'Cancel this order?' : `Cancel ${confirm.targets.length} orders?`}
          message="A cancelled order cannot be started again. The seller is told it was cancelled."
          confirmLabel={confirm.targets.length === 1 ? 'Cancel order' : `Cancel ${confirm.targets.length} orders`}
          busy={busy}
          onCancel={() => setConfirm(null)}
          onConfirm={() => run(confirm.targets, 'Cancelled')}
        />
      )}
    </div>
  )
}

export default OrdersPanel
