import { useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { catalogCategories } from '../../data/masterCatalog'

const money = (value) => `$${Number(value || 0).toFixed(2)}`

const CatalogModal = ({ seller, onClose }) => {
  const { getMasterCatalog, getSellerShopProductIds, getSellerSlotInfo, addProductsToShop, quickAddRandomToShop } = useAuth()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All categories')
  const [selected, setSelected] = useState([])
  const [toast, setToast] = useState('')

  const catalog = getMasterCatalog()
  const existingIds = getSellerShopProductIds(seller.id)
  const slots = getSellerSlotInfo(seller.id)

  const available = useMemo(() => {
    const existingSet = new Set(existingIds)
    return catalog.filter((product) => (
      !existingSet.has(product.id) &&
      (category === 'All categories' || product.category === category) &&
      (!query.trim() || product.name.toLowerCase().includes(query.toLowerCase().trim()))
    ))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog, category, query, existingIds.join(',')])

  const toggle = (id) => setSelected((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id])

  const allSelected = available.length > 0 && available.every((product) => selected.includes(product.id))
  const toggleSelectAll = () => setSelected(allSelected ? [] : available.map((product) => product.id))

  const handleAddSelected = async () => {
    const result = await addProductsToShop(seller.id, selected)
    if (result.success) {
      setToast(`Added ${result.added} product${result.added === 1 ? '' : 's'} to your shop.`)
      setSelected([])
      setTimeout(onClose, 700)
    } else {
      setToast(result.error || 'Could not add products')
    }
  }

  const handleQuickAdd = async () => {
    const result = await quickAddRandomToShop(seller.id, 50)
    if (result.success) {
      setToast(`Quick-added ${result.added} random product${result.added === 1 ? '' : 's'} to your shop.`)
      setTimeout(onClose, 700)
    } else {
      setToast(result.error || 'Could not add products')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-gray-900/50 p-0 sm:p-4" onClick={onClose}>
      <div className="flex h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[32px] bg-white shadow-2xl sm:h-[85vh] sm:rounded-3xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-gray-100 p-5">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Catalog</h2>
            <p className="mt-1 text-gray-500">Browse the master catalog and add products to your shop.</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-2xl leading-none text-gray-400 hover:bg-gray-100">×</button>
        </div>

        <div className="space-y-3 border-b border-gray-100 p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products by name..." className="flex-1 rounded-2xl border-2 border-gray-100 bg-white px-5 py-3 focus:border-indigo-500 focus:outline-none" />
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-2xl border-2 border-gray-100 bg-white px-4 py-3 font-bold text-gray-700 focus:border-indigo-500 focus:outline-none">
              {catalogCategories.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-bold text-gray-500">Remaining slots: <span className="text-gray-900">{slots.remaining} / {slots.limit}</span></p>
            <button onClick={handleQuickAdd} className="rounded-xl bg-indigo-50 px-4 py-2 text-sm font-black text-indigo-700 hover:bg-indigo-100">✨ Quick add 50 random</button>
          </div>
          <label className="flex items-center gap-2 text-sm font-bold text-gray-600">
            <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
            Select all ({available.length})
          </label>
        </div>

        {toast && <p className="mx-5 mt-3 rounded-xl bg-emerald-50 p-3 text-center text-sm font-bold text-emerald-700">{toast}</p>}

        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {available.map((product) => {
              const isSelected = selected.includes(product.id)
              return (
                <button key={product.id} onClick={() => toggle(product.id)} className={`relative overflow-hidden rounded-2xl border-2 bg-white text-left transition ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-gray-100'}`}>
                  <span className={`absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 ${isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-200 bg-white/80'}`}>
                    {isSelected && <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </span>
                  <img src={product.image} alt={product.name} className="aspect-square w-full object-cover" />
                  <div className="p-2.5">
                    <p className="line-clamp-2 min-h-9 text-xs font-bold text-gray-900">{product.name}</p>
                  </div>
                </button>
              )
            })}
          </div>
          {!available.length && <p className="py-16 text-center font-bold text-gray-400">No products match your search.</p>}
        </div>

        {selected.length > 0 && (
          <div className="border-t border-gray-100 p-4">
            <button onClick={handleAddSelected} className="w-full rounded-2xl bg-indigo-600 px-5 py-4 font-black text-white hover:bg-indigo-700">
              Add {selected.length} selected product{selected.length === 1 ? '' : 's'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const SellerProducts = () => {
  const { seller, getSellerShopProductsFull, getSellerSlotInfo, removeProductFromShop } = useAuth()
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [removeError, setRemoveError] = useState('')

  const handleRemove = async (catalogId) => {
    const result = await removeProductFromShop(seller.id, catalogId)
    if (!result.success) {
      setRemoveError(result.error)
      setTimeout(() => setRemoveError(''), 4000)
    }
  }

  const slots = getSellerSlotInfo(seller.id)
  const products = getSellerShopProductsFull(seller.id)
  const visible = products.filter((product) => !query.trim() || product.name.toLowerCase().includes(query.toLowerCase().trim()))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">My Products</h1>
          <p className="mt-1 text-gray-500">{slots.used} of {slots.limit} slots used · {slots.remaining} remaining</p>
        </div>
        <button
          onClick={() => seller.verified && setCatalogOpen(true)}
          className="rounded-2xl bg-indigo-600 px-5 py-3 font-black text-white hover:bg-indigo-700"
        >
          + Add products
        </button>
      </div>

      {removeError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-center font-bold text-rose-700">{removeError}</div>
      )}

      {!seller.verified ? (
        <div className="flex items-start gap-4 rounded-3xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900">Your store is not verified yet</h2>
            <p className="mt-1 text-gray-600">Please complete verification first to start adding products to your store.</p>
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-gray-200 py-20 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 text-gray-300">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          </div>
          <p className="text-xl font-black text-gray-800">Your shop is empty</p>
          <p className="mt-2 text-gray-500">Add products from the master catalog to start reselling.</p>
          <button onClick={() => setCatalogOpen(true)} className="mt-6 rounded-2xl bg-indigo-600 px-6 py-3 font-black text-white hover:bg-indigo-700">+ Browse catalog</button>
        </div>
      ) : (
        <>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your products..." className="w-full rounded-2xl border-2 border-gray-100 bg-white px-5 py-3.5 shadow-sm focus:border-indigo-500 focus:outline-none" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {visible.map((product) => (
              <article key={product.id} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                <img src={product.image} alt={product.name} className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-bold text-gray-900">{product.name}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Cost {money(product.cost)}  Sell {money(product.sell)}  <span className="font-black text-emerald-600">↗ +{money(product.sell - product.cost)}</span>
                  </p>
                </div>
                {seller.allowProductRemoval !== false && (
                  <button onClick={() => handleRemove(product.id)} title="Remove from shop" className="shrink-0 rounded-xl p-2 text-gray-300 hover:bg-rose-50 hover:text-rose-600">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </article>
            ))}
          </div>
        </>
      )}

      {catalogOpen && <CatalogModal seller={seller} onClose={() => setCatalogOpen(false)} />}
    </div>
  )
}

export default SellerProducts
