import { useState, useMemo, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { allProducts, categories as catData } from '../data/data'

const PAGE_SIZE = 15

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'reviews', label: 'Most Reviews' },
]
const SORT_VALUES = sortOptions.map((o) => o.value)

// Slider ceiling follows the catalogue so the most expensive products are never filtered out by default.
const PRICE_MAX = Math.ceil(Math.max(...allProducts.map((p) => p.price)) / 50) * 50

const categoryCounts = (() => {
  const counts = new Map()
  for (const p of allProducts) counts.set(p.category, (counts.get(p.category) || 0) + 1)
  return counts
})()

const sidebarCategories = catData.filter((c) => c.name !== 'All')

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const FilterPanel = ({ selectedCategory, onSelectCategory, minPrice, maxPrice, setMinPrice, setMaxPrice, appliedMin, appliedMax, onApplyPrice }) => (
  <div className="space-y-8">
    <div>
      <h3 className="text-lg font-bold text-gray-900 mb-3">Categories</h3>
      <ul className="space-y-1">
        {[{ id: 'all', name: 'All', count: allProducts.length }, ...sidebarCategories.map((c) => ({ ...c, count: categoryCounts.get(c.name) || 0 }))].map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onSelectCategory(c.name)}
              aria-pressed={selectedCategory === c.name}
              className={`w-full flex items-center justify-between gap-2 text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === c.name ? 'bg-gray-100 text-[#0a3d62]' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{c.name}</span>
              <span className="text-xs font-normal text-gray-400">{c.count.toLocaleString('en-US')}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>

    <div>
      <h3 className="text-lg font-bold text-gray-900 mb-3">Price range</h3>
      <div className="px-1">
        <input
          type="range"
          min="0"
          max={PRICE_MAX}
          step="50"
          value={Math.min(Number(maxPrice) || 0, PRICE_MAX)}
          onChange={(e) => setMaxPrice(e.target.value)}
          aria-label="Maximum price"
          className="w-full accent-[#0a3d62]"
        />
        <div className="flex items-center justify-between text-sm text-gray-500 mt-2">
          <span>${appliedMin}</span>
          <span>${appliedMax}</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-500">
            <span>$</span>
            <input
              type="number"
              inputMode="numeric"
              value={minPrice}
              min="0"
              aria-label="Minimum price"
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full min-w-0 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0a3d62]/20 focus:border-[#0a3d62]/30"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-500">
            <span>$</span>
            <input
              type="number"
              inputMode="numeric"
              value={maxPrice}
              min="0"
              aria-label="Maximum price value"
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full min-w-0 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0a3d62]/20 focus:border-[#0a3d62]/30"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={onApplyPrice}
          className="mt-3 w-full py-2.5 border border-gray-200 rounded-lg text-gray-900 font-semibold hover:bg-gray-50 transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  </div>
)

const Chip = ({ children, onRemove, label }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0a3d62]/5 border border-[#0a3d62]/15 pl-3 pr-1.5 py-1 text-sm font-medium text-[#0a3d62]">
    {children}
    <button
      type="button"
      onClick={onRemove}
      aria-label={label}
      className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-[#0a3d62]/10"
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </span>
)

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = (searchParams.get('q') || '').trim()
  const selectedCategory = searchParams.get('category') || 'All'
  const sortParam = searchParams.get('sort')
  const sortBy = SORT_VALUES.includes(sortParam) ? sortParam : 'newest'

  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(PRICE_MAX)
  const [appliedMin, setAppliedMin] = useState(0)
  const [appliedMax, setAppliedMax] = useState(PRICE_MAX)
  const [page, setPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const listTop = useRef(null)
  const firstPage = useRef(true)

  const updateParams = (patch) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(patch).forEach(([key, value]) => {
      if (!value || value === 'All' || (key === 'sort' && value === 'newest')) next.delete(key)
      else next.set(key, value)
    })
    setSearchParams(next)
  }

  useEffect(() => {
    setPage(1)
  }, [selectedCategory, sortBy, query, appliedMin, appliedMax])

  // Bring the top of the results into view when the page changes (not on first load).
  useEffect(() => {
    if (firstPage.current) {
      firstPage.current = false
      return
    }
    const top = listTop.current
    if (top) window.scrollTo({ top: Math.max(0, top.getBoundingClientRect().top + window.scrollY - 100), behavior: 'smooth' })
  }, [page])

  useEffect(() => {
    document.body.style.overflow = filtersOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [filtersOpen])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setFiltersOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const filteredProducts = useMemo(() => {
    let list = [...allProducts]
    if (query) {
      const q = query.toLowerCase()
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
    }
    if (selectedCategory !== 'All') {
      const needle = selectedCategory.toLowerCase()
      // Imported products carry their real category, so they never match on a name keyword.
      list = list.filter((p) => p.category === selectedCategory || (!p.hasStoredData && p.name.toLowerCase().includes(needle)))
    }
    list = list.filter((p) => p.price >= appliedMin && p.price <= appliedMax)

    switch (sortBy) {
      case 'price-low':
        list.sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        list.sort((a, b) => b.price - a.price)
        break
      case 'rating':
        list.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
        break
      case 'reviews':
        list.sort((a, b) => b.reviewCount - a.reviewCount)
        break
      default:
        list.sort((a, b) => b.id - a.id)
    }
    return list
  }, [query, selectedCategory, sortBy, appliedMin, appliedMax])

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE))
  const pageItems = filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const applyPrice = () => {
    const lo = Math.max(0, Number(minPrice) || 0)
    let hi = Number(maxPrice)
    if (!Number.isFinite(hi) || hi <= 0) hi = PRICE_MAX
    setAppliedMin(Math.min(lo, hi))
    setAppliedMax(Math.max(lo, hi))
    setMinPrice(Math.min(lo, hi))
    setMaxPrice(Math.max(lo, hi))
  }

  const priceActive = appliedMin > 0 || appliedMax < PRICE_MAX
  const activeCount = (selectedCategory !== 'All' ? 1 : 0) + (query ? 1 : 0) + (priceActive ? 1 : 0)

  const resetPrice = () => {
    setAppliedMin(0)
    setAppliedMax(PRICE_MAX)
    setMinPrice(0)
    setMaxPrice(PRICE_MAX)
  }

  const resetAll = () => {
    resetPrice()
    setSearchParams(sortBy === 'newest' ? {} : { sort: sortBy })
  }

  const pagesToShow = useMemo(() => {
    const pages = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (page > 3) pages.push('...')
      const start = Math.max(2, page - 1)
      const end = Math.min(totalPages - 1, page + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (page < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }, [page, totalPages])

  const heading = query ? `Results for “${query}”` : selectedCategory === 'All' ? 'All Products' : selectedCategory

  const panelProps = {
    selectedCategory,
    onSelectCategory: (name) => updateParams({ category: name }),
    minPrice,
    maxPrice,
    setMinPrice,
    setMaxPrice,
    appliedMin,
    appliedMax,
    onApplyPrice: applyPrice,
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="hidden lg:block lg:w-64 shrink-0" aria-label="Filters">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1 hide-scrollbar">
            <FilterPanel {...panelProps} />
          </div>
        </aside>

        <section className="flex-1 min-w-0" ref={listTop}>
          <div className="flex flex-col gap-4 mb-5">
            <div className="flex items-baseline gap-2 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">{heading}</h1>
              <span className="text-gray-500 shrink-0">({filteredProducts.length.toLocaleString('en-US')})</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="lg:hidden inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-900 font-semibold hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M6 12h12M10 20h4" />
                </svg>
                Filters
                {activeCount > 0 && (
                  <span className="min-w-[1.25rem] h-5 px-1 rounded-full bg-[#0a3d62] text-white text-xs font-bold flex items-center justify-center">
                    {activeCount}
                  </span>
                )}
              </button>
              <label className="flex-1 sm:flex-none sm:ml-auto">
                <span className="sr-only">Sort products</span>
                <select
                  value={sortBy}
                  onChange={(e) => updateParams({ sort: e.target.value })}
                  className="w-full sm:w-auto px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#0a3d62]/20 focus:border-[#0a3d62]/30"
                >
                  {sortOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </label>
            </div>

            {activeCount > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {selectedCategory !== 'All' && (
                  <Chip label={`Remove ${selectedCategory} filter`} onRemove={() => updateParams({ category: '' })}>{selectedCategory}</Chip>
                )}
                {query && (
                  <Chip label="Clear search" onRemove={() => updateParams({ q: '' })}>“{query}”</Chip>
                )}
                {priceActive && (
                  <Chip label="Clear price filter" onRemove={resetPrice}>${appliedMin} – ${appliedMax}</Chip>
                )}
                <button type="button" onClick={resetAll} className="text-sm font-semibold text-[#0a3d62] hover:underline ml-1">
                  Clear all
                </button>
              </div>
            )}
          </div>

          {pageItems.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-gray-500 mb-3">No products match your filters.</p>
              <button type="button" onClick={resetAll} className="text-[#0a3d62] font-semibold underline underline-offset-2">
                Reset all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {pageItems.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {filteredProducts.length > 0 && totalPages > 1 && (
            <nav className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-10 sm:mt-12" aria-label="Pagination">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label="Previous page"
                className="flex items-center gap-1 px-3 sm:px-4 h-10 border border-gray-200 rounded-xl text-gray-900 font-semibold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Prev</span>
              </button>

              {pagesToShow.map((p, idx) =>
                p === '...' ? (
                  <span key={`dots-${idx}`} className="px-1 sm:px-2 text-gray-400">…</span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    aria-current={page === p ? 'page' : undefined}
                    className={`min-w-[2.25rem] sm:min-w-[2.5rem] h-10 px-2 rounded-xl font-semibold text-sm transition-colors ${
                      page === p ? 'bg-[#0a3d62] text-white' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                aria-label="Next page"
                className="flex items-center gap-1 px-3 sm:px-4 h-10 border border-gray-200 rounded-xl text-gray-900 font-semibold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <span className="hidden sm:inline">Next</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </nav>
          )}
        </section>
      </div>

      {/* Phone / tablet filter sheet */}
      <div className={`lg:hidden fixed inset-0 z-[75] ${filtersOpen ? '' : 'pointer-events-none'}`} aria-hidden={!filtersOpen}>
        <div
          onClick={() => setFiltersOpen(false)}
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${filtersOpen ? 'opacity-100' : 'opacity-0'}`}
        />
        <div
          role="dialog"
          aria-label="Filters"
          className={`absolute inset-x-0 bottom-0 max-h-[88vh] flex flex-col rounded-t-3xl bg-white shadow-2xl transition-transform duration-300 ease-out ${
            filtersOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="flex items-center justify-between px-5 h-14 border-b border-gray-100 shrink-0">
            <h2 className="text-lg font-bold text-gray-900">Filters</h2>
            <button type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters" className="p-2 -mr-2 rounded-full hover:bg-gray-100">
              <CloseIcon />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-5">
            <FilterPanel {...panelProps} />
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 py-4 border-t border-gray-100 shrink-0 bg-white pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={() => { resetAll(); setFiltersOpen(false) }}
              className="py-3 rounded-xl border border-gray-200 font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
            >
              Clear all
            </button>
            <button
              type="button"
              onClick={() => { applyPrice(); setFiltersOpen(false) }}
              className="py-3 rounded-xl bg-[#0a3d62] text-white font-semibold hover:bg-[#0f4c81] transition-colors"
            >
              Show {filteredProducts.length.toLocaleString('en-US')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Shop
