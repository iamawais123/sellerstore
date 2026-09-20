import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSuperAuth } from '../../context/AuthContext'
import { Icon } from '../../components/ui'

const features = [
  { icon: 'users', title: 'Oversee every admin', desc: 'See each admin, their sellers and balances at a glance' },
  { icon: 'key', title: 'Invite with your code', desc: 'Admins register with your super admin invite code' },
  { icon: 'crown', title: 'Add super admins', desc: 'Share control with trusted super admins' },
  { icon: 'login', title: 'Log in as any admin', desc: 'Jump straight into an admin console in one click' },
]

const fieldClass =
  'w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-100 rounded-2xl text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:border-[#1e3a8a] focus:ring-4 focus:ring-indigo-500/10'

const Field = ({ label, icon, children }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-900 mb-2">{label}</label>
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
        <Icon name={icon} className="w-5 h-5" />
      </span>
      {children}
    </div>
  </div>
)

const SuperAdminLogin = () => {
  const navigate = useNavigate()
  const { loginSuperAdmin, registerSuperAdmin, canRegisterSuperAdmin, bootstrapError } = useSuperAuth()
  const [mode, setMode] = useState(canRegisterSuperAdmin ? 'register' : 'signin')
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const isRegister = mode === 'register' && canRegisterSuperAdmin

  const setField = (name) => (event) => setForm({ ...form, [name]: event.target.value })

  const switchMode = (next) => {
    setMode(next)
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    if (isRegister && form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    const result = isRegister
      ? await registerSuperAdmin({ fullName: form.fullName, email: form.email, password: form.password })
      : await loginSuperAdmin({ email: form.email, password: form.password })
    setSubmitting(false)
    if (result.success) navigate('/dashboard')
    else setError(result.error)
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden bg-gradient-to-br from-[#0b1220] via-[#1e3a8a] to-[#1e40af] flex-col justify-between p-10 xl:p-16 text-white">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-indigo-500/25 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center">
              <Icon name="crown" className="w-7 h-7 text-[#1e3a8a]" />
            </div>
            <div>
              <p className="text-xl font-bold">Super Admin Console</p>
              <p className="text-xs uppercase tracking-widest text-indigo-200 font-semibold">U Seller Store</p>
            </div>
          </div>
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/15 text-sm font-medium mt-4">
            <Icon name="shield" className="w-4 h-4 text-green-400" />
            <span>Super Admin Dashboard</span>
          </div>
        </div>

        <div className="relative z-10 my-auto">
          <h1 className="text-5xl xl:text-6xl font-bold leading-[1.1] tracking-tight mb-6">
            Command the{' '}
            <span className="bg-gradient-to-r from-cyan-200 via-blue-200 to-indigo-300 bg-clip-text text-transparent">
              whole network
            </span>
          </h1>
          <p className="text-lg text-indigo-100 max-w-xl leading-relaxed mb-10">
            Onboard admins with your invite code, keep an eye on every seller they manage, and step into any admin console when needed.
          </p>
          <ul className="space-y-4 max-w-md mb-10">
            {features.map((f) => (
              <li key={f.title} className="flex items-start space-x-4">
                <div className="w-11 h-11 bg-white/10 backdrop-blur-sm rounded-xl border border-white/15 flex items-center justify-center text-indigo-200 shrink-0">
                  <Icon name={f.icon} className="w-5 h-5" />
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
        <div className="px-6 sm:px-10 xl:px-16 py-6 flex items-center justify-between">
          <a href="/" className="inline-flex items-center space-x-2 text-sm font-medium text-gray-600 hover:text-[#1e3a8a] transition-colors">
            <Icon name="arrow-right" className="w-4 h-4 rotate-180" />
            <span>Back to store</span>
          </a>
          <a href="/admin-app/login" className="text-sm font-medium text-gray-600 hover:text-[#1e3a8a] transition-colors">
            Admin console
          </a>
        </div>

        <div className="flex-1 flex items-center px-6 sm:px-10 xl:px-16 pb-12">
          <div className="w-full max-w-lg mx-auto">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1e3a8a] to-[#3b82f6] flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Icon name="crown" className="w-6 h-6 text-white" />
              </div>
            </div>
            <h1 className="text-3xl xl:text-4xl font-bold text-gray-900 mb-3">
              {isRegister ? 'Register super admin' : 'Super admin sign in'}
            </h1>
            <p className="text-gray-500 mb-6 text-lg">
              {isRegister
                ? 'Create the first super admin account. Your invite code is generated automatically.'
                : 'Access the super admin console to manage admins and invite codes.'}
            </p>

            {canRegisterSuperAdmin && (
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
            )}

            {(error || bootstrapError) && (
              <div role="alert" className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-3">
                <Icon name="warn" className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-rose-700">{error || bootstrapError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {isRegister && (
                <Field label="Full name" icon="users">
                  <input type="text" placeholder="Your full name" value={form.fullName} onChange={setField('fullName')} className={fieldClass} />
                </Field>
              )}

              <Field label="Email" icon="link">
                <input type="email" placeholder="superadmin@usellerstore.com" value={form.email} onChange={setField('email')} className={fieldClass} />
              </Field>

              <Field label="Password" icon="key">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={isRegister ? 'Choose a password (min. 6 characters)' : 'Enter your password'}
                  value={form.password}
                  onChange={setField('password')}
                  className={`${fieldClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Icon name={showPassword ? 'eye-off' : 'eye'} className="w-5 h-5" />
                </button>
              </Field>

              {isRegister && (
                <Field label="Confirm password" icon="key">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Repeat your password"
                    value={form.confirm}
                    onChange={setField('confirm')}
                    className={fieldClass}
                  />
                </Field>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] hover:from-[#1e40af] hover:to-[#2563eb] text-white font-semibold rounded-2xl shadow-lg shadow-indigo-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/40 text-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (isRegister ? 'Creating account…' : 'Signing in…') : isRegister ? 'Create super admin account' : 'Sign in to console'}
              </button>
            </form>

            <div className="mt-10 p-5 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100">
              <div className="flex items-start space-x-3">
                <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                  <Icon name="info" className="w-5 h-5 text-indigo-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {canRegisterSuperAdmin ? 'First super admin' : 'Need an account?'}
                  </p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {canRegisterSuperAdmin
                      ? 'No super admin exists yet, so registration is open. Once you register, further super admins can only be added by an existing super admin from inside this console.'
                      : 'Super admin registration is closed. An existing super admin can add you from the Super Admins page.'}
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

export default SuperAdminLogin
