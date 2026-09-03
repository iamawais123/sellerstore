import { useState } from 'react'
import { Link } from 'react-router-dom'

const ProductCard = ({ product }) => {
  const [wishlisted, setWishlisted] = useState(product.wishlist || false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const toggleWishlist = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setWishlisted(!wishlisted)
  }

  const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const reviewCount = product.reviewCount ?? (Array.isArray(product.reviews) ? product.reviews.length : 0)

  return (
    <Link
      to={`/product/${product.id}`}
      className="group relative flex flex-col bg-white rounded-2xl border border-gray-100 hover:border-[#0a3d62]/20 hover:shadow-xl transition-all duration-300 overflow-hidden"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {product.discount && (
          <span className="absolute top-3 left-3 z-10 bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
            -{product.discount}%
          </span>
        )}

        <button
          onClick={toggleWishlist}
          className={`absolute top-3 right-3 z-10 w-9 h-9 rounded-full shadow-sm flex items-center justify-center transition-all duration-200 ${
            wishlisted
              ? 'bg-rose-500 text-white'
              : 'bg-white text-gray-600 hover:bg-rose-50 hover:text-rose-500'
          }`}
          aria-label="Add to wishlist"
        >
          <svg
            className="w-4 h-4"
            fill={wishlisted ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>

        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-[#0a3d62] rounded-full animate-spin" />
          </div>
        )}

        <img
          src={product.image}
          alt={product.name}
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-contain p-4 transition-all duration-500 group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>

      <div className="flex-1 flex flex-col p-4">
        <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 min-h-[40px] group-hover:text-[#0a3d62] transition-colors mb-3">
          {product.name}
        </h3>

        <div className="flex items-center space-x-1 mb-3">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20">
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
          </div>
          <span className="text-sm font-medium text-gray-900">
            {product.rating}
          </span>
          <span className="text-sm text-gray-400">({reviewCount})</span>
        </div>

        <div className="mt-auto flex items-end justify-between pt-2">
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-bold text-gray-900">
              ${product.price.toFixed(2)}
            </span>
            {product.oldPrice && (
              <span className="text-sm text-gray-400 line-through">
                ${product.oldPrice.toFixed(2)}
              </span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            className="w-11 h-11 rounded-full bg-[#0a3d62] hover:bg-[#0f4c81] text-white flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300 shrink-0 group/btn"
            aria-label="Add to cart"
          >
            <svg
              className="w-5 h-5 transition-transform duration-200 group-hover/btn:scale-110"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </button>
        </div>
      </div>
    </Link>
  )
}

export default ProductCard
