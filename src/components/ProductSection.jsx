import { Link } from 'react-router-dom'
import ProductCard from './ProductCard'

const ProductSection = ({ title, products, to = '/shop' }) => {
  return (
    <section className="py-8 lg:py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <span className="w-1 h-8 bg-[#0a3d62] rounded-full" />
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h2>
          </div>
          <Link
            to={to}
            className="inline-flex items-center gap-1 text-[#0a3d62] font-semibold hover:underline transition-colors"
          >
            <span>See all</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>

        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory hide-scrollbar -mx-4 px-4 pb-2 sm:mx-0 sm:px-0 sm:pb-0 sm:overflow-visible sm:snap-none sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 lg:gap-5">
          {products.map((product) => (
            <div key={product.id} className="snap-start shrink-0 w-[68vw] max-w-[16rem] sm:w-auto sm:max-w-none sm:shrink">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ProductSection
