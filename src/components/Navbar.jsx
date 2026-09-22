import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { ASSETS } from '../data/data'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useAuth } from '../context/AuthContext'

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/shop', label: 'Shop' },
  { to: '/categories', label: 'Categories' },
]

const Icon = ({ d, className = 'w-6 h-6', strokeWidth = 2 }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d={d} />
  </svg>
)

const ICONS = {
  menu: 'M4 6h16M4 12h16M4 18h16',
  close: 'M6 18L18 6M6 6l12 12',
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  cart: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
  heart: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  arrow: 'M14 5l7 7m0 0l-7 7m7-7H3',
}

const initialsOf = (name = '', email = '') => {
  const source = (name || email || '?').trim()
  const parts = source.split(/[\s@._-]+/).filter(Boolean)
  return (parts.slice(0, 2).map((p) => p[0]).join('') || '?').toUpperCase()
}

const Badge = ({ count }) =>
  count > 0 ? (
    <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 bg-[#0a3d62] text-white text-[11px] font-bold rounded-full flex items-center justify-center">
      {count > 99 ? '99+' : count}
    </span>
  ) : null

const SearchForm = ({ value, onChange, onSubmit, className = '', inputClassName = '', autoFocus = false }) => (
  <form onSubmit={onSubmit} role="search" className={`relative ${className}`}>
    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
      <Icon d={ICONS.search} className="w-5 h-5" />
    </span>
    <input
      type="search"
      inputMode="search"
      enterKeyHint="search"
      autoFocus={autoFocus}
      placeholder="Search products..."
      aria-label="Search products"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full pl-12 pr-4 bg-gray-50 border border-gray-100 rounded-full text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0a3d62]/20 focus:border-[#0a3d62]/30 transition-all ${inputClassName}`}
    />
  </form>
)

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef(null)
  const { itemCount, openCart } = useCart()
  const { count: wishlistCount } = useWishlist()
  const { customer, isCustomerLoggedIn, logoutCustomer } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Keep the search box in step with the shop's ?q= when the user arrives from a link.
  useEffect(() => {
    if (location.pathname === '/shop') setSearchQuery(new URLSearchParams(location.search).get('q') || '')
  }, [location.pathname, location.search])

  // Close menus whenever the page changes.
  useEffect(() => {
    setMenuOpen(false)
    setAccountOpen(false)
  }, [location.pathname, location.search])

  // Lock page scroll behind the mobile menu; Escape closes menus.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        setAccountOpen(false)
      }
    }
    const onClick = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false)
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [])

  const onSearch = (e) => {
    e.preventDefault()
    const q = searchQuery.trim()
    setMenuOpen(false)
    navigate(q ? `/shop?q=${encodeURIComponent(q)}` : '/shop')
  }

  const onLogout = () => {
    setAccountOpen(false)
    setMenuOpen(false)
    logoutCustomer()
    navigate('/')
  }

  const desktopLink = ({ isActive }) =>
    `font-semibold transition-colors ${isActive ? 'text-[#0a3d62]' : 'text-gray-900 hover:text-[#0a3d62]'}`

  const mobileLink = ({ isActive }) =>
    `flex items-center justify-between rounded-xl px-4 py-3 font-semibold transition-colors ${
      isActive ? 'bg-[#0a3d62]/5 text-[#0a3d62]' : 'text-gray-800 hover:bg-gray-50'
    }`

  const displayName = customer?.fullName || customer?.email || 'Account'

  return (
    <header className="sticky top-0 z-50 bg-white/95 border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
          <div className="flex items-center gap-1 sm:gap-3 lg:gap-10 min-w-0">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="lg:hidden shrink-0 p-2 -ml-1 text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Open menu"
              aria-expanded={menuOpen}
            >
              <Icon d={ICONS.menu} />
            </button>

            <Link to="/" className="flex items-center gap-2 min-w-0" aria-label="U Seller Store home">
              <img src={`${ASSETS}/logo-us.png`} alt="" className="h-9 w-9 sm:h-10 sm:w-10 object-contain shrink-0" />
              <span className="text-base sm:text-xl font-bold text-[#0a3d62] truncate">U Seller Store</span>
            </Link>

            <nav className="hidden lg:flex items-center gap-8" aria-label="Main">
              {NAV_LINKS.map((link) => (
                <NavLink key={link.to} to={link.to} end={link.end} className={desktopLink}>
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <SearchForm
            value={searchQuery}
            onChange={setSearchQuery}
            onSubmit={onSearch}
            className="flex-1 max-w-xl hidden md:block"
            inputClassName="py-3"
          />

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <Link
              to="/wishlist"
              className="relative p-2 text-gray-700 hover:text-[#0a3d62] hover:bg-gray-50 rounded-full transition-colors"
              aria-label={`Wishlist (${wishlistCount} items)`}
            >
              <Icon d={ICONS.heart} />
              <Badge count={wishlistCount} />
            </Link>

            <button
              type="button"
              onClick={openCart}
              className="relative p-2 text-gray-700 hover:text-[#0a3d62] hover:bg-gray-50 rounded-full transition-colors"
              aria-label={`Cart (${itemCount} items)`}
            >
              <Icon d={ICONS.cart} />
              <Badge count={itemCount} />
            </button>

            <div className="hidden sm:block h-8 w-px bg-gray-200 mx-1" />

            {isCustomerLoggedIn ? (
              <div className="relative hidden sm:block" ref={accountRef}>
                <button
                  type="button"
                  onClick={() => setAccountOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-gray-50 transition-colors"
                  aria-haspopup="menu"
                  aria-expanded={accountOpen}
                >
                  <span className="w-9 h-9 rounded-full bg-[#0a3d62] text-white text-sm font-bold flex items-center justify-center">
                    {initialsOf(customer?.fullName, customer?.email)}
                  </span>
                  <span className="hidden xl:block max-w-[9rem] truncate text-sm font-semibold text-gray-900">{displayName}</span>
                </button>
                {accountOpen && (
                  <div role="menu" className="absolute right-0 mt-2 w-56 rounded-2xl border border-gray-100 bg-white shadow-xl py-2 animate-toast-in">
                    <div className="px-4 py-2 border-b border-gray-100 mb-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                      {customer?.email && <p className="text-xs text-gray-500 truncate">{customer.email}</p>}
                    </div>
                    <Link role="menuitem" to="/profile" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">My profile</Link>
                    <Link role="menuitem" to="/orders" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">My orders</Link>
                    <Link role="menuitem" to="/wishlist" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">Wishlist</Link>
                    <button role="menuitem" type="button" onClick={onLogout} className="w-full text-left px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50">
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden lg:block px-3 py-2 font-semibold text-gray-900 hover:text-[#0a3d62] transition-colors whitespace-nowrap"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="hidden sm:inline-flex items-center gap-2 px-4 lg:px-5 py-2.5 bg-[#0a3d62] text-white font-semibold rounded-full hover:bg-[#0f4c81] transition-colors shadow-sm whitespace-nowrap"
                >
                  <span>Sign up</span>
                  <Icon d={ICONS.arrow} className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="md:hidden pb-3">
          <SearchForm value={searchQuery} onChange={setSearchQuery} onSubmit={onSearch} inputClassName="py-2.5" />
        </div>
      </div>

      {/* Mobile / tablet menu */}
      <div
        className={`lg:hidden fixed inset-0 z-[80] ${menuOpen ? '' : 'pointer-events-none'}`}
        aria-hidden={!menuOpen}
      >
        <div
          onClick={() => setMenuOpen(false)}
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${menuOpen ? 'opacity-100' : 'opacity-0'}`}
        />
        <aside
          role="dialog"
          aria-label="Menu"
          className={`absolute left-0 top-0 h-full w-[86%] max-w-sm bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
            menuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between px-4 h-16 border-b border-gray-100 shrink-0">
            <Link to="/" className="flex items-center gap-2">
              <img src={`${ASSETS}/logo-us.png`} alt="" className="h-9 w-9 object-contain" />
              <span className="text-lg font-bold text-[#0a3d62]">U Seller Store</span>
            </Link>
            <button type="button" onClick={() => setMenuOpen(false)} className="p-2 rounded-full hover:bg-gray-100" aria-label="Close menu">
              <Icon d={ICONS.close} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
            <SearchForm value={searchQuery} onChange={setSearchQuery} onSubmit={onSearch} inputClassName="py-2.5" />

            <nav className="space-y-1" aria-label="Menu">
              {NAV_LINKS.map((link) => (
                <NavLink key={link.to} to={link.to} end={link.end} className={mobileLink}>
                  {link.label}
                </NavLink>
              ))}
              <NavLink to="/wishlist" className={mobileLink}>
                <span>Wishlist</span>
                {wishlistCount > 0 && <span className="text-xs font-bold bg-[#0a3d62] text-white rounded-full px-2 py-0.5">{wishlistCount}</span>}
              </NavLink>
              <button
                type="button"
                onClick={() => { setMenuOpen(false); openCart() }}
                className="w-full flex items-center justify-between rounded-xl px-4 py-3 font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
              >
                <span>Cart</span>
                {itemCount > 0 && <span className="text-xs font-bold bg-[#0a3d62] text-white rounded-full px-2 py-0.5">{itemCount}</span>}
              </button>
              {isCustomerLoggedIn && (
                <>
                  <NavLink to="/orders" className={mobileLink}>My orders</NavLink>
                  <NavLink to="/profile" className={mobileLink}>My profile</NavLink>
                </>
              )}
            </nav>

            <div className="border-t border-gray-100 pt-5 space-y-3">
              {isCustomerLoggedIn ? (
                <>
                  <p className="px-1 text-sm text-gray-500 truncate">Signed in as <span className="font-semibold text-gray-900">{displayName}</span></p>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="w-full py-3 rounded-xl border border-rose-200 text-rose-600 font-semibold hover:bg-rose-50 transition-colors"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link to="/login" className="py-3 text-center rounded-xl border border-gray-200 font-semibold text-gray-900 hover:bg-gray-50 transition-colors">
                    Log in
                  </Link>
                  <Link to="/signup" className="py-3 text-center rounded-xl bg-[#0a3d62] text-white font-semibold hover:bg-[#0f4c81] transition-colors">
                    Sign up
                  </Link>
                </div>
              )}
              <Link to="/seller/signup" className="block text-center text-sm font-semibold text-[#0a3d62] hover:underline">
                Become a seller
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </header>
  )
}

export default Navbar
