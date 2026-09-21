// What the admin's Orders page makes of a seller's orders: which stage can follow which, the counts on
// the seller cards and filter pills, filtering, and how bulk moves are worked out.
// Pure logic (no Firebase, no React): runs without the emulator.

// The stages after payment, in the order an order moves through them.
export const STAGES = ['Paid', 'Pickup', 'On the way', 'Out for delivery', 'Delivered']
export const FILTERS = ['All', 'Unpaid', ...STAGES, 'Cancelled']

export const isClosed = (order) => order.status === 'Delivered' || order.status === 'Cancelled'

// An order the seller has not paid for yet cannot be moved along (the seller pays first); it can only be cancelled.
export const nextStages = (order) => (order.status === 'Unpaid' || isClosed(order) ? [] : STAGES.slice(STAGES.indexOf(order.status) + 1))

export const canMoveTo = (order, status) => (status === 'Cancelled' ? !isClosed(order) : nextStages(order).includes(status))

// TOTAL / PENDING / DELIVERED on a seller card (cancelled orders count towards the total only).
export function orderCounts(orders = []) {
  return {
    total: orders.length,
    pending: orders.filter((order) => !isClosed(order)).length,
    delivered: orders.filter((order) => order.status === 'Delivered').length,
    cancelled: orders.filter((order) => order.status === 'Cancelled').length,
  }
}

// How many orders each filter pill would show ("All" leaves out the cancelled ones unless they are shown).
export function statusCounts(orders = [], showCancelled = false) {
  const counts = Object.fromEntries(FILTERS.map((filter) => [filter, 0]))
  orders.forEach((order) => {
    counts[order.status] = (counts[order.status] || 0) + 1
    if (showCancelled || order.status !== 'Cancelled') counts.All += 1
  })
  return counts
}

const haystack = (order) =>
  [order.customer?.fullName, order.customer?.phone, order.customer?.city, order.status, order.id, ...(order.items || []).map((item) => item.name)].join(' ').toLowerCase()

// Orders to list: cancelled ones stay hidden until asked for (or picked as the status filter).
export function filterOrders(orders = [], { status = 'All', term = '', showCancelled = false } = {}) {
  const needle = term.trim().toLowerCase()
  return orders.filter((order) => {
    if (status === 'All' ? !showCancelled && order.status === 'Cancelled' : order.status !== status) return false
    return !needle || haystack(order).includes(needle)
  })
}

// "0m", "12m", "3h", "2d": how long ago the order was given.
export function orderAge(iso, now = Date.now()) {
  const at = Date.parse(iso)
  if (Number.isNaN(at)) return ''
  const minutes = Math.max(0, Math.floor((now - at) / 60000))
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  return hours < 24 ? `${hours}h` : `${Math.floor(hours / 24)}d`
}

// Which of the selected orders can be moved to `status`, and which cannot (they are left as they are).
export function planBulkMove(orders, status) {
  const move = orders.filter((order) => canMoveTo(order, status))
  return { move, skip: orders.filter((order) => !move.includes(order)) }
}

// The moves offered for a selection: only those that at least one selected order can make.
export function bulkTargets(orders) {
  return [...STAGES, 'Cancelled'].filter((status) => orders.some((order) => canMoveTo(order, status)))
}
