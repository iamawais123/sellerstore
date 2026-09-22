import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { allProducts, categories } from '../data/data'

const SERIF = { fontFamily: 'Georgia, "Times New Roman", serif' }

const Sparkle = () => (
  <svg className="w-3.5 h-3.5 text-amber-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2zm7 11l.9 2.6L22.5 16.5l-2.6.9L19 20l-.9-2.6-2.6-.9 2.6-.9L19 13zM5 14l.9 2.6 2.6.9-2.6.9L5 21l-.9-2.6L1.5 17.5l2.6-.9L5 14z" />
  </svg>
)

const CategoryTile = ({ category, count }) => (
  <Link
    to={`/shop?category=${encodeURIComponent(category.name)}`}
    className="group flex flex-col items-center focus:outline-none"
    aria-label={`${category.name}, ${count} products`}
  >
    <div className="relative w-full aspect-square overflow-hidden rounded-3xl bg-gray-100 ring-1 ring-black/5 shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:ring-2 group-hover:ring-[#0a3d62] group-focus-visible:ring-2 group-focus-visible:ring-[#0a3d62]">
      <img
        src={category.image}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
        {count.toLocaleString('en-US')}
      </span>
      <span className="absolute bottom-4 left-1/2 hidden -translate-x-1/2 translate-y-2 items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-900 opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 sm:inline-flex">
        Shop now
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </span>
    </div>
    <h3 className="mt-3 text-center text-sm font-semibold leading-tight text-gray-900 transition-colors group-hover:text-[#0a3d62] sm:text-base">
      {category.name}
    </h3>
  </Link>
)

const Categories = () => {
  const tiles = useMemo(() => {
    const counts = new Map()
    for (const product of allProducts) counts.set(product.category, (counts.get(product.category) || 0) + 1)
    return categories.filter((c) => c.id > 1).map((category) => ({ category, count: counts.get(category.name) || 0 }))
  }, [])

  return (
    <div className="bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#031a33] via-[#04294d] to-[#0a4675] text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.09) 1px, transparent 1px)', backgroundSize: '26px 26px' }}
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-amber-300/10 blur-3xl" aria-hidden="true" />

        <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-24 lg:py-[6.5rem]">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/90 backdrop-blur">
            <Sparkle />
            Explore collections
          </span>
          <h1 className="mt-6 text-[2.6rem] leading-tight sm:text-6xl lg:text-7xl" style={SERIF}>
            <em className="bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text pr-1 text-transparent">Shop</em> by Category
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/80 sm:mt-5 sm:text-lg">
            Browse our curated collections — find exactly what you love, faster.
          </p>
          <span className="mt-8 h-0.5 w-20 rounded-full bg-gradient-to-r from-transparent via-amber-400 to-transparent" aria-hidden="true" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0a3d62]">{tiles.length} collections</p>
        <h2 className="mb-8 mt-1 text-3xl italic text-gray-900 sm:mb-10 sm:text-4xl" style={SERIF}>
          All Categories
        </h2>

        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-8 md:grid-cols-4 lg:grid-cols-5 lg:gap-x-6 xl:grid-cols-6">
          {tiles.map(({ category, count }) => (
            <CategoryTile key={category.id} category={category} count={count} />
          ))}
        </div>
      </section>
    </div>
  )
}

export default Categories
