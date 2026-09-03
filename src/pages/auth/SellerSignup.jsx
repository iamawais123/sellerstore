import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const SellerSignup = () => {
  const navigate = useNavigate()
  const { loginSeller } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 3

  const [form, setForm] = useState({
    fullName: '',
    email: 'YRHQEG3L',
    inviteCode: '',
    password: '',
    confirmPassword: '',
    shopName: '',
    country: 'India',
    streetAddress: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    documentType: 'national-id',
    frontFile: null,
    backFile: null,
    agreeTerms: false,
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showWarning, setShowWarning] = useState(false)

  const stepTitles = {
    1: 'Account details',
    2: 'Address',
    3: 'Identity verification',
  }

  const features = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      title: 'Curated catalog',
      desc: 'Resell verified, in-stock products',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      title: 'Earn on delivery',
      desc: 'Profit released when orders complete',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: 'Admin-backed',
      desc: 'Personal admin handles fulfillment',
    },
  ]

  const stats = [
    { value: '10K+', label: 'Active sellers' },
    { value: '$2M+', label: 'Paid out' },
    { value: '24/7', label: 'Support' },
  ]

  const countries = [
    'India',
    'Pakistan',
    'United States',
    'United Kingdom',
    'Canada',
    'Australia',
    'United Arab Emirates',
    'Saudi Arabia',
  ]

  const documentTypes = [
    {
      id: 'national-id',
      label: 'National ID',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
        </svg>
      ),
    },
    {
      id: 'driving-licence',
      label: 'Driving licence',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      id: 'passport',
      label: 'Passport',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
  ]

  const uploadRequirements = [
    'JPG, PNG, WEBP, or PDF — up to 10MB per file',
    'Large photos are compressed before upload to avoid slow network failures',
  ]

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const step1Valid = () =>
    form.fullName.trim() !== '' &&
    form.email.trim() !== '' &&
    form.inviteCode.trim() !== '' &&
    form.password !== '' &&
    form.confirmPassword !== ''

  const step2Valid = () =>
    form.shopName.trim() !== '' &&
    form.country !== '' &&
    form.streetAddress.trim() !== '' &&
    form.city.trim() !== '' &&
    form.state.trim() !== ''

  const step3Valid = () =>
    form.documentType !== '' &&
    form.frontFile !== null &&
    form.backFile !== null &&
    form.agreeTerms

  const nextStep = (e) => {
    e.preventDefault()
    if (currentStep === 1 && !step1Valid()) {
      setShowWarning(true)
      setTimeout(() => setShowWarning(false), 3000)
      return
    }
    if (currentStep === 2 && !step2Valid()) {
      setShowWarning(true)
      setTimeout(() => setShowWarning(false), 3000)
      return
    }
    if (currentStep < totalSteps) {
      setShowWarning(false)
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = (e) => {
    e.preventDefault()
    if (currentStep > 1) {
      setShowWarning(false)
      setCurrentStep(currentStep - 1)
    }
  }

  const handleFinalSubmit = (e) => {
    e.preventDefault()
    if (!step3Valid()) {
      setShowWarning(true)
      setTimeout(() => setShowWarning(false), 3000)
      return
    }
    loginSeller({
      fullName: form.fullName,
      shopName: form.shopName || 'My Shop',
      email: form.email,
    })
    navigate('/seller/dashboard')
  }

  const handleFileUpload = (key, e) => {
    const file = e.target.files && e.target.files[0]
    if (file) update(key, file)
  }

  const canContinue =
    (currentStep === 1 && step1Valid()) ||
    (currentStep === 2 && step2Valid()) ||
    (currentStep === 3 && step3Valid())

  const renderLeftPanel = () => (
    <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden bg-gradient-to-br from-[#031b2e] via-[#0a3d62] to-[#0f4c81] flex-col justify-between p-10 xl:p-16 text-white">
      <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center">
            <svg className="w-7 h-7 text-[#0a3d62]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xl font-bold">Seller Portal</p>
            <p className="text-xs uppercase tracking-widest text-blue-200 font-semibold">
              E Seller Store
            </p>
          </div>
        </div>
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/15 text-sm font-medium mt-4">
          <svg className="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span>Become a reseller in minutes</span>
        </div>
      </div>

      <div className="relative z-10 my-auto">
        <h1 className="text-5xl xl:text-6xl font-bold leading-[1.1] tracking-tight mb-6">
          Sell from our catalog,{' '}
          <span className="bg-gradient-to-r from-cyan-200 to-blue-300 bg-clip-text text-transparent">
            earn on every order
          </span>
        </h1>
        <p className="text-lg text-blue-100 max-w-xl leading-relaxed mb-10">
          Pick products from our verified inventory, share them with your audience, and earn profit on each delivered order — no inventory, no shipping headaches.
        </p>

        <ul className="space-y-5 max-w-md mb-12">
          {features.map((f, i) => (
            <li key={i} className="flex items-start space-x-4">
              <div className="w-11 h-11 bg-white/10 backdrop-blur-sm rounded-xl border border-white/15 flex items-center justify-center text-blue-200 shrink-0">
                {f.icon}
              </div>
              <div>
                <p className="font-semibold text-white">{f.title}</p>
                <p className="text-sm text-blue-200">{f.desc}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="grid grid-cols-3 gap-4 max-w-lg">
          {stats.map((s, i) => (
            <div key={i} className="border-l-2 border-white/20 pl-4">
              <p className="text-3xl xl:text-4xl font-bold text-white">{s.value}</p>
              <p className="text-sm text-blue-200 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderStep1 = () => {
    const fields = [
      {
        name: 'fullName',
        label: 'Your name',
        placeholder: 'Full name',
        type: 'text',
        value: form.fullName,
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ),
        disabled: false,
        highlight: false,
      },
      {
        name: 'email',
        label: 'Seller email',
        placeholder: 'Seller email',
        type: 'email',
        value: form.email,
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        ),
        disabled: true,
        highlight: true,
      },
      {
        name: 'inviteCode',
        label: 'Invitation code',
        placeholder: 'Enter invitation code',
        type: 'text',
        value: form.inviteCode,
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        ),
        disabled: false,
        highlight: false,
      },
      {
        name: 'password',
        label: 'Password',
        placeholder: 'Password',
        type: showPassword ? 'text' : 'password',
        value: form.password,
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        ),
        disabled: false,
        highlight: true,
        showToggle: true,
        toggle: () => setShowPassword(!showPassword),
        visible: showPassword,
      },
      {
        name: 'confirmPassword',
        label: 'Confirm password',
        placeholder: 'Re-enter password',
        type: showConfirm ? 'text' : 'password',
        value: form.confirmPassword,
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        ),
        disabled: false,
        highlight: false,
        showToggle: true,
        toggle: () => setShowConfirm(!showConfirm),
        visible: showConfirm,
      },
    ]

    return (
      <div className="space-y-5">
        {fields.map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-semibold text-gray-900 mb-2">{field.label}</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">{field.icon}</span>
              <input
                type={field.type}
                placeholder={field.placeholder}
                value={field.value}
                disabled={field.disabled}
                onChange={(e) => update(field.name, e.target.value)}
                className={`w-full pl-12 pr-12 py-3.5 border-2 rounded-2xl text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none ${
                  field.highlight
                    ? 'bg-blue-50/60 border-blue-100 focus:border-[#0a3d62] focus:ring-4 focus:ring-[#0a3d62]/10'
                    : 'bg-white border-gray-100 focus:border-[#0a3d62] focus:ring-4 focus:ring-[#0a3d62]/10'
                } ${field.disabled ? 'cursor-not-allowed opacity-90' : ''}`}
              />
              {field.showToggle && (
                <button
                  type="button"
                  onClick={field.toggle}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {!field.visible ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderStep2 = () => (
    <div className="space-y-5">
      {showWarning && (
        <div className="flex items-start space-x-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl">
          <svg className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm font-medium text-rose-700">Please complete all fields.</p>
        </div>
      )}

      <div className="p-4 bg-blue-50/80 border border-blue-100 rounded-2xl">
        <div className="flex items-start space-x-3">
          <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-sm mb-0.5">Your address</p>
            <p className="text-gray-600 text-xs leading-relaxed">
              Where you live or operate from. We use this for payouts and identity verification — it stays private to your admin.
            </p>
            <div className="inline-flex items-center space-x-1.5 mt-2">
              <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-[11px] font-bold uppercase tracking-wider text-green-700">
                Encrypted & Private
              </span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Shop name</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Your store name"
            value={form.shopName}
            onChange={(e) => update('shopName', e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-100 rounded-2xl text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:border-[#0a3d62] focus:ring-4 focus:ring-[#0a3d62]/10"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Country</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <select
            value={form.country}
            onChange={(e) => update('country', e.target.value)}
            className="w-full pl-12 pr-10 py-3.5 bg-white border-2 border-gray-100 rounded-2xl text-gray-900 transition-all duration-200 focus:outline-none focus:border-[#0a3d62] focus:ring-4 focus:ring-[#0a3d62]/10 appearance-none cursor-pointer"
          >
            {countries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Street address</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="House / building number, street"
            value={form.streetAddress}
            onChange={(e) => update('streetAddress', e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-100 rounded-2xl text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:border-[#0a3d62] focus:ring-4 focus:ring-[#0a3d62]/10"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">City</label>
          <input
            type="text"
            placeholder="City"
            value={form.city}
            onChange={(e) => update('city', e.target.value)}
            className="w-full px-4 py-3.5 bg-white border-2 border-gray-100 rounded-2xl text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:border-[#0a3d62] focus:ring-4 focus:ring-[#0a3d62]/10"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">State</label>
          <input
            type="text"
            placeholder="State"
            value={form.state}
            onChange={(e) => update('state', e.target.value)}
            className="w-full px-4 py-3.5 bg-white border-2 border-gray-100 rounded-2xl text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:border-[#0a3d62] focus:ring-4 focus:ring-[#0a3d62]/10"
          />
        </div>
      </div>
    </div>
  )

  const renderUploadSlot = (label, subLabel, key, file) => (
    <div>
      <label className="block text-sm font-semibold text-gray-900 mb-2">{label}</label>
      <label className="block border-2 border-dashed border-gray-200 hover:border-[#0a3d62]/40 hover:bg-blue-50/40 rounded-2xl p-4 cursor-pointer transition-all duration-200 group">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={(e) => handleFileUpload(key, e)}
        />
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-gray-50 group-hover:bg-blue-100 rounded-xl flex items-center justify-center transition-colors shrink-0">
            <svg className="w-5 h-5 text-gray-400 group-hover:text-[#0a3d62] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <div className="flex-1 min-w-0 py-1">
            {file ? (
              <>
                <p className="text-sm font-semibold text-[#0a3d62] truncate">{file.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {(file.size / 1024).toFixed(1)} KB · Click to replace
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-[#0a3d62] transition-colors">
                  Upload image or PDF
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{subLabel}</p>
              </>
            )}
          </div>
        </div>
      </label>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      {showWarning && (
        <div className="flex items-start space-x-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl">
          <svg className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm font-medium text-rose-700">Please complete all fields.</p>
        </div>
      )}

      <div className="p-4 bg-blue-50/80 border border-blue-100 rounded-2xl">
        <div className="flex items-start space-x-3">
          <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm mb-0.5">Identity verification</p>
            <p className="text-gray-600 text-xs leading-relaxed">
              Upload a government-issued ID to unlock payouts and product listings. Approval typically takes under 24 hours.
            </p>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-gray-900">Document type</label>
          <button type="button" className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {documentTypes.map((doc) => {
            const active = form.documentType === doc.id
            return (
              <button
                key={doc.id}
                type="button"
                onClick={() => update('documentType', doc.id)}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 ${
                  active
                    ? 'border-[#0a3d62] bg-blue-50/60 shadow-sm'
                    : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className={`mb-2 ${active ? 'text-[#0a3d62]' : 'text-gray-400'}`}>
                  {doc.icon}
                </div>
                <span className={`text-xs font-semibold ${active ? 'text-[#0a3d62]' : 'text-gray-700'}`}>
                  {doc.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {renderUploadSlot('Front side', 'Clear photo of the front of your document', 'frontFile', form.frontFile)}
      {renderUploadSlot('Back side', 'Clear photo of the back of your document', 'backFile', form.backFile)}

      <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl">
        <div className="flex items-start space-x-3">
          <svg className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div>
            <p className="text-xs font-bold text-gray-800 mb-2 uppercase tracking-wide">
              Upload requirements
            </p>
            <ul className="space-y-1.5">
              {uploadRequirements.map((r, i) => (
                <li key={i} className="flex items-start space-x-2 text-xs text-gray-600">
                  <svg className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <label className="flex items-start space-x-3 cursor-pointer select-none pt-1">
        <input
          type="checkbox"
          checked={form.agreeTerms}
          onChange={(e) => update('agreeTerms', e.target.checked)}
          className="w-4 h-4 mt-0.5 rounded border-gray-300 text-[#0a3d62] focus:ring-[#0a3d62] focus:ring-offset-0 cursor-pointer"
        />
        <span className="text-sm text-gray-600">
          I agree to the{' '}
          <a href="#" className="font-semibold text-slate-800 hover:text-[#0a3d62]">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="font-semibold text-slate-800 hover:text-[#0a3d62]">
            Privacy Policy
          </a>
          .
        </span>
      </label>
    </div>
  )

  const renderFormContent = () => {
    if (currentStep === 1) return renderStep1()
    if (currentStep === 2) return renderStep2()
    return renderStep3()
  }

  const isFinalStep = currentStep === totalSteps
  const primaryButtonLabel = isFinalStep ? 'Create my shop' : 'Continue'
  const handlePrimary = isFinalStep ? handleFinalSubmit : nextStep

  return (
    <div className="min-h-screen flex">
      {renderLeftPanel()}

      <div className="w-full lg:w-1/2 xl:w-[45%] flex flex-col min-h-screen bg-white">
        <div className="px-6 sm:px-10 xl:px-16 py-6">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 text-sm font-medium text-gray-600 hover:text-[#0a3d62] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to home</span>
          </Link>
        </div>

        <div className="flex-1 flex items-center px-6 sm:px-10 xl:px-16 pb-12">
          <div className="w-full max-w-lg mx-auto">
            <h1 className="text-3xl xl:text-4xl font-bold text-gray-900 mb-2">Become a seller</h1>
            <p className="text-gray-500 mb-6">
              Step {currentStep} of {totalSteps} — {stepTitles[currentStep]}
            </p>

            <div className="flex items-center space-x-2 mb-8">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                    i < currentStep ? 'bg-[#0a3d62]' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>

            <form onSubmit={handlePrimary} className="space-y-6">
              {renderFormContent()}

              {currentStep > 1 || currentStep < totalSteps ? (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="w-full py-3.5 bg-white text-gray-800 font-semibold rounded-2xl border-2 border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-all duration-200"
                    >
                      Back
                    </button>
                  ) : (
                    <div />
                  )}
                  <button
                    type="submit"
                    className={`w-full py-3.5 text-white font-semibold rounded-2xl transition-all duration-200 ${
                      canContinue
                        ? 'bg-gradient-to-r from-[#0a3d62] to-[#1a6fb0] hover:from-[#0f4c81] hover:to-[#2b7fc0] shadow-lg shadow-[#0a3d62]/20 hover:shadow-xl hover:shadow-[#0a3d62]/30'
                        : 'bg-slate-400 cursor-not-allowed shadow-none'
                    }`}
                  >
                    {primaryButtonLabel}
                  </button>
                </div>
              ) : (
                <button
                  type="submit"
                  className={`w-full mt-2 py-4 text-white font-semibold rounded-2xl transition-all duration-200 ${
                    canContinue
                      ? 'bg-gradient-to-r from-[#0a3d62] to-[#1a6fb0] hover:from-[#0f4c81] hover:to-[#2b7fc0] shadow-lg shadow-[#0a3d62]/20 hover:shadow-xl hover:shadow-[#0a3d62]/30'
                      : 'bg-slate-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  {primaryButtonLabel}
                </button>
              )}
            </form>

            <div className="mt-8 text-center text-sm">
              <p className="text-gray-500">
                Already a seller?{' '}
                <Link
                  to="/seller/login"
                  className="font-semibold text-[#0a3d62] hover:text-[#0f4c81] underline underline-offset-2 transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SellerSignup
