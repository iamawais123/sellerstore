import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import GiveOrderWizard from '../../components/orders/GiveOrderWizard'
import OrdersPanel from '../../components/orders/OrdersPanel'
import SchedulesModal from '../../components/orders/SchedulesModal'
import SellerList from '../../components/orders/SellerList'
import { Icon } from '../../components/orders/icons'
import { Toast } from '../../components/orders/ui'

// Re-renders every `ms`, so ages, countdowns and online dots stay current without any data arriving.
const useNow = (ms) => {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(timer)
  }, [ms])
  return now
}

const AdminOrders = () => {
  const {
    admin,
    getVerifiedSellersForAdmin,
    getSellerSlotInfo,
    getSellerShopProductsFull,
    getSellerOrders,
    createOrderForSeller,
    updateGivenOrderStatus,
    scheduledOrders,
    scheduleOrderForSeller,
    cancelScheduledOrder,
    rescheduleOrder,
    runScheduledOrderNow,
  } = useAuth()
  const [search, setSearch] = useState('')
  const [selectedSellerId, setSelectedSellerId] = useState(null)
  const [focusOrderId, setFocusOrderId] = useState(null)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [schedulesOpen, setSchedulesOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const panelRef = useRef(null)
  const now = useNow(15 * 1000)

  const verifiedSellers = getVerifiedSellersForAdmin(admin.id)
  const term = search.trim().toLowerCase()
  const shownSellers = verifiedSellers.filter((seller) => !term || `${seller.shopName} ${seller.ownerName || seller.fullName} ${seller.email}`.toLowerCase().includes(term))
  const selectedSeller = verifiedSellers.find((seller) => seller.id === selectedSellerId)

  const upcoming = useMemo(() => scheduledOrders.filter((item) => item.status === 'Scheduled'), [scheduledOrders])
  const scheduledOf = (sellerId) => upcoming.filter((item) => item.sellerId === sellerId).length

  const notify = useCallback((message, tone = 'success') => setToast({ message, tone, id: Date.now() }), [])
  const closeToast = useCallback(() => setToast(null), [])

  const selectSeller = (id) => {
    setSelectedSellerId(id)
    setFocusOrderId(null)
    // On a phone the orders open below the list: bring them into view.
    if (window.matchMedia && !window.matchMedia('(min-width: 1024px)').matches) setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const handleWizardDone = (sellerId, message, scheduled) => {
    setWizardOpen(false)
    if (!scheduled) setSelectedSellerId(sellerId)
    notify(message)
  }

  const viewOrder = (schedule) => {
    setSchedulesOpen(false)
    setWizardOpen(false)
    setSelectedSellerId(schedule.sellerId)
    setFocusOrderId(schedule.orderId)
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-l-4 border-indigo-600 pl-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Icon name="bag" className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1 basis-64">
          <h1 className="text-2xl font-black leading-tight text-slate-900">Orders</h1>
          <p className="text-sm text-slate-500">Update seller orders through pickup, delivering, and completed.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!wizardOpen && (
            <div className="relative w-full sm:w-64">
              <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search sellers..."
                aria-label="Search sellers"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>
          )}
          <button
            type="button"
            onClick={() => setSchedulesOpen(true)}
            className="relative inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            <Icon name="calendarClock" className="h-4 w-4" />
            Schedules
            {upcoming.length > 0 && (
              <span aria-label={`${upcoming.length} upcoming`} className="min-w-[1.25rem] rounded-full bg-indigo-600 px-1.5 py-0.5 text-center text-[11px] font-bold leading-none text-white">
                {upcoming.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setSchedulesOpen(false)
              setWizardOpen(true)
            }}
            disabled={wizardOpen}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 disabled:cursor-default disabled:bg-indigo-500 disabled:shadow-none"
          >
            <Icon name="plus" className="h-4 w-4" strokeWidth={2.5} />
            {wizardOpen ? 'Viewing Give Order' : 'Give Order'}
          </button>
        </div>
      </div>

      {wizardOpen ? (
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm lg:p-6">
          <GiveOrderWizard
            verifiedSellers={verifiedSellers}
            getSellerSlotInfo={getSellerSlotInfo}
            getSellerShopProductsFull={getSellerShopProductsFull}
            createOrderForSeller={createOrderForSeller}
            scheduleOrderForSeller={scheduleOrderForSeller}
            onDone={handleWizardDone}
            onExit={() => setWizardOpen(false)}
            now={now}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(300px,400px)_1fr]">
          <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-1">
            <SellerList
              sellers={shownSellers}
              selectedId={selectedSellerId}
              onSelect={selectSeller}
              ordersOf={getSellerOrders}
              scheduledOf={scheduledOf}
              now={now}
              emptyText={verifiedSellers.length ? 'No sellers match your search.' : 'No verified sellers yet. Approve a seller\'s KYC to start giving orders.'}
            />
          </div>

          <div ref={panelRef} className="scroll-mt-24 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm lg:p-6">
            {selectedSeller ? (
              <OrdersPanel
                key={`${selectedSeller.id}:${focusOrderId || ''}`}
                seller={selectedSeller}
                orders={getSellerOrders(selectedSeller.id)}
                now={now}
                focusOrderId={focusOrderId}
                notify={notify}
                moveOrder={(orderId, status) => updateGivenOrderStatus(selectedSeller.id, orderId, status)}
              />
            ) : (
              <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
                <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                  <Icon name="bag" className="h-8 w-8" strokeWidth={1.5} />
                </span>
                <p className="text-xl font-black text-slate-800">No seller selected</p>
                <p className="mt-2 max-w-sm text-slate-500">Pick a seller from the list to see their active orders and update pickup, delivering, and completion status from here.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {schedulesOpen && (
        <SchedulesModal
          schedules={scheduledOrders}
          now={now}
          onClose={() => setSchedulesOpen(false)}
          onCancel={cancelScheduledOrder}
          onReschedule={rescheduleOrder}
          onRunNow={runScheduledOrderNow}
          onViewOrder={viewOrder}
          notify={notify}
        />
      )}

      {toast && <Toast key={toast.id} message={toast.message} tone={toast.tone} onClose={closeToast} />}
    </div>
  )
}

export default AdminOrders
