import { useState } from 'react'

const SellerOrders = () => {
  const [activeTab, setActiveTab] = useState('all')

  const tabs = [
    { id: 'all', label: 'All', dotColor: 'bg-gray-400' },
    { id: 'unpaid', label: 'Unpaid', dotColor: 'bg-rose-500' },
    { id: 'paid', label: 'Paid', dotColor: 'bg-blue-500' },
    { id: 'pickup', label: 'Pickup', dotColor: 'bg-amber-500' },
    { id: 'on-the-way', label: 'On the way', dotColor: 'bg-indigo-500' },
    { id: 'out-for-delivery', label: 'Out for delivery', dotColor: 'bg-cyan-500' },
    { id: 'delivered', label: 'Delivered', dotColor: 'bg-green-500' },
    { id: 'cancelled', label: 'Cancelled', dotColor: 'bg-gray-500' },
  ]

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-2xl p-1.5 overflow-x-auto">
        <div className="flex space-x-1 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${tab.dotColor}`} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 lg:p-16 min-h-[400px]">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No orders here yet</h3>
          <p className="text-gray-500 max-w-md mx-auto text-base">
            When your admin assigns an order to your shop it will appear in this list.
          </p>
        </div>
      </div>
    </div>
  )
}

export default SellerOrders
