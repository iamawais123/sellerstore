import { useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { findProductById, getRelatedProducts } from '../data/data'
import { useCart } from '../context/CartContext'

const renderStars = (rating, size = 'w-5 h-5') => (
  <div className="flex items-center">
    {[1, 2, 3, 4, 5].map(i => {
      const filled = i <= Math.round(rating)
      const half = !filled && i - 0.5 <= rating
      return (
        <svg key={i} className={`${size} ${filled ? 'text-amber-400' : half ? 'text-amber-300' : 'text-gray-200'} fill-current`} viewBox="0 0 20 20">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      )
    })}
  </div>
)

const REVIEWS_PER_LOAD = 5

const ProductDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const product = findProductById(id)
  const { addItem, openCart } = useCart()

  const [activeImage, setActiveImage] = useState(0)
  const [qty, setQty] = useState(1)
  const [wishlisted, setWishlisted] = useState(false)
  const [showFullFeatures, setShowFullFeatures] = useState(false)
  const [showFullTitle, setShowFullTitle] = useState(false)
  const [visibleReviews, setVisibleReviews] = useState(REVIEWS_PER_LOAD)

  const relatedProducts = useMemo(() => (product ? getRelatedProducts(product, 5) : []), [product?.id])

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Product not found</h1>
        <p className="text-gray-500 mb-6">The product you're looking for doesn't exist or has been moved.</p>
        <Link to="/shop" className="inline-flex items-center px-6 py-3 bg-[#0a3d62] text-white font-semibold rounded-full hover:bg-[#0f4c81] transition-colors">
          Back to Shop
        </Link>
      </div>
    )
  }

  const bc = product.breadcrumb || ['Home', 'Shop', product.category]
  const reviews = product.reviews || []
  const totalReviews = product.reviewCount || reviews.length
  const reviewSubset = reviews.slice(0, visibleReviews)
  const hasMore = visibleReviews < reviews.length

  const visibleFeatures = showFullFeatures ? product.features : product.features?.slice(0, 2) || []

  const onShare = () => {
    if (navigator.share) {
      navigator.share({ title: product.name, url: window.location.href }).catch(() => {})
    } else {
      navigator.clipboard?.writeText(window.location.href)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
      <nav className="flex items-center flex-wrap gap-x-2 gap-y-1 text-sm text-gray-500 mb-6">
        {bc.map((crumb, i) => {
          const isLast = i === bc.length - 1
          const path = i === 0 ? '/' : i === 1 ? '/shop' : null
          const Label = (
            <span className={`${isLast ? 'text-gray-900 font-medium' : 'hover:text-[#0a3d62] hover:underline'}`}>
              {i === 0 ? (
                <span className="inline-flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>{crumb}</span>
                </span>
              ) : isLast ? (
                <span className="line-clamp-1">{product.name}</span>
              ) : (
                crumb
              )}
            </span>
          )
          return (
            <span key={i} className="inline-flex items-center space-x-2">
              {path ? <Link to={path}>{Label}</Link> : Label}
              {!isLast && <span className="text-gray-300">›</span>}
            </span>
          )
        })}
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
        <div className="space-y-4">
          <div className="relative aspect-square rounded-3xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center p-6">
            {product.discount && (
              <span className="absolute top-4 left-4 z-10 bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                -{product.discount}%
              </span>
            )}
            <img
              src={product.gallery?.[activeImage] || product.image}
              alt={product.name}
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex items-center space-x-3 overflow-x-auto hide-scrollbar pb-1">
            <p className="text-sm font-semibold text-gray-500 shrink-0 mr-2">MORE VIEWS</p>
            {(product.gallery || [product.image]).map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={`shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 transition-all ${
                  i === activeImage
                    ? 'border-[#0a3d62] shadow-md'
                    : 'border-gray-100 hover:border-gray-300'
                }`}
              >
                <img src={img} alt={`View ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex items-start justify-between space-x-4 mb-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                {showFullTitle ? product.name : (
                  <>
                    {product.name.length > 80 ? product.name.slice(0, 77) + '...' : product.name}
                  </>
                )}
              </h1>
              {product.name.length > 80 && (
                <button onClick={() => setShowFullTitle(true)} className="mt-2 text-[#0a3d62] font-semibold text-sm hover:underline">
                  Show full title
                </button>
              )}
            </div>
            <button
              onClick={onShare}
              className="shrink-0 w-11 h-11 rounded-full border border-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-50 transition-colors"
              aria-label="Share"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>

          <div className="flex items-center space-x-3 mb-4">
            {renderStars(product.rating, 'w-5 h-5')}
            <span className="text-lg font-bold text-gray-900">{product.rating}</span>
            <button onClick={() => document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' })} className="text-gray-500 hover:text-gray-900 hover:underline">
              ({totalReviews} reviews)
            </button>
          </div>

          <div className="flex items-baseline flex-wrap gap-x-3 gap-y-2 mb-5">
            <span className="text-4xl font-extrabold text-[#0a3d62]">
              ${product.price.toFixed(2)}
            </span>
            {product.oldPrice && (
              <>
                <span className="text-xl text-gray-400 line-through">
                  ${product.oldPrice.toFixed(2)}
                </span>
                <span className="bg-amber-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                  -{product.discount}%
                </span>
              </>
            )}
          </div>

          <div className="flex items-center space-x-2 mb-6">
            {product.inStock ? (
              <>
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-semibold text-emerald-600">In stock</span>
              </>
            ) : (
              <span className="font-semibold text-rose-600">Out of stock</span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-stretch gap-3 mb-5">
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                className="w-12 h-14 text-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
                disabled={qty <= 1}
              >
                −
              </button>
              <span className="w-16 text-center text-lg font-semibold text-gray-900">{qty}</span>
              <button
                onClick={() => setQty(q => q + 1)}
                className="w-12 h-14 text-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                +
              </button>
            </div>
            <button
              onClick={() => addItem(product, qty)}
              disabled={!product.inStock}
              className="flex-1 inline-flex items-center justify-center space-x-2 px-8 py-3.5 bg-[#0a3d62] hover:bg-[#0f4c81] text-white font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Add to Cart</span>
            </button>
            <button
              onClick={() => setWishlisted(w => !w)}
              className={`w-14 h-14 shrink-0 rounded-xl border border-gray-200 flex items-center justify-center transition-colors ${
                wishlisted ? 'bg-rose-50 text-rose-500 border-rose-200' : 'text-gray-500 hover:bg-gray-50'
              }`}
              aria-label="Add to wishlist"
            >
              <svg className="w-6 h-6" fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>

          <button
            onClick={() => navigate('/shop')}
            className="w-full px-8 py-3.5 border border-gray-200 rounded-xl text-gray-900 font-semibold hover:bg-gray-50 transition-colors mb-8"
          >
            Buy Now
          </button>

          <div className="border-t border-gray-100 pt-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Product Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="border border-gray-100 rounded-2xl p-5 sm:p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Features</h3>
                <ul className="space-y-3">
                  {visibleFeatures.map((f, i) => (
                    <li key={i} className="p-4 bg-gray-50 rounded-xl">
                      <p className="font-semibold text-gray-900 text-[15px] mb-1">{f.title}</p>
                      <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                    </li>
                  ))}
                </ul>
                {product.features?.length > 2 && (
                  <button
                    onClick={() => setShowFullFeatures(v => !v)}
                    className="mt-4 inline-flex items-center space-x-1 text-[#0a3d62] font-semibold hover:underline"
                  >
                    <span>{showFullFeatures ? 'Read less' : 'Read more'}</span>
                    <svg className={`w-4 h-4 transition-transform ${showFullFeatures ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="border border-gray-100 rounded-2xl p-5 sm:p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Specifications</h3>
                <ul className="space-y-3">
                  {(product.specifications || []).map((s, i) => (
                    <li key={i} className="flex items-stretch p-4 bg-gray-50 rounded-xl">
                      <span className="w-2/5 shrink-0 text-sm font-semibold text-gray-600 pr-3">{s.label}</span>
                      <span className="w-3/5 text-sm text-gray-900 font-medium">{s.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section id="reviews" className="mb-16 scroll-mt-28">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
        <div className="space-y-4">
          {reviewSubset.map(r => (
            <div key={r.id} className="border border-gray-100 rounded-2xl p-5 sm:p-6 hover:border-gray-200 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-11 h-11 rounded-full ${r.avatarBg} text-white font-bold flex items-center justify-center`}>
                    {r.initials}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold text-gray-900">{r.name}</h4>
                      {r.verified && (
                        <span className="text-xs bg-sky-50 text-sky-600 font-semibold px-2 py-0.5 rounded-full">Verified</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{r.date}</p>
                  </div>
                </div>
                {renderStars(r.rating, 'w-4 h-4')}
              </div>
              <p className="text-gray-800 leading-relaxed pl-14">{r.text}</p>
            </div>
          ))}
        </div>
        {hasMore && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setVisibleReviews(v => Math.min(v + REVIEWS_PER_LOAD, reviews.length))}
              className="inline-flex items-center space-x-1 text-[#0a3d62] font-semibold text-[15px] hover:underline"
            >
              <span>Load more reviews</span>
            </button>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Related Products</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-5">
          {relatedProducts.map(p => (
            <ProductCard key={`rel-${p.id}`} product={p} />
          ))}
        </div>
      </section>
    </div>
  )
}

export default ProductDetail
