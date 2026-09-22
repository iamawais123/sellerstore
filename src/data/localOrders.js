// Customer orders placed from the storefront checkout.
//
// There is no order backend for storefront customers yet, so orders are kept in this browser's
// localStorage, per customer. Flip ORDERS_ARE_LOCAL_ONLY to false (and swap the functions below
// for real API calls) once orders are stored server-side; it also hides the notice on checkout.
export const ORDERS_ARE_LOCAL_ONLY = true

const ORDERS_KEY = 'uss_local_orders'

const readAll = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(ORDERS_KEY))
    return Array.isArray(parsed) ? parsed : []
  } catch (_) {
    return []
  }
}

const writeAll = (orders) => {
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
  } catch (_) {}
}

export const customerKey = (customer) => (customer ? String(customer.uid || customer.email || '') : '')

export const ordersFor = (customer) => {
  const key = customerKey(customer)
  if (!key) return []
  return readAll()
    .filter((order) => order.customerKey === key)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
}

const newOrderNumber = () => `USS-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`

export const placeOrder = ({ customer, items, shipping, paymentMethod }) => {
  const subtotal = items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 0), 0)
  const order = {
    id: newOrderNumber(),
    customerKey: customerKey(customer),
    createdAt: new Date().toISOString(),
    status: 'Processing',
    paymentMethod,
    shipping,
    items: items.map(({ id, name, image, price, qty }) => ({ id, name, image, price: Number(price) || 0, qty: Number(qty) || 1 })),
    subtotal,
    total: subtotal,
  }
  writeAll([order, ...readAll()])
  return order
}

export const cancelOrder = (orderId) => {
  const next = readAll().map((order) => (order.id === orderId && order.status === 'Processing' ? { ...order, status: 'Cancelled' } : order))
  writeAll(next)
}
