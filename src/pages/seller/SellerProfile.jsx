import { useNavigate, useOutletContext } from 'react-router-dom'

const SellerProfile = () => {
  const { sellerData } = useOutletContext()
  const navigate = useNavigate()

  const profileInitials = 'AS'

  const settingsSections = [
    {
      title: 'Shop',
      subtitle: 'Shop name, phone & SEO',
      bgColor: 'bg-slate-50',
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      title: 'Account',
      subtitle: 'Email & contact details',
      bgColor: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      title: 'Security',
      subtitle: 'Login & transaction password',
      bgColor: 'bg-orange-50',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    {
      title: 'Payout Method',
      subtitle: 'Bank accounts & wallets for withdrawals',
      bgColor: 'bg-purple-50',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      title: 'Verify',
      subtitle: 'Identity verification',
      bgColor: 'bg-green-50',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
  ]

  const handleLogout = () => {
    navigate('/')
  }

  return (
    <div className="-mx-6 lg:-mx-8 -mt-6 lg:-mt-8">
      <div className="bg-gradient-to-br from-[#0a3d62] via-[#0f4c81] to-[#1a6fb0] px-6 lg:px-8 pt-8 lg:pt-10 pb-24 lg:pb-28">
        <div className="flex items-start space-x-5">
          <div className="relative shrink-0">
            <div className="w-24 h-24 lg:w-28 lg:h-28 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl lg:text-5xl font-bold text-white border-2 border-white/30">
              {profileInitials}
            </div>
            <button className="absolute -bottom-1 -right-1 w-9 h-9 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-100">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
          <div className="flex-1 pt-2">
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">{sellerData.storeName}</h1>
            <p className="text-blue-100 text-base lg:text-lg mb-4">{sellerData.ownerName}</p>

            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white/15 backdrop-blur-sm text-white text-xs font-semibold rounded-full border border-white/20">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>{sellerData.status}</span>
              </span>
              <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-green-500/20 backdrop-blur-sm text-green-200 text-xs font-semibold rounded-full border border-green-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span>Active</span>
              </span>
              <span className="inline-flex items-center space-x-1 px-3 py-1.5 bg-yellow-500/20 backdrop-blur-sm text-yellow-200 text-xs font-semibold rounded-full border border-yellow-400/30">
                <svg className="w-3.5 h-3.5 fill-yellow-300 text-yellow-300" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span>{sellerData.rating}</span>
              </span>
            </div>

            <p className="text-blue-200 text-sm">
              Member since {sellerData.memberSince}
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 lg:px-8 -mt-16 lg:-mt-20 space-y-6 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 lg:p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-slate-100 p-2.5 rounded-xl">
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-0.5">
                    Shop Balance
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    ${sellerData.balance.toFixed(2)}
                  </p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 lg:p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-slate-100 p-2.5 rounded-xl">
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-0.5">
                    Guarantee
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    ${sellerData.guarantee.toFixed(2)}
                  </p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
          {settingsSections.map((section, i) => (
            <button
              key={i}
              className="w-full flex items-center justify-between p-4 lg:p-5 hover:bg-gray-50 transition-colors text-left group"
            >
              <div className="flex items-center space-x-4">
                <div className={`${section.iconBg} ${section.iconColor} p-3 rounded-xl shrink-0`}>
                  {section.icon}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-[#0a3d62] transition-colors">
                    {section.title}
                  </p>
                  <p className="text-sm text-gray-500">{section.subtitle}</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#0a3d62] group-hover:translate-x-0.5 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-4 lg:p-5 hover:bg-red-50 transition-colors text-left group"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-red-100 p-3 rounded-xl shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-red-600 group-hover:text-red-700 transition-colors">
                  Log out
                </p>
                <p className="text-sm text-red-400">Sign out of your seller account</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default SellerProfile
