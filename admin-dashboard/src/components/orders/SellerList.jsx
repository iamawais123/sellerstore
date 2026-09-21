import { isOnline } from '../../lib/supportChat'
import { orderCounts } from '../../lib/orders'
import { Icon } from './icons'
import { ShopAvatar, useCopy } from './ui'

const Chip = ({ label, value, tone }) => {
  const tones = {
    total: 'bg-slate-50 text-slate-600 ring-slate-200',
    pending: 'bg-amber-50 text-amber-700 ring-amber-200',
    delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    scheduled: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  }
  const dots = { total: 'bg-slate-400', pending: 'bg-amber-500', delivered: 'bg-emerald-500', scheduled: 'bg-indigo-500' }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${tones[tone]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dots[tone]}`} />
      {label} {value}
    </span>
  )
}

// One card per verified seller with their live order counts; picking one shows their orders.
const SellerList = ({ sellers, selectedId, onSelect, ordersOf, scheduledOf, now, emptyText }) => {
  const [copied, copy] = useCopy()

  if (!sellers.length) return <p className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center text-sm font-semibold text-slate-400">{emptyText}</p>

  return (
    <ul className="space-y-3">
      {sellers.map((seller) => {
        const counts = orderCounts(ordersOf(seller.id))
        const scheduled = scheduledOf(seller.id)
        const selected = selectedId === seller.id
        return (
          <li key={seller.id}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => onSelect(seller.id)}
              onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && (event.preventDefault(), onSelect(seller.id))}
              aria-pressed={selected}
              className={`w-full cursor-pointer rounded-2xl border bg-white p-3.5 text-left shadow-sm transition ${selected ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-100 hover:border-slate-200 hover:shadow'}`}
            >
              <div className="flex items-center gap-3">
                <ShopAvatar name={seller.shopName} online={isOnline(seller, now)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-black text-slate-900">{seller.shopName}</p>
                  <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <span className="truncate">{seller.ownerName || seller.fullName}</span>
                    {seller.email && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          copy(seller.email, seller.id)
                        }}
                        aria-label={`Copy ${seller.email}`}
                        title={copied === seller.id ? 'Copied' : `Copy ${seller.email}`}
                        className="shrink-0 rounded p-0.5 text-slate-400 hover:text-indigo-600"
                      >
                        <Icon name={copied === seller.id ? 'check' : 'copy'} className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <Chip label="Total" value={counts.total} tone="total" />
                <Chip label="Pending" value={counts.pending} tone="pending" />
                <Chip label="Delivered" value={counts.delivered} tone="delivered" />
                {scheduled > 0 && <Chip label="Scheduled" value={scheduled} tone="scheduled" />}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export default SellerList
