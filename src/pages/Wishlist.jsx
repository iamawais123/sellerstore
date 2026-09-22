import { useMemo } from 'react'
import { useWishlist } from '../context/WishlistContext'
import { findProductById } from '../data/data'
import ProductCard from '../components/ProductCard'
import EmptyState from '../components/EmptyState'

const HeartIcon = () => (
  <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
)

const Wishlist = () => {
  const { ids, clear } = useWishlist()
  const products = useMemo(() => ids.map((id) => findProductById(id)).filter(Boolean), [ids])

  if (products.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <EmptyState
          icon={<HeartIcon />}
          title="Your wishlist is empty"
          text="Tap the heart on any product to save it here for later."
          actionLabel="Browse Products"
          to="/shop"
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="flex items-baseline justify-between gap-4 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Wishlist <span className="text-gray-400 font-semibold">({products.length})</span>
        </h1>
        <button type="button" onClick={clear} className="text-sm font-semibold text-rose-600 hover:underline">
          Clear all
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}

export default Wishlist
