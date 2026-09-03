import ProductCard from './ProductCard'

const ProductSection = ({ title, products }) => {
  return (
    <section className="py-8 lg:py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <span className="w-1 h-8 bg-[#0a3d62] rounded-full" />
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {title}
            </h2>
          </div>
          <a
            href="#"
            className="hidden sm:inline-flex items-center space-x-1 text-[#0a3d62] font-semibold hover:underline transition-colors"
          >
            <span>See all</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </a>
        </div>

        <div className="relative">
          <div className="flex overflow-x-auto hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-5 pb-4 sm:pb-0">
            {products.map((product, idx) => (
              <div
                key={product.id}
                className="shrink-0 w-[75vw] sm:w-auto sm:shrink"
                style={{
                  maxWidth: idx === products.length - 1 ? 'calc(75vw - 1rem)' : undefined,
                }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>

        <div className="sm:hidden mt-6 flex justify-center">
          <a
            href="#"
            className="inline-flex items-center space-x-1 text-[#0a3d62] font-semibold underline underline-offset-2"
          >
            <span>See all products</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}

export default ProductSection
