import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ASSETS } from '../data/data'
import { useCart } from '../context/CartContext'

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const { itemCount, openCart } = useCart()
  const navigate = useNavigate()

  const onSearch = (e) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (q) navigate(`/shop?q=${encodeURIComponent(q)}`)
    else navigate('/shop')
  }

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-4 lg:space-x-10">
            <Link to="/" className="flex items-center space-x-2 shrink-0">
              <img
                src={`${ASSETS}/logo-us.png`}
                alt="U Seller Store"
                className="h-10 w-10 object-contain"
              />
              <span className="text-xl font-bold text-[#0a3d62]">
                U Seller Store
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/"
                className="text-[#0a3d62] font-semibold hover:text-[#0f4c81] transition-colors"
              >
                Home
              </Link>
              <Link
                to="/shop"
                className="text-gray-900 font-semibold hover:text-[#0a3d62] transition-colors"
              >
                Shop
              </Link>
              <a
                href="#categories"
                className="text-gray-900 font-semibold hover:text-[#0a3d62] transition-colors"
              >
                Categories
              </a>
            </div>
          </div>

          <div className="flex-1 max-w-xl mx-4 lg:mx-8 hidden sm:block">
            <form onSubmit={onSearch} className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-full text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0a3d62]/20 focus:border-[#0a3d62]/30 transition-all"
              />
            </form>
          </div>

          <div className="flex items-center space-x-3 lg:space-x-4">
            <button
              onClick={openCart}
              className="relative p-2 text-gray-700 hover:text-[#0a3d62] hover:bg-gray-50 rounded-full transition-colors"
              aria-label={`Cart (${itemCount} items)`}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#0a3d62] text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </button>

            <div className="hidden sm:block h-8 w-px bg-gray-200 mx-1" />

            <Link
              to="/login"
              className="hidden md:block px-4 py-2 font-semibold text-gray-900 hover:text-[#0a3d62] transition-colors"
            >
              Log in
            </Link>

            <Link
              to="/signup"
              className="flex items-center space-x-2 px-5 py-2.5 bg-[#0a3d62] text-white font-semibold rounded-full hover:bg-[#0f4c81] transition-colors shadow-sm"
            >
              <span>Sign up</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </Link>
          </div>
        </div>

        <div className="sm:hidden pb-3">
          <form onSubmit={onSearch} className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-full text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0a3d62]/20 focus:border-[#0a3d62]/30 transition-all"
            />
          </form>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
