import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const SellerDashboard = () => {
  const { seller } = useAuth()

  const stats = {
    totalRevenue: 0.0,
    totalProfit: 0.0,
    totalOrders: 0,
    totalViews: 0,
    todayViews: 0,
    pending: 0,
    delivered: 0,
    products: 0,
    thisMonthProfit: 0.0,
    margin: 0,
    totalCost: 0.0,
    thisMonthRevenue: 0.0,
    avgOrderValue: 0.0,
  }

  const bigStatCards = [
    {
      label: 'TOTAL REVENUE',
      value: `$${stats.totalRevenue.toFixed(2)}`,
      bgColor: 'bg-blue-50/60',
      borderColor: 'border-blue-100',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'TOTAL PROFIT',
      value: `$${stats.totalProfit.toFixed(2)}`,
      bgColor: 'bg-green-50/60',
      borderColor: 'border-green-100',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      label: 'TOTAL ORDERS',
      value: stats.totalOrders,
      bgColor: 'bg-purple-50/60',
      borderColor: 'border-purple-100',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
  ]

  const smallStatCards = [
    {
      label: 'Total Views',
      value: stats.totalViews,
      bgColor: 'bg-blue-50/60',
      borderColor: 'border-blue-100',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
    },
    {
      label: 'Today Views',
      value: stats.todayViews,
      bgColor: 'bg-green-50/60',
      borderColor: 'border-green-100',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
    },
    {
      label: 'Pending',
      value: stats.pending,
      bgColor: 'bg-amber-50/60',
      borderColor: 'border-amber-100',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Delivered',
      value: stats.delivered,
      bgColor: 'bg-green-50/60',
      borderColor: 'border-green-100',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      label: 'Products',
      value: stats.products,
      bgColor: 'bg-gray-50/60',
      borderColor: 'border-gray-100',
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      label: 'This Month',
      value: `$${stats.thisMonthProfit.toFixed(2)}`,
      subValue: `Profit $${stats.thisMonthProfit.toFixed(2)}`,
      bgColor: 'bg-orange-50/60',
      borderColor: 'border-orange-100',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ]

  const salesRows = [
    { label: 'Total Revenue', value: `$${stats.totalRevenue.toFixed(2)}`, green: false },
    { label: 'Total Cost', value: `$${stats.totalCost.toFixed(2)}`, green: false },
    { label: 'Total Profit', value: `$${stats.totalProfit.toFixed(2)}`, green: true },
    { label: 'This Month Revenue', value: `$${stats.thisMonthRevenue.toFixed(2)}`, green: false },
    { label: 'This Month Profit', value: `$${stats.thisMonthProfit.toFixed(2)}`, green: true },
    { label: 'Avg. Order Value', value: `$${stats.avgOrderValue.toFixed(2)}`, green: false },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {bigStatCards.map((card, i) => (
          <div
            key={i}
            className={`${card.bgColor} rounded-2xl p-5 lg:p-6 border ${card.borderColor} shadow-sm`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  {card.label}
                </p>
                <p className="text-3xl lg:text-4xl font-bold text-gray-900">{card.value}</p>
              </div>
              <div className={`${card.iconBg} ${card.iconColor} p-3 rounded-2xl`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
        {smallStatCards.map((card, i) => (
          <div
            key={i}
            className={`${card.bgColor} rounded-2xl p-4 lg:p-5 border ${card.borderColor} shadow-sm`}
          >
            <div className="flex items-center space-x-3">
              <div className={`${card.iconBg} ${card.iconColor} p-2.5 rounded-xl shrink-0`}>
                {card.icon}
              </div>
              <div className="min-w-0">
                <p className="text-lg lg:text-xl font-bold text-gray-900 truncate">{card.value}</p>
                <p className="text-xs font-medium text-gray-500 truncate">{card.label}</p>
                {card.subValue && (
                  <p className="text-[11px] text-gray-400 mt-0.5 truncate">{card.subValue}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 lg:p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-gray-100 p-2.5 rounded-xl">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Sales Stats</h2>
            </div>
            <span className="inline-flex items-center space-x-1 px-3 py-1 bg-green-50 text-green-700 text-sm font-medium rounded-full border border-green-100">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span>{stats.margin}% margin</span>
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {salesRows.map((row, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-4"
              >
                <span className="text-gray-600 font-medium">{row.label}</span>
                <span className={`font-semibold ${row.green ? 'text-green-600' : 'text-gray-900'}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 lg:p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-gray-100 p-2.5 rounded-xl">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Products by Category</h2>
          </div>

          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-5">
              <svg className="w-9 h-9 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-base font-semibold text-gray-900 mb-1.5">
              No products yet
            </p>
            <p className="text-sm text-gray-500 leading-relaxed max-w-[260px]">
              Add your first product to see category breakdown.
            </p>
            <Link
              to="/seller/products"
              className="mt-6 inline-flex items-center space-x-2 px-5 py-2.5 bg-[#0a3d62] hover:bg-[#0f4c81] text-white font-semibold rounded-xl transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add product</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SellerDashboard
