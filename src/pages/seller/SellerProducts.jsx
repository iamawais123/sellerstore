import { useOutletContext } from 'react-router-dom'

const SellerProducts = () => {
  const { sellerData } = useOutletContext()

  const slots = {
    used: 0,
    total: 50,
    remaining: 50,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">My Products</h1>
          <p className="text-gray-500">
            <span className="font-semibold text-gray-900">{slots.used}</span> of{' '}
            <span className="font-semibold">{slots.total}</span> slots used ·{' '}
            <span className="font-semibold text-[#0a3d62]">{slots.remaining}</span> remaining
          </p>
        </div>
        <button className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#0a3d62] hover:bg-[#0f4c81] text-white font-semibold rounded-xl shadow-sm transition-colors whitespace-nowrap">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add products</span>
        </button>
      </div>

      {!sellerData.verified && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-5 lg:p-7">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-1.5">
                Your store is not verified yet
              </h2>
              <p className="text-gray-600 text-sm lg:text-base">
                Please complete verification first to start adding products to your store.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 lg:p-12">
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No products yet</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            Start selling by adding your first product. Once verified, you'll be able to list up to {slots.total} products.
          </p>
          <button className="inline-flex items-center space-x-2 px-6 py-3 bg-[#0a3d62] hover:bg-[#0f4c81] text-white font-semibold rounded-xl shadow-sm transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add your first product</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default SellerProducts
