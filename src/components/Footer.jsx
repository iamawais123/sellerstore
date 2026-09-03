import { Link } from 'react-router-dom'
import { ASSETS } from '../data/data'

const Footer = () => {
  return (
    <footer className="bg-[#0a1628] text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <img
                src={`${ASSETS}/logo-us.png`}
                alt="U Seller Store"
                className="h-10 w-10 object-contain"
              />
              <div>
                <span className="text-xl font-bold text-white">
                  U Seller{' '}
                  <span className="text-sky-400">Store</span>
                </span>
                <p className="text-xs text-gray-400 tracking-widest uppercase mt-0.5">
                  Shop Smarter · Live Better
                </p>
              </div>
            </div>
            <p className="text-gray-400 leading-relaxed max-w-sm mb-6">
              Discover premium products at unbeatable prices. Trusted by
              thousands worldwide.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase tracking-wider text-sm mb-5">
              Shop
            </h4>
            <ul className="space-y-3">
              {['All Products', 'Categories', 'Wishlist', 'My Orders', 'Cart'].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white hover:underline transition-colors text-sm"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase tracking-wider text-sm mb-5">
              Account
            </h4>
            <ul className="space-y-3">
              {[
                { label: 'Login', to: '/login' },
                { label: 'Register', to: '/signup' },
                { label: 'Profile', to: '#' },
                { label: 'Track Order', to: '#' },
              ].map((item) => (
                <li key={item.label}>
                  {item.to === '#' ? (
                    <a
                      href="#"
                      className="text-gray-400 hover:text-white hover:underline transition-colors text-sm"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      to={item.to}
                      className="text-gray-400 hover:text-white hover:underline transition-colors text-sm"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-4">
              <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <h4 className="text-white font-bold uppercase tracking-wider text-sm">
                Sell with us
              </h4>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              Grow your business — reach thousands of customers.
            </p>
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
              <Link
                to="/seller/signup"
                className="inline-flex items-center justify-center space-x-2 px-5 py-3 bg-sky-500/90 hover:bg-sky-500 text-white font-semibold rounded-xl transition-colors"
              >
                <span>Become a Seller</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              <Link
                to="/seller/login"
                className="inline-flex items-center justify-center px-5 py-3 border border-white/20 hover:border-white/40 text-white font-semibold rounded-xl transition-colors"
              >
                Seller Login
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm text-gray-400">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <span>
                © 2012 U Seller Store. All rights reserved.
              </span>
              <div className="hidden md:block h-4 w-px bg-white/10" />
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                {['Privacy', 'Terms', 'Cookies'].map((item) => (
                  <a
                    key={item}
                    href="#"
                    className="hover:text-white transition-colors"
                  >
                    {item}
                  </a>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>1401 Pennsylvania Ave NW, Washington, DC 20004 US</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
