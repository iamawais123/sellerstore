import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { safeRedirect } from '../../data/redirect'
import { useAuth } from '../../context/AuthContext'

const CustomerSignup = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = safeRedirect(searchParams.get('redirect'))
  const otherLink = redirect === '/' ? '/login' : `/login?redirect=${encodeURIComponent(redirect)}`
  const { signUpCustomer } = useAuth()
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const features = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
      ),
      title: 'Exclusive Deals',
      desc: 'Members-only discounts and a 10% welcome bonus.',
      highlighted: true,
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      title: 'Track Every Order',
      desc: 'Real-time delivery updates from checkout to door.',
      highlighted: false,
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      title: 'Save Your Wishlist',
      desc: 'Curate favorites and get price-drop alerts.',
      highlighted: false,
    },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.fullName.trim()) return setError('Please enter your full name.')
    if (!form.email.trim()) return setError('Please enter your email address.')
    if (form.password.length < 6) return setError('Password must be at least 6 characters.')
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.')
    setSubmitting(true)
    const result = await signUpCustomer({ fullName: form.fullName, email: form.email, password: form.password })
    setSubmitting(false)
    if (result.success) navigate(redirect, { replace: true })
    else setError(result.error)
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden bg-gradient-to-br from-[#0b0220] via-[#2a0d5f] to-[#4c1d95] flex-col justify-center items-center p-10 xl:p-16 text-white">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-purple-500/30 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center max-w-xl w-full">
          <div className="inline-flex flex-col items-center mb-12">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-2xl flex items-center justify-center mb-4">
              <svg className="w-9 h-9 text-[#4c1d95]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-2xl font-bold mb-1">E Seller Store</p>
            <p className="text-xs uppercase tracking-[0.3em] text-purple-200 font-semibold">
              Premium Marketplace
            </p>
          </div>

          <h1 className="text-5xl xl:text-6xl font-bold leading-[1.1] tracking-tight mb-8 text-left">
            Join Thousands of{' '}
            <span className="bg-gradient-to-r from-fuchsia-300 via-purple-200 to-indigo-200 bg-clip-text text-transparent">
              Happy Shoppers
            </span>
          </h1>

          <p className="text-lg text-purple-100/90 max-w-lg leading-relaxed mb-10 text-left">
            Create your free account and unlock exclusive deals, personalized recommendations, and a faster checkout.
          </p>

          <ul className="space-y-3 max-w-md">
            {features.map((f, i) => (
              <li
                key={i}
                className={`flex items-start space-x-4 p-4 rounded-2xl border transition-all duration-300 ${
                  f.highlighted
                    ? 'bg-purple-500/15 backdrop-blur-sm border-purple-400/30 ring-1 ring-purple-400/20'
                    : 'bg-white/5 backdrop-blur-sm border-white/10'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    f.highlighted ? 'bg-yellow-400/20 text-yellow-300' : 'bg-white/10 text-purple-200'
                  }`}
                >
                  {f.icon}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-white mb-0.5">{f.title}</p>
                  <p className={`text-sm ${f.highlighted ? 'text-purple-100' : 'text-purple-200/80'}`}>
                    {f.desc}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="w-full lg:w-1/2 xl:w-[45%] flex flex-col min-h-screen bg-white">
        <div className="px-6 sm:px-10 xl:px-16 py-6">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 text-sm font-medium text-gray-600 hover:text-[#4c1d95] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to home</span>
          </Link>
        </div>

        <div className="flex-1 flex items-center px-6 sm:px-10 xl:px-16 pb-12">
          <div className="w-full max-w-lg mx-auto">
            <h1 className="text-3xl xl:text-4xl font-bold text-gray-900 mb-2">
              Create Account
            </h1>
            <p className="text-gray-500 mb-8 text-lg">
              Get started in less than a minute.
            </p>

            {error && (
              <div role="alert" className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-sm font-medium text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Full name
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Jane Doe"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-100 rounded-2xl text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:border-[#4c1d95] focus:ring-4 focus:ring-purple-500/10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-100 rounded-2xl text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:border-[#4c1d95] focus:ring-4 focus:ring-purple-500/10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full pl-12 pr-12 py-3.5 bg-white border-2 border-gray-100 rounded-2xl text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:border-[#4c1d95] focus:ring-4 focus:ring-purple-500/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Confirm password
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    className="w-full pl-12 pr-12 py-3.5 bg-white border-2 border-gray-100 rounded-2xl text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:border-[#4c1d95] focus:ring-4 focus:ring-purple-500/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirm ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-2xl shadow-lg shadow-slate-900/20 transition-all duration-200 hover:shadow-xl hover:shadow-slate-900/30 text-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating account…' : 'Create Account'}
              </button>
            </form>

            <div className="mt-8 space-y-3 text-center text-sm">
              <p className="text-gray-500">
                Already have an account?{' '}
                <Link
                  to={otherLink}
                  className="font-semibold text-slate-900 hover:text-[#4c1d95] transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>

            <p className="mt-6 text-center text-xs text-gray-400">
              By creating an account, you agree to our{' '}
              <a href="#" className="text-gray-600 underline underline-offset-2 hover:text-[#4c1d95]">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-gray-600 underline underline-offset-2 hover:text-[#4c1d95]">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomerSignup
