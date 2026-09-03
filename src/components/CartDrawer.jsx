import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

const CartIconEmpty = () => (
  <svg className="w-20 h-20 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M16 6a4 4 0 00-8 0m8 0V5a4 4 0 10-8 0v1m8 0H4l1.4 12.057a2 2 0 002 1.73h9.2a2 2 0 002-1.73L20 6H16z"
    />
  </svg>
)

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const TrashIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
)

const CartDrawer = () => {
  const navigate = useNavigate()
  const { isOpen, closeCart, items, itemCount, subtotal, removeItem, decrementQty, incrementQty } =
    useCart()
  const { isCustomerLoggedIn } = useAuth()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const onCheckout = () => {
    if (!isCustomerLoggedIn) {
      closeCart()
      navigate('/login')
    }
  }

  const onBrowseProducts = () => {
    closeCart()
    navigate('/shop')
  }

  return (
    <>
      <div
        onClick={closeCart}
        className={`fixed inset-0 bg-black/40 z-[60] transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!isOpen}
      />

      <aside
        className={`fixed top-0 right-0 z-[70] h-full w-full max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!isOpen}
        role="dialog"
        aria-label="Cart drawer"
      >
        <header className="flex items-center justify-between px-5 sm:px-7 py-5 border-b border-gray-100">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Your Cart{' '}
            <span className="text-gray-400 font-semibold">({itemCount})</span>
          </h2>
          <button
            onClick={closeCart}
            type="button"
            aria-label="Close cart"
            className="w-9 h-9 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors border border-gray-200"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 sm:px-7">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-20">
              <div className="mb-6">
                <CartIconEmpty />
              </div>
              <p className="text-lg text-gray-500 font-semibold mb-5">Your cart is empty</p>
              <button
                type="button"
                onClick={onBrowseProducts}
                className="px-7 py-3.5 bg-[#0a3d62] hover:bg-[#0f4c81] text-white font-semibold rounded-xl shadow-sm transition-colors"
              >
                Browse Products
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 py-4 space-y-4">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start space-x-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-[15px] font-semibold text-gray-900 line-clamp-2 leading-snug mb-1.5">
                      {item.name}
                    </p>
                    <p className="text-sm font-bold text-gray-900 mb-2.5">
                      ${(Number(item.price) || 0).toFixed(2)}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => decrementQty(item.id)}
                          disabled={item.qty <= 1}
                          className="w-8 h-8 flex items-center justify-center text-lg font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-semibold text-gray-900 select-none">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => incrementQty(item.id)}
                          className="w-8 h-8 flex items-center justify-center text-lg font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        aria-label="Remove item"
                        className="text-gray-400 hover:text-rose-500 transition-colors p-1.5 rounded-lg hover:bg-rose-50"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <footer className="border-t border-gray-100 px-5 sm:px-7 py-5 space-y-3 bg-white">
            <div className="flex items-center justify-between text-gray-700">
              <span className="text-base font-semibold">Subtotal</span>
              <span className="text-lg font-bold text-gray-900">${subtotal.toFixed(2)}</span>
            </div>

            <button
              type="button"
              onClick={onCheckout}
              className="w-full py-3.5 bg-[#0a3d62] hover:bg-[#0f4c81] text-white font-semibold rounded-xl shadow-sm transition-colors"
            >
              {isCustomerLoggedIn ? 'Checkout' : 'Login to Checkout'}
            </button>

            <button
              type="button"
              onClick={onBrowseProducts}
              className="w-full py-3.5 bg-white border border-gray-200 text-gray-900 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              View Full Cart
            </button>
          </footer>
        )}
      </aside>
    </>
  )
}

export default CartDrawer
