import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const AdminSupport = () => {
  const { getSupportConversations, getAdminNotifications, sendSupportMessage, markSupportRead, archiveSupportConversation } = useAuth()
  const [params, setParams] = useSearchParams()
  const [selectedId, setSelectedId] = useState(params.get('c'))
  const [tab, setTab] = useState('active')
  const [search, setSearch] = useState('')
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const listRef = useRef(null)

  const all = getSupportConversations('admin')
  const term = search.trim().toLowerCase()
  const conversations = all
    .filter((item) => item.status === tab)
    .filter((item) => !term || `${item.seller.shopName} ${item.seller.fullName} ${item.seller.email}`.toLowerCase().includes(term))
  const selected = all.find((item) => item.id === selectedId)
  const unreadIn = (status) => all.filter((item) => item.status === status).reduce((sum, item) => sum + (item.unreadForAdmin || 0), 0)
  const unreadNotes = selected
    ? getAdminNotifications().filter((item) => item.sellerId === selected.sellerId && item.type === 'chat' && !item.read).length
    : 0

  const select = (id) => {
    setSelectedId(id)
    setError('')
    // A deep link (?c=…) only preselects; once the admin navigates, it has done its job.
    if (params.has('c')) setParams({}, { replace: true })
  }

  // Opened from a notification while already on this page.
  useEffect(() => {
    if (params.get('c')) setSelectedId(params.get('c'))
  }, [params])

  // Whatever arrives while a conversation is open counts as read.
  useEffect(() => {
    if (selected && (selected.unreadForAdmin || unreadNotes)) markSupportRead(selected.id, 'admin')
  }, [selected?.id, selected?.unreadForAdmin, unreadNotes])

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [selected?.id, selected?.messages.length])

  const send = async () => {
    const body = text.trim()
    if (!selected || !body || sending) return
    setSending(true)
    setError('')
    const result = await sendSupportMessage(selected.id, 'admin', body, selected.sellerId)
    setSending(false)
    if (result.success) setText('')
    else setError(result.error || 'Your message could not be sent. Please try again.')
  }

  const tabClass = (id) => `flex-1 rounded-xl py-3 font-bold ${tab === id ? 'bg-white shadow' : 'text-gray-500'}`
  const unreadPill = (count) =>
    count > 0 && <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">{count > 99 ? '99+' : count}</span>

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">Support inbox</p>
        <h1 className="mt-1 text-3xl font-black text-gray-900">Support</h1>
      </div>

      {selected ? (
        <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b p-4">
            <button onClick={() => select(null)} className="font-bold text-gray-600">
              ← Back to messages
            </button>
            <div>
              <p className="font-black">{selected.seller.shopName}</p>
              <p className="text-sm text-gray-500">{selected.seller.email}</p>
            </div>
            <button
              onClick={() => {
                archiveSupportConversation(selected.id)
                select(null)
              }}
              className="rounded-xl border px-3 py-2 text-sm font-bold"
            >
              Archive
            </button>
          </div>

          <div ref={listRef} className="flex h-[520px] flex-col gap-3 overflow-y-auto bg-gray-50 p-5">
            {selected.messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[75%] rounded-2xl px-4 py-3 ${message.sender === 'admin' ? 'ml-auto bg-indigo-600 text-white' : 'bg-white text-gray-800 shadow-sm'}`}
              >
                <p className="whitespace-pre-wrap break-words">{message.text}</p>
                <small className="mt-1 block opacity-60">{message.time}</small>
              </div>
            ))}
          </div>

          <div className="border-t bg-gray-50 p-4">
            {error && <p className="mb-2 text-sm font-semibold text-red-600">{error}</p>}
            <div className="flex gap-2">
              <input
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && send()}
                placeholder="Type a message..."
                className="flex-1 rounded-2xl border px-4 py-3"
              />
              <button onClick={send} disabled={sending || !text.trim()} className="rounded-2xl bg-indigo-600 px-5 font-black text-white disabled:opacity-50">
                Send
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search sellers..."
            className="w-full rounded-2xl border border-gray-100 bg-white px-5 py-3 shadow-sm"
          />
          <div className="flex rounded-2xl bg-gray-100 p-1">
            <button onClick={() => setTab('active')} className={tabClass('active')}>
              Active{unreadPill(unreadIn('active'))}
            </button>
            <button onClick={() => setTab('archived')} className={tabClass('archived')}>
              Archived{unreadPill(unreadIn('archived'))}
            </button>
          </div>

          <div className="divide-y overflow-hidden rounded-3xl border bg-white">
            {conversations.length === 0 && (
              <p className="p-8 text-center text-gray-500">
                {tab === 'active' ? 'No conversations yet. New sellers appear here as soon as they sign up.' : 'No archived conversations.'}
              </p>
            )}
            {conversations.map((conversation) => {
              const last = conversation.messages.at(-1)
              const unread = conversation.unreadForAdmin || 0
              return (
                <button key={conversation.id} onClick={() => select(conversation.id)} className="flex w-full items-center gap-4 p-5 text-left hover:bg-gray-50">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 font-black text-emerald-700">
                    {(conversation.seller.shopName || 'S').slice(0, 1)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block text-lg">
                      {conversation.seller.shopName} <small className="font-normal text-gray-400">· {conversation.seller.email}</small>
                    </strong>
                    <small className={`block truncate ${unread ? 'font-bold text-gray-900' : 'text-gray-500'}`}>{last?.text}</small>
                  </span>
                  <span className="flex flex-col items-end gap-1">
                    <span className="text-xs text-gray-400">{last?.time}</span>
                    {unread > 0 && <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">{unread}</span>}
                  </span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export default AdminSupport
