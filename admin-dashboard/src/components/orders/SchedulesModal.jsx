import { useMemo, useState } from 'react'
import { decodeEntities } from '../../lib/activityFeed'
import { countdown, filterSchedules, fromLocalInput, quickTimes, splitSchedules, toLocalInput, whenLabel } from '../../lib/schedules'
import { Icon } from './icons'
import { ConfirmDialog, Modal, money } from './ui'

const HISTORY_FILTERS = ['All', 'Created', 'Cancelled', 'Failed']

const RESULT_STYLE = {
  Created: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Cancelled: 'bg-slate-100 text-slate-500 ring-slate-200',
  Failed: 'bg-rose-50 text-rose-700 ring-rose-200',
}

const closedAt = (iso) => {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : `${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}, ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}`
}

const Detail = ({ schedule }) => {
  const customer = schedule.customer || {}
  const address = [customer.address1, customer.address2, customer.city, customer.state, customer.postalCode, customer.country].filter(Boolean).join(', ')
  return (
    <div className="space-y-3 border-t border-slate-100 pt-3">
      <div className="grid gap-3 text-sm sm:grid-cols-3">
        {[
          ['Customer', customer.fullName],
          ['Phone', customer.phone],
          ['Address', address],
        ].map(([label, value]) => (
          <div key={label} className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
            <p className="mt-0.5 break-words font-semibold text-slate-800">{value || '—'}</p>
          </div>
        ))}
      </div>
      <ul className="space-y-1.5">
        {(schedule.items || []).map((item) => (
          <li key={item.id || item.catalogId} className="flex items-center gap-3 rounded-xl bg-slate-50 p-2">
            <img src={item.image} alt="" className="h-10 w-10 shrink-0 rounded-lg bg-white object-cover" />
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">{decodeEntities(item.name)}</span>
            <span className="shrink-0 text-xs font-semibold text-slate-500">×{item.qty}</span>
            <span className="shrink-0 text-sm font-black text-slate-900">{money(item.sell * item.qty)}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-slate-400">
        Seller pays {money(schedule.cost)} · seller profit {money(schedule.profit)} · planned {closedAt(schedule.createdAt)}
      </p>
    </div>
  )
}

const Summary = ({ schedule }) => (
  <>
    <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
      <span className="font-black text-slate-900">{schedule.customer?.fullName || 'Customer'}</span>
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">
        {schedule.items?.length || 0} item{schedule.items?.length === 1 ? '' : 's'}
      </span>
    </p>
    <p className="mt-0.5 text-xs font-medium text-slate-500">
      for <span className="font-bold text-slate-700">{schedule.shopName || schedule.sellerName}</span> · {money(schedule.total)} · profit {money(schedule.profit)}
    </p>
  </>
)

const UpcomingCard = ({ schedule, now, busy, expanded, onExpand, onRunNow, onAskCancel, onReschedule }) => {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const { text, due } = countdown(schedule.scheduledFor, now)
  const date = new Date(schedule.scheduledFor)

  const startEdit = () => {
    setValue(toLocalInput(schedule.scheduledFor))
    setError('')
    setEditing(true)
  }
  const save = async () => {
    const iso = fromLocalInput(value)
    if (!iso || Date.parse(iso) <= Date.now()) return setError('Pick a time in the future.')
    const result = await onReschedule(schedule.id, iso)
    if (result.success) setEditing(false)
    else setError(result.error || 'Could not reschedule.')
  }

  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-indigo-50 text-indigo-700" aria-hidden>
          <span className="text-[10px] font-bold uppercase leading-none">{date.toLocaleDateString('en-GB', { month: 'short' })}</span>
          <span className="text-xl font-black leading-tight">{date.getDate()}</span>
        </div>
        <div className="min-w-0 flex-1">
          <Summary schedule={schedule} />
          <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Icon name="clock" className="h-3.5 w-3.5" />
              {whenLabel(schedule.scheduledFor, now)}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${due ? 'bg-amber-100 text-amber-700' : 'bg-indigo-50 text-indigo-700'}`}>{due ? 'Due now — creating…' : text}</span>
          </p>
        </div>
      </div>

      {editing && (
        <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3">
          <input type="datetime-local" value={value} onChange={(event) => setValue(event.target.value)} aria-label="New date and time" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium" />
          <div className="flex flex-wrap gap-1.5">
            {quickTimes(now).map((choice) => (
              <button key={choice.label} type="button" onClick={() => setValue(choice.value)} className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100">
                {choice.label}
              </button>
            ))}
          </div>
          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={save} disabled={busy} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50">
              Save new time
            </button>
            <button type="button" onClick={() => setEditing(false)} className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-200">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={onExpand} aria-expanded={expanded} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100">
          Details
          <Icon name="chevronDown" className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
        <button type="button" onClick={startEdit} disabled={busy || editing} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40">
          <Icon name="pencil" className="h-3.5 w-3.5" />
          Reschedule
        </button>
        <button type="button" onClick={onRunNow} disabled={busy} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 disabled:opacity-40">
          <Icon name="play" className="h-3.5 w-3.5" />
          Run now
        </button>
        <button type="button" onClick={onAskCancel} disabled={busy} className="ml-auto inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-40">
          <Icon name="x" className="h-3.5 w-3.5" />
          Cancel
        </button>
      </div>
      {expanded && (
        <div className="mt-3">
          <Detail schedule={schedule} />
        </div>
      )}
    </li>
  )
}

const HistoryCard = ({ schedule, expanded, onExpand, onViewOrder }) => (
  <li className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-start gap-3">
      <span className={`mt-0.5 shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${RESULT_STYLE[schedule.status] || RESULT_STYLE.Cancelled}`}>{schedule.status}</span>
      <div className="min-w-0 flex-1">
        <Summary schedule={schedule} />
        <p className="mt-1.5 text-xs font-medium text-slate-500">
          Was set for {whenLabel(schedule.scheduledFor)} · {schedule.status === 'Created' ? 'created' : schedule.status.toLowerCase()} {closedAt(schedule.closedAt)}
        </p>
        {schedule.status === 'Failed' && schedule.error && <p className="mt-1.5 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700">{schedule.error}</p>}
      </div>
    </div>
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <button type="button" onClick={onExpand} aria-expanded={expanded} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100">
        Details
        <Icon name="chevronDown" className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {schedule.status === 'Created' && schedule.orderId && (
        <button type="button" onClick={onViewOrder} className="ml-auto inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100">
          View order
          <Icon name="chevronRight" className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
    {expanded && (
      <div className="mt-3">
        <Detail schedule={schedule} />
      </div>
    )}
  </li>
)

// Every scheduled order: what is still to come (with its countdown, and the means to change, run or cancel it)
// and what has already happened to the rest.
const SchedulesModal = ({ schedules, now, onClose, onCancel, onReschedule, onRunNow, onViewOrder, notify }) => {
  const [tab, setTab] = useState('upcoming')
  const [term, setTerm] = useState('')
  const [historyStatus, setHistoryStatus] = useState('All')
  const [expanded, setExpanded] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [busyId, setBusyId] = useState('')

  const { upcoming, history } = useMemo(() => splitSchedules(schedules), [schedules])
  const shownUpcoming = filterSchedules(upcoming, { term })
  const shownHistory = filterSchedules(history, { term, status: historyStatus })

  const act = async (id, task, success) => {
    setBusyId(id)
    const result = await task()
    setBusyId('')
    if (result.success) success && notify(success(result))
    else notify(result.error || 'That did not work. Please try again.', 'error')
    return result
  }

  const tabClass = (id) => `flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition ${tab === id ? 'bg-white text-slate-900 shadow ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`

  return (
    <Modal title="Scheduled orders" subtitle="Orders that will be created automatically at the time you chose." icon="calendarClock" wide onClose={() => !confirm && onClose()}>
      <div className="space-y-4 p-5">
        <div className="flex rounded-2xl bg-slate-100 p-1" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'upcoming'} onClick={() => setTab('upcoming')} className={tabClass('upcoming')}>
            <Icon name="calendar" className="h-4 w-4" />
            Upcoming
            <span className={`rounded-full px-1.5 py-0.5 text-[11px] leading-none ${upcoming.length ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>{upcoming.length}</span>
          </button>
          <button type="button" role="tab" aria-selected={tab === 'history'} onClick={() => setTab('history')} className={tabClass('history')}>
            <Icon name="history" className="h-4 w-4" />
            History
            <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[11px] leading-none text-slate-600">{history.length}</span>
          </button>
        </div>

        {(upcoming.length > 0 || history.length > 0) && (
          <div className="relative">
            <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Search customer, seller or product..." aria-label="Search schedules" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10" />
          </div>
        )}

        {tab === 'upcoming' ? (
          <>
            {upcoming.length > 0 && (
              <p className="flex items-start gap-2 rounded-xl bg-indigo-50 px-3.5 py-2.5 text-xs font-medium text-indigo-800">
                <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
                Orders are created while the admin console is open. One that falls due while it is closed is created the next time you open it.
              </p>
            )}
            {shownUpcoming.length > 0 ? (
              <ul className="space-y-3">
                {shownUpcoming.map((schedule) => (
                  <UpcomingCard
                    key={schedule.id}
                    schedule={schedule}
                    now={now}
                    busy={busyId === schedule.id}
                    expanded={expanded === schedule.id}
                    onExpand={() => setExpanded(expanded === schedule.id ? null : schedule.id)}
                    onRunNow={() => act(schedule.id, () => onRunNow(schedule.id), () => `Order created for ${schedule.customer?.fullName || 'the customer'}.`)}
                    onAskCancel={() => setConfirm(schedule)}
                    onReschedule={(id, iso) => act(id, () => onReschedule(id, iso), () => `Rescheduled to ${whenLabel(iso)}.`)}
                  />
                ))}
              </ul>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Icon name="calendarClock" className="h-6 w-6" />
                </span>
                <p className="mt-3 font-bold text-slate-600">{term.trim() && upcoming.length ? 'No upcoming orders match.' : 'No upcoming scheduled orders'}</p>
                {!upcoming.length && <p className="mt-1 text-sm text-slate-400">Choose "Scheduled" in the last step of Give Order to plan one.</p>}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter history">
              {HISTORY_FILTERS.map((status) => (
                <button key={status} type="button" onClick={() => setHistoryStatus(status)} aria-pressed={historyStatus === status} className={`rounded-full px-3 py-1.5 text-xs font-bold ${historyStatus === status ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {status}
                  <span className={`ml-1.5 ${historyStatus === status ? 'text-slate-300' : 'text-slate-400'}`}>{status === 'All' ? history.length : history.filter((item) => item.status === status).length}</span>
                </button>
              ))}
            </div>
            {shownHistory.length > 0 ? (
              <ul className="space-y-3">
                {shownHistory.map((schedule) => (
                  <HistoryCard key={schedule.id} schedule={schedule} expanded={expanded === schedule.id} onExpand={() => setExpanded(expanded === schedule.id ? null : schedule.id)} onViewOrder={() => onViewOrder(schedule)} />
                ))}
              </ul>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Icon name="history" className="h-6 w-6" />
                </span>
                <p className="mt-3 font-bold text-slate-600">{history.length ? 'Nothing matches.' : 'No history yet'}</p>
                {!history.length && <p className="mt-1 text-sm text-slate-400">Orders that were created, cancelled or could not be created show up here.</p>}
              </div>
            )}
          </>
        )}
      </div>

      {confirm && (
        <ConfirmDialog
          title="Cancel this scheduled order?"
          message={`The order for ${confirm.customer?.fullName || 'the customer'} (${whenLabel(confirm.scheduledFor)}) will not be created. It stays in History as cancelled.`}
          confirmLabel="Cancel scheduled order"
          busy={busyId === confirm.id}
          onCancel={() => setConfirm(null)}
          onConfirm={async () => {
            await act(confirm.id, () => onCancel(confirm.id), () => 'Scheduled order cancelled.')
            setConfirm(null)
          }}
        />
      )}
    </Modal>
  )
}

export default SchedulesModal
