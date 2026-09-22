import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { safeRedirect } from '../../data/redirect'
import { useAuth } from '../../context/AuthContext'

const CustomerLogin = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = safeRedirect(searchParams.get('redirect'))
  const otherLink = redirect === '/' ? '/signup' : `/signup?redirect=${encodeURIComponent(redirect)}`
  const { signInCustomer, sendPasswordReset } = useAuth()
  const [form, setForm] = useState({
    email: '',
    password: '',
    remember: true,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
      ),
      title: 'Free Shipping',
      desc: 'On orders over $50',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: 'Secure Payments',
      desc: '256-bit SSL',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
        </svg>
      ),
      title: 'Easy Returns',
      desc: '30-day guarantee',
    },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setSubmitting(true)
    const result = await signInCustomer({ email: form.email, password: form.password, remember: form.remember })
    setSubmitting(false)
    if (result.success) navigate(redirect, { replace: true })
    else setError(result.error)
  }

  const handleForgotPassword = async () => {
    setError('')
    setNotice('')
    const result = await sendPasswordReset('customer', form.email)
    if (result.success) setNotice(`If an account exists for ${form.email.trim()}, a password reset link is on its way.`)
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

          <h1 className="text-5xl xl:text-7xl font-bold leading-[1.05] tracking-tight mb-8">
            Shop Smarter.
            <br />
            <span className="bg-gradient-to-r from-fuchsia-300 via-purple-200 to-indigo-200 bg-clip-text text-transparent">
              Live Better.
            </span>
          </h1>

          <p className="text-lg text-purple-100/90 max-w-lg mx-auto leading-relaxed mb-12">
            Sign in to continue shopping curated products, track your orders, and manage your wishlist — all in one place.
          </p>

          <div className="grid grid-cols-3 gap-4">
            {features.map((f, i) => (
              <div
                key={i}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 lg:p-6 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-3 text-purple-200">
                  {f.icon}
                </div>
                <p className="font-semibold text-white mb-1">{f.title}</p>
                <p className="text-xs text-purple-200/80">{f.desc}</p>
              </div>
            ))}
          </div>
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
              Welcome Back <span className="inline-block animate-pulse">👋</span>
            </h1>
            <p className="text-gray-500 mb-8 text-lg">Sign in to your account</p>

            {error && (
              <div role="alert" className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-sm font-medium text-rose-700">
                {error}
              </div>
            )}
            {notice && (
              <div role="status" className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-sm font-medium text-emerald-700">
                {notice}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3.5 bg-white border-2 border-gray-100 rounded-2xl text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:border-[#4c1d95] focus:ring-4 focus:ring-purple-500/10"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-900">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder=""
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
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm font-medium text-gray-700 hover:text-[#4c1d95] transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              <label className="flex items-center space-x-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.remember}
                  onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                  className="w-5 h-5 rounded-lg border-gray-300 text-[#4c1d95] focus:ring-[#4c1d95] focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-700">
                  Remember me for 30 days
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-2xl shadow-lg shadow-slate-900/20 transition-all duration-200 hover:shadow-xl hover:shadow-slate-900/30 text-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <div className="mt-10 space-y-3 text-center text-sm">
              <p className="text-gray-500">
                Don't have an account?{' '}
                <Link
                  to={otherLink}
                  className="font-semibold text-slate-900 hover:text-[#4c1d95] transition-colors"
                >
                  Create one
                </Link>
              </p>
              <p className="text-gray-500">
                Are you a seller?{' '}
                <Link
                  to="/seller/login"
                  className="font-semibold text-slate-700 hover:text-[#4c1d95] underline underline-offset-2 transition-colors"
                >
                  Seller login
                </Link>
              </p>
            </div>

            <p className="mt-8 text-center text-xs text-gray-400">
              By signing in, you agree to our{' '}
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

export default CustomerLogin
