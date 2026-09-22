import { Link } from 'react-router-dom'

const Arrow = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
)

const Categories = ({ categories }) => {
  return (
    <section className="py-10 sm:py-12 lg:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6 sm:mb-10">
          <div className="flex items-center gap-3">
            <span className="w-1 h-8 bg-[#0a3d62] rounded-full" />
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Categories</h2>
          </div>
          <Link
            to="/categories"
            className="inline-flex items-center gap-1 text-[#0a3d62] font-semibold hover:underline transition-colors"
          >
            <span>See all</span>
            <Arrow />
          </Link>
        </div>

        <div className="grid grid-cols-3 min-[440px]:grid-cols-4 sm:grid-cols-5 xl:grid-cols-10 gap-x-3 gap-y-5 sm:gap-4 lg:gap-5">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/shop?category=${encodeURIComponent(category.name)}`}
              className="group flex flex-col items-center"
            >
              <div
                className={`w-full aspect-square rounded-2xl sm:rounded-3xl ${category.bgColor} overflow-hidden mb-2 sm:mb-3 flex items-center justify-center p-1 sm:p-2 group-hover:shadow-lg transition-shadow duration-300`}
              >
                <img
                  src={category.image}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover rounded-xl sm:rounded-2xl group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-gray-900 text-center leading-tight group-hover:text-[#0a3d62] transition-colors">
                {category.name}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Categories
