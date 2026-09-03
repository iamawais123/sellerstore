import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { allProducts, categories as catData } from '../data/data'

const PAGE_SIZE = 15
const TOTAL_PAGES_SHOWN = 417

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'reviews', label: 'Most Reviews' },
]

const Shop = () => {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''

  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState('newest')
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(10000)
  const [appliedMin, setAppliedMin] = useState(0)
  const [appliedMax, setAppliedMax] = useState(10000)
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
  }, [selectedCategory, sortBy, query, appliedMin, appliedMax])

  const sidebarCategories = catData.filter(c => c.name !== 'All')

  const filteredProducts = useMemo(() => {
    let list = [...allProducts]
    if (query) {
      const q = query.toLowerCase()
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
    }
    if (selectedCategory !== 'All') {
      list = list.filter(p => p.category === selectedCategory || p.name.toLowerCase().includes(selectedCategory.toLowerCase()))
    }
    list = list.filter(p => p.price >= appliedMin && p.price <= appliedMax)

    switch (sortBy) {
      case 'price-low':
        list.sort((a, b) => a.price - b.price); break
      case 'price-high':
        list.sort((a, b) => b.price - a.price); break
      case 'rating':
        list.sort((a, b) => b.rating - a.rating); break
      case 'reviews':
        list.sort((a, b) => b.reviewCount - a.reviewCount); break
      default:
        list.sort((a, b) => b.id - a.id)
    }
    return list
  }, [query, selectedCategory, sortBy, appliedMin, appliedMax])

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE))
  const pageItems = filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const applyPrice = () => {
    setAppliedMin(Number(minPrice) || 0)
    setAppliedMax(Number(maxPrice) || 10000)
  }

  const pagesToShow = useMemo(() => {
    const pages = []
    const last = Math.min(totalPages, TOTAL_PAGES_SHOWN)
    if (last <= 7) {
      for (let i = 1; i <= last; i++) pages.push(i)
    } else {
      pages.push(1)
      if (page > 3) pages.push('...')
      const start = Math.max(2, page - 1)
      const end = Math.min(last - 1, page + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (page < last - 2) pages.push('...')
      pages.push(last)
    }
    return pages
  }, [page, totalPages])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-64 shrink-0">
          <div className="sticky top-24 space-y-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Categories</h3>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => setSelectedCategory('All')}
                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === 'All'
                        ? 'bg-gray-100 text-[#0a3d62]'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    All
                  </button>
                </li>
                {sidebarCategories.slice(0, 22).map(c => (
                  <li key={c.id}>
                    <button
                      onClick={() => setSelectedCategory(c.name)}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        selectedCategory === c.name
                          ? 'bg-gray-100 text-[#0a3d62]'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {c.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Price range</h3>
              <div className="px-2">
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="50"
                  value={Math.min(maxPrice, 10000)}
                  onChange={e => setMaxPrice(e.target.value)}
                  className="w-full accent-[#0a3d62]"
                />
                <div className="flex items-center justify-between text-sm text-gray-500 mt-2">
                  <span>${appliedMin}</span>
                  <span>${appliedMax}</span>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-500">$</label>
                    <input
                      type="number"
                      value={minPrice}
                      min="0"
                      onChange={e => setMinPrice(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0a3d62]/20 focus:border-[#0a3d62]/30"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-500">$</label>
                    <input
                      type="number"
                      value={maxPrice}
                      min="0"
                      onChange={e => setMaxPrice(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0a3d62]/20 focus:border-[#0a3d62]/30"
                    />
                  </div>
                  <button
                    onClick={applyPrice}
                    className="w-full py-2.5 border border-gray-200 rounded-lg text-gray-900 font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <section className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <div className="flex items-baseline space-x-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">All Products</h1>
              <span className="text-gray-500">({filteredProducts.length})</span>
            </div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#0a3d62]/20 focus:border-[#0a3d62]/30"
            >
              {sortOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {pageItems.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-gray-500 mb-3">No products match your filters.</p>
              <button
                onClick={() => { setSelectedCategory('All'); setAppliedMin(0); setAppliedMax(10000); setMinPrice(0); setMaxPrice(10000) }}
                className="text-[#0a3d62] font-semibold underline underline-offset-2"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-5">
              {pageItems.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {filteredProducts.length > 0 && (
            <div className="flex items-center justify-center space-x-2 mt-12">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center space-x-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 font-semibold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Prev</span>
              </button>

              {pagesToShow.map((p, idx) =>
                p === '...' ? (
                  <span key={`dots-${idx}`} className="px-3 py-2 text-gray-400">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`min-w-[2.5rem] h-10 rounded-xl font-semibold text-sm transition-colors ${
                      page === p
                        ? 'bg-[#0a3d62] text-white'
                        : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center space-x-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 font-semibold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <span className="hidden sm:inline">Next</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default Shop
