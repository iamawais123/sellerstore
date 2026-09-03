const Categories = ({ categories }) => {
  return (
    <section className="py-12 lg:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center space-x-3">
            <span className="w-1 h-8 bg-[#0a3d62] rounded-full" />
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Categories
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

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 lg:gap-5">
          {categories.map((category) => (
            <a
              key={category.id}
              href="#"
              className="group flex flex-col items-center"
            >
              <div
                className={`w-full aspect-square rounded-3xl ${category.bgColor} overflow-hidden mb-3 flex items-center justify-center p-2 group-hover:shadow-lg transition-shadow duration-300`}
              >
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 text-center leading-tight group-hover:text-[#0a3d62] transition-colors">
                {category.name}
              </h3>
            </a>
          ))}
        </div>

        <div className="sm:hidden mt-6 flex justify-center">
          <a
            href="#"
            className="inline-flex items-center space-x-1 text-[#0a3d62] font-semibold underline underline-offset-2"
          >
            <span>See all categories</span>
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

export default Categories
