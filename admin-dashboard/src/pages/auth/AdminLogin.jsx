import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const AdminLogin = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { loginAdmin, registerAdmin, findSuperAdminByInviteCode } = useAuth()
  const presetInvite = (searchParams.get('invite') || '').toUpperCase()
  const [mode, setMode] = useState(presetInvite ? 'register' : 'signin')
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    inviteCode: presetInvite,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const isRegister = mode === 'register'

  // Result of the last invite-code lookup, tagged with the code it belongs to so a stale answer is
  // never shown for a code that has since been edited.
  const [lookup, setLookup] = useState({ code: '', superAdmin: null })
  const trimmedCode = form.inviteCode.trim()
  const invitingSuperAdmin = isRegister && trimmedCode !== '' && lookup.code === trimmedCode ? lookup.superAdmin : null
  const codeCheckPending = isRegister && trimmedCode !== '' && lookup.code !== trimmedCode

  useEffect(() => {
    if (!isRegister || !trimmedCode) return undefined
    let cancelled = false
    const timer = setTimeout(async () => {
      const superAdmin = await findSuperAdminByInviteCode(trimmedCode)
      if (!cancelled) setLookup({ code: trimmedCode, superAdmin })
    }, 350)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [isRegister, trimmedCode])

  const switchMode = (next) => {
    setMode(next)
    setError('')
  }

  const features = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: 'Manage sellers',
      desc: 'Oversee all sellers assigned to you',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: 'Review KYC',
      desc: 'Verify seller identities in real-time',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Process payouts',
      desc: 'Approve and track seller withdrawals',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      ),
      title: 'Invite codes',
      desc: 'Share your invite to onboard sellers',
    },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.email.trim()) {
      setError('Please enter your admin email.')
      return
    }
    if (isRegister && !form.fullName.trim()) {
      setError('Please enter your full name.')
      return
    }
    if (isRegister && !form.inviteCode.trim()) {
      setError('A super admin invite code is required to register.')
      return
    }
    setSubmitting(true)
    const result = isRegister
      ? await registerAdmin({ fullName: form.fullName, email: form.email, password: form.password, inviteCode: form.inviteCode })
      : await loginAdmin({ email: form.email, password: form.password })
    setSubmitting(false)
    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.error || 'Invalid credentials. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden bg-gradient-to-br from-[#0b1220] via-[#1e3a8a] to-[#1e40af] flex-col justify-between p-10 xl:p-16 text-white">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-indigo-500/25 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center">
              <svg className="w-7 h-7 text-[#1e3a8a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xl font-bold">Management Console</p>
              <p className="text-xs uppercase tracking-widest text-indigo-200 font-semibold">
                U Seller Store
              </p>
            </div>
          </div>
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/15 text-sm font-medium mt-4">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
            <span>Admin Dashboard</span>
          </div>
        </div>

        <div className="relative z-10 my-auto">
          <h1 className="text-5xl xl:text-6xl font-bold leading-[1.1] tracking-tight mb-6">
            Welcome to the{' '}
            <span className="bg-gradient-to-r from-cyan-200 via-blue-200 to-indigo-300 bg-clip-text text-transparent">
              control center
            </span>
          </h1>
          <p className="text-lg text-indigo-100 max-w-xl leading-relaxed mb-10">
            Oversee sellers, process payouts, verify identities, and keep the marketplace running smoothly.
          </p>

          <ul className="space-y-4 max-w-md mb-10">
            {features.map((f, i) => (
              <li key={i} className="flex items-start space-x-4">
                <div className="w-11 h-11 bg-white/10 backdrop-blur-sm rounded-xl border border-white/15 flex items-center justify-center text-indigo-200 shrink-0">
                  {f.icon}
                </div>
                <div>
                  <p className="font-semibold text-white">{f.title}</p>
                  <p className="text-sm text-indigo-200">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="w-full lg:w-1/2 xl:w-[45%] flex flex-col min-h-screen bg-white">
        <div className="px-6 sm:px-10 xl:px-16 py-6">
          <a
            href="/"
            className="inline-flex items-center space-x-2 text-sm font-medium text-gray-600 hover:text-[#1e3a8a] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to store</span>
          </a>
        </div>

        <div className="flex-1 flex items-center px-6 sm:px-10 xl:px-16 pb-12">
          <div className="w-full max-w-lg mx-auto">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1e3a8a] to-[#3b82f6] flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl xl:text-4xl font-bold text-gray-900 mb-3">
              {isRegister ? 'Create admin account' : 'Admin sign in'}
            </h1>
            <p className="text-gray-500 mb-6 text-lg">
              {isRegister
                ? 'Register with the invite code your super admin gave you.'
                : 'Access the management console to oversee sellers and payouts.'}
            </p>

            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-2xl mb-8">
              {[['signin', 'Sign in'], ['register', 'Register']].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => switchMode(id)}
                  className={`py-3 rounded-xl font-bold transition-all ${mode === id ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {error && (
              <div role="alert" className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-3">
                <svg className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm font-medium text-rose-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {isRegister && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Full name
                  </label>
                  <input
                    type="text"
                    placeholder="Your full name"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="w-full px-4 py-3.5 bg-white border-2 border-gray-100 rounded-2xl text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:border-[#1e3a8a] focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Admin email
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    placeholder="admin@usellerstore.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-100 rounded-2xl text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:border-[#1e3a8a] focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter admin password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full pl-12 pr-12 py-3.5 bg-white border-2 border-gray-100 rounded-2xl text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:border-[#1e3a8a] focus:ring-4 focus:ring-indigo-500/10"
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

              {isRegister && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Super admin invite code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. K7P2X9QM"
                    value={form.inviteCode}
                    onChange={(e) => setForm({ ...form, inviteCode: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3.5 bg-white border-2 border-gray-100 rounded-2xl text-gray-900 placeholder-gray-400 font-mono font-bold tracking-wide transition-all duration-200 focus:outline-none focus:border-[#1e3a8a] focus:ring-4 focus:ring-indigo-500/10"
                  />
                  {invitingSuperAdmin && (
                    <p className="mt-2 text-sm font-semibold text-emerald-600">
                      Invited by {invitingSuperAdmin.fullName}
                    </p>
                  )}
                  {trimmedCode && !invitingSuperAdmin && !codeCheckPending && (
                    <p className="mt-2 text-sm font-semibold text-rose-600">No super admin uses this code.</p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] hover:from-[#1e40af] hover:to-[#2563eb] text-white font-semibold rounded-2xl shadow-lg shadow-indigo-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/40 text-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (isRegister ? 'Creating account…' : 'Signing in…') : isRegister ? 'Create admin account' : 'Sign in to console'}
              </button>
            </form>

            <div className="mt-10 p-5 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100">
              <div className="flex items-start space-x-3">
                <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">First time here?</p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Admin accounts are invitation-only. Ask your super admin for their invite code, register above, and you'll get your own invite code to share with sellers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
