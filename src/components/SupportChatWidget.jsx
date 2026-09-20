import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'

const OPEN_EVENT = 'seller:open-support-chat'

// Lets any page (e.g. a chat notification) open the popup.
export const openSupportChat = () => window.dispatchEvent(new Event(OPEN_EVENT))

// The seller's support chat: a floating button with an unread badge that opens a popup thread with
// the admin's support. Everything is live from Firestore, so the admin's replies (and the welcome
// message every new seller starts with) appear the moment they are sent.
const SupportChatWidget = () => {
  const { seller, getSupportConversations, getSellerNotifications, sendSupportMessage, markSupportRead } = useAuth()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const listRef = useRef(null)

  // One conversation per seller.
  const conversation = getSupportConversations()[0]
  const messages = conversation?.messages || []
  const unread = conversation?.unreadForSeller || 0
  const unreadNotes = getSellerNotifications().filter((item) => item.type === 'chat' && !item.read).length

  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener(OPEN_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_EVENT, onOpen)
  }, [])

  // While the popup is open, whatever arrives counts as read (an admin peeking through "log in as
  // seller" must not read the seller's messages for them).
  useEffect(() => {
    if (open && conversation && (unread || unreadNotes) && !seller.impersonated) markSupportRead(conversation.id, 'seller')
  }, [open, conversation?.id, unread, unreadNotes])

  useEffect(() => {
    if (open && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [open, messages.length])

  const send = async () => {
    const body = text.trim()
    if (!body || sending) return
    setSending(true)
    setError('')
    const result = await sendSupportMessage(conversation?.id || null, 'seller', body)
    setSending(false)
    if (result.success) setText('')
    else setError(result.error || 'Your message could not be sent. Please try again.')
  }

  return (
    <>
      <button
        onClick={() => setOpen((value) => !value)}
        aria-label={unread ? `Open support chat, ${unread} unread message${unread === 1 ? '' : 's'}` : 'Open support chat'}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-500/30 transition hover:scale-105 hover:bg-emerald-600"
      >
        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-xs font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[min(620px,calc(100vh-7rem))] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-white px-5 py-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-xl font-black text-white">
                S
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-300" />
              </div>
              <div>
                <p className="font-black text-gray-900">Customer Support</p>
                <p className="text-xs font-semibold text-emerald-600">Typically replies in 5-10 min</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close support chat" className="rounded-xl p-2 text-2xl leading-none text-gray-400 hover:bg-gray-100">
              ×
            </button>
          </div>

          <div ref={listRef} className="flex flex-1 flex-col gap-3 overflow-y-auto bg-gray-50 p-4">
            {messages.length === 0 && (
              <p className="my-auto rounded-2xl bg-white p-4 text-center text-sm text-gray-500 shadow-sm">
                Send us a message and our support team will reply here.
              </p>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  message.sender === 'seller' ? 'ml-auto bg-indigo-600 text-white' : 'bg-white text-gray-800'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{message.text}</p>
                <small className="mt-1 block opacity-60">{message.time}</small>
              </div>
            ))}
          </div>

          <div className="border-t bg-white p-3">
            {error && <p className="mb-2 px-1 text-xs font-semibold text-red-600">{error}</p>}
            <div className="flex items-center gap-2">
              <input
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && send()}
                placeholder="Type a message..."
                className="min-w-0 flex-1 rounded-2xl bg-gray-100 px-4 py-3 text-sm focus:outline-none"
              />
              <button
                onClick={send}
                disabled={sending || !text.trim()}
                aria-label="Send message"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-600 text-white transition disabled:opacity-50"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default SupportChatWidget
