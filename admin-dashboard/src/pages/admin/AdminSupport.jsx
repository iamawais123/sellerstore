import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Icon } from '../../components/support/icons'
import { Composer, ConversationRow, MessageList, SellerAvatar, SellerPanel } from '../../components/support/parts'
import { filterConversations, isOnline, presenceText, resolvePresence, threadItems } from '../../lib/supportChat'

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || '')

// Re-renders every `ms`, so "Online" turns into "Last seen …" without any data arriving.
const useNow = (ms) => {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(timer)
  }, [ms])
  return now
}

// Pinned conversations are a per-admin convenience kept in this browser.
const usePins = (adminId) => {
  const key = `uss_support_pins_${adminId}`
  const [pins, setPins] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(key)) || []
    } catch (_) {
      return []
    }
  })
  const toggle = (id) =>
    setPins((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
      try {
        localStorage.setItem(key, JSON.stringify(next))
      } catch (_) {}
      return next
    })
  return [pins, toggle]
}

const AdminSupport = () => {
  const { admin, getSupportConversations, getAdminNotifications, sendSupportMessage, markSupportRead, archiveSupportConversation, sellerLoginHistory } = useAuth()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [selectedId, setSelectedId] = useState(params.get('c'))
  const [tab, setTab] = useState('active')
  const [search, setSearch] = useState('')
  const [drafts, setDrafts] = useState({})
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [showInfo, setShowInfo] = useState(false)
  const [pins, togglePin] = usePins(admin.id)
  const listRef = useRef(null)
  const searchRef = useRef(null)
  const now = useNow(30 * 1000)

  const all = getSupportConversations('admin')
  const selected = all.find((item) => item.id === selectedId)
  const unreadIn = (status) => all.filter((item) => item.status === status).reduce((sum, item) => sum + (item.unreadForAdmin || 0), 0)
  const unreadNotes = selected
    ? getAdminNotifications().filter((item) => item.sellerId === selected.sellerId && item.type === 'chat' && !item.read).length
    : 0

  // Each seller's latest real sign-in: the fallback place and device until their open storefront reports.
  const loginsBySeller = useMemo(() => {
    const map = new Map()
    sellerLoginHistory.forEach((entry) => map.set(entry.sellerId, [...(map.get(entry.sellerId) || []), entry]))
    return map
  }, [sellerLoginHistory])
  const presenceOf = (conversation) => resolvePresence(conversation.seller, loginsBySeller.get(conversation.sellerId) || [])

  const conversations = filterConversations(all, { tab, term: search, location: (item) => presenceOf(item).location }).sort(
    (a, b) => Number(pins.includes(b.id)) - Number(pins.includes(a.id))
  )
  const items = useMemo(() => threadItems(selected?.messages || [], selected?.unreadForSeller || 0), [selected?.messages, selected?.unreadForSeller])
  const text = drafts[selectedId] || ''

  const select = (id) => {
    setSelectedId(id)
    setError('')
    setShowInfo(false)
    // A deep link (?c=…) only preselects; once the admin navigates, it has done its job.
    if (params.has('c')) setParams({}, { replace: true })
  }

  // Opened from a notification while already on this page: show it in the tab it lives in.
  useEffect(() => {
    const id = params.get('c')
    if (!id) return
    setSelectedId(id)
    const target = all.find((item) => item.id === id)
    if (target) setTab(target.status)
  }, [params, all.length])

  // Whatever arrives while a conversation is open counts as read.
  useEffect(() => {
    if (selected && (selected.unreadForAdmin || unreadNotes)) markSupportRead(selected.id, 'admin')
  }, [selected?.id, selected?.unreadForAdmin, unreadNotes])

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [selected?.id, selected?.messages.length])

  // Ctrl/⌘ + K jumps to the search box.
  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const send = async () => {
    const body = text.trim()
    if (!selected || !body || sending) return
    setSending(true)
    setError('')
    const result = await sendSupportMessage(selected.id, 'admin', body, selected.sellerId)
    setSending(false)
    if (result.success) {
      setDrafts((current) => ({ ...current, [selected.id]: '' }))
      // Replying to an archived conversation brings it back to Active.
      if (selected.status === 'archived') setTab('active')
    } else setError(result.error || 'Your message could not be sent. Please try again.')
  }

  const toggleArchive = async () => {
    const archived = selected.status === 'archived'
    const result = await archiveSupportConversation(selected.id, !archived)
    if (result?.success === false) return setError(result.error || 'Could not update the conversation.')
    if (archived) setTab('active')
    else select(null)
  }

  const tabClass = (id) =>
    `flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition ${tab === id ? 'bg-white text-slate-900 shadow ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`
  const unreadPill = (count) =>
    count > 0 && <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">{count > 99 ? '99+' : count}</span>

  const presence = selected ? presenceOf(selected) : null

  return (
    <div className="relative -m-5 flex h-[calc(100vh-4.6rem)] min-h-[520px] overflow-hidden border-t border-slate-100 bg-white lg:-m-8">
      {/* sellers */}
      <section className={`w-full shrink-0 flex-col border-r border-slate-100 bg-white md:flex md:w-[320px] ${selected ? 'hidden' : 'flex'}`} aria-label="Conversations">
        <div className="space-y-3 p-4">
          <div className="relative">
            <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search sellers..."
              aria-label="Search sellers"
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-16 text-sm text-slate-900 placeholder-slate-400 transition focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-semibold text-slate-400">
              {isMac ? '⌘K' : 'Ctrl K'}
            </kbd>
          </div>
          <div className="flex rounded-2xl bg-slate-100 p-1">
            <button type="button" onClick={() => setTab('active')} className={tabClass('active')}>
              <Icon name="inbox" className="h-4 w-4" />
              Active
              {unreadPill(unreadIn('active'))}
            </button>
            <button type="button" onClick={() => setTab('archived')} className={tabClass('archived')}>
              <Icon name="archive" className="h-4 w-4" />
              Archived
              {unreadPill(unreadIn('archived'))}
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto border-t border-slate-100">
          {conversations.length === 0 && (
            <p className="p-8 text-center text-sm text-slate-500">
              {search.trim()
                ? 'No sellers match your search.'
                : tab === 'active'
                  ? 'No conversations yet. New sellers appear here as soon as they sign up.'
                  : 'No archived conversations.'}
            </p>
          )}
          {conversations.map((conversation) => (
            <ConversationRow
              key={conversation.id}
              conversation={conversation}
              selected={conversation.id === selectedId}
              pinned={pins.includes(conversation.id)}
              now={now}
              onSelect={select}
            />
          ))}
        </div>
      </section>

      {/* thread */}
      <section className={`min-w-0 flex-1 flex-col bg-slate-50/60 md:flex ${selected ? 'flex' : 'hidden'}`} aria-label="Conversation">
        {selected ? (
          <>
            {/* Where the details panel is not always on screen, its essentials live in a header. */}
            <div className="flex items-center gap-3 border-b border-slate-100 bg-white px-3 py-2.5 xl:hidden">
              <button type="button" onClick={() => select(null)} aria-label="Back to conversations" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 md:hidden">
                <Icon name="back" className="h-5 w-5" />
              </button>
              <SellerAvatar seller={selected.seller} online={isOnline(selected.seller, now)} className="h-9 w-9 text-base" dot="h-2.5 w-2.5" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900">{selected.seller.shopName}</p>
                <p className={`truncate text-xs font-semibold ${isOnline(selected.seller, now) ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {presenceText(selected.seller, now)}
                  {presence.location && <span className="font-medium text-slate-400"> · {presence.location}</span>}
                </p>
              </div>
              <button type="button" onClick={() => setShowInfo(true)} aria-label="Seller details" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
                <Icon name="info" className="h-5 w-5" />
              </button>
            </div>

            <MessageList items={items} listRef={listRef} />
            <Composer
              value={text}
              onChange={(value) => setDrafts((current) => ({ ...current, [selected.id]: value }))}
              onSend={send}
              sending={sending}
              error={error}
              hint={selected.status === 'archived' ? 'This conversation is archived. Sending a message moves it back to Active.' : ''}
            />
          </>
        ) : (
          <div className="m-auto max-w-xs px-6 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Icon name="chat" className="h-7 w-7" />
            </span>
            <p className="mt-4 text-base font-bold text-slate-900">Select a conversation</p>
            <p className="mt-1 text-sm text-slate-500">Pick a seller on the left to read their messages, reply, and see who they are and where they are right now.</p>
          </div>
        )}
      </section>

      {/* seller details: always visible on wide screens, a slide-over below that */}
      {selected && (
        <>
          {showInfo && <div className="absolute inset-0 z-10 bg-slate-900/30 xl:hidden" onClick={() => setShowInfo(false)} />}
          <aside
            className={`absolute inset-y-0 right-0 z-20 w-[min(340px,100%)] border-l border-slate-100 shadow-2xl xl:static xl:z-auto xl:w-[320px] xl:shrink-0 xl:shadow-none ${showInfo ? 'block' : 'hidden xl:block'}`}
            aria-label="Seller details"
          >
            <SellerPanel
              conversation={selected}
              presence={presence}
              pinned={pins.includes(selected.id)}
              now={now}
              onPin={() => togglePin(selected.id)}
              onArchive={toggleArchive}
              onOpenProfile={() => navigate(`/sellers?q=${encodeURIComponent(selected.seller.email || selected.seller.shopName || '')}`)}
              onClose={() => setShowInfo(false)}
            />
          </aside>
        </>
      )}
    </div>
  )
}

export default AdminSupport
