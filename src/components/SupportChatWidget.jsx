import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'

const OPEN_EVENT = 'seller:open-support-chat'
const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024

// Lets any page (e.g. a chat notification) open the popup.
export const openSupportChat = () => window.dispatchEvent(new Event(OPEN_EVENT))

const formatBytes = (bytes) => {
  if (!bytes) return ''
  const kb = bytes / 1024
  return kb < 1024 ? `${Math.round(kb)} KB` : `${(kb / 1024).toFixed(1)} MB`
}

// A photo, video or generic file attached to a message.
const Attachment = ({ attachment }) => {
  if (attachment.type === 'image') {
    return (
      <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl">
        <img src={attachment.url} alt={attachment.name || 'Photo'} className="max-h-56 w-full object-cover" loading="lazy" />
      </a>
    )
  }
  if (attachment.type === 'video') {
    return (
      <video src={attachment.url} controls preload="metadata" className="max-h-56 w-full rounded-xl bg-black">
        Your browser can't play this video.
      </video>
    )
  }
  return (
    <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white/60 px-3 py-2">
      <svg className="h-5 w-5 shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14 2v6h6" />
      </svg>
      <span className="min-w-0 flex-1 truncate text-sm font-semibold">{attachment.name || 'File'}</span>
      {attachment.size > 0 && <span className="shrink-0 text-xs opacity-60">{formatBytes(attachment.size)}</span>}
    </a>
  )
}

// The seller's support chat: a floating button with an unread badge that opens a popup thread with
// the admin's support. Everything is live from Firestore, so the admin's replies (and the welcome
// message every new seller starts with) appear the moment they are sent.
const SupportChatWidget = () => {
  const { seller, getSupportConversations, getSellerNotifications, sendSupportMessage, markSupportRead } = useAuth()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [attachMenu, setAttachMenu] = useState(false)
  const listRef = useRef(null)
  const attachRef = useRef(null)
  const galleryInputRef = useRef(null)
  const cameraInputRef = useRef(null)

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

  useEffect(() => {
    if (!attachMenu) return undefined
    const close = (event) => {
      if (attachRef.current && !attachRef.current.contains(event.target)) setAttachMenu(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [attachMenu])

  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) {
      setPreviewUrl(null)
      return undefined
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const pickFile = (event) => {
    const picked = event.target.files?.[0]
    event.target.value = ''
    setAttachMenu(false)
    if (!picked) return
    if (picked.size > MAX_ATTACHMENT_BYTES) {
      setError('That photo is larger than 25 MB.')
      return
    }
    setError('')
    setFile(picked)
  }

  const send = async () => {
    const body = text.trim()
    if ((!body && !file) || sending) return
    setSending(true)
    setError('')
    const result = await sendSupportMessage(conversation?.id || null, 'seller', body, file)
    setSending(false)
    if (result.success) {
      setText('')
      setFile(null)
    } else setError(result.error || 'Your message could not be sent. Please try again.')
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
        <div className="fixed inset-0 z-50 flex h-full w-full flex-col overflow-hidden bg-white sm:inset-auto sm:bottom-24 sm:right-6 sm:h-[min(620px,calc(100vh-7rem))] sm:w-[min(390px,calc(100vw-2rem))] sm:rounded-3xl sm:border sm:border-gray-200 sm:shadow-2xl">
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
            {messages.map((message) =>
              message.deleted ? (
                <div key={message.id} className={`max-w-[82%] rounded-2xl border border-dashed border-gray-200 px-4 py-2.5 text-sm italic text-gray-400 ${message.sender === 'seller' ? 'ml-auto' : ''}`}>
                  This message was unsent
                </div>
              ) : (
                <div
                  key={message.id}
                  className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                    message.sender === 'seller' ? 'ml-auto bg-indigo-600 text-white' : 'bg-white text-gray-800'
                  }`}
                >
                  {message.attachment && (
                    <div className={message.text ? 'mb-2' : ''}>
                      <Attachment attachment={message.attachment} />
                    </div>
                  )}
                  {message.text && <p className="whitespace-pre-wrap break-words">{message.text}</p>}
                  <small className="mt-1 flex items-center gap-1.5 opacity-60">
                    {message.editedAt && <span className="italic">Edited</span>}
                    {message.time}
                  </small>
                </div>
              )
            )}
          </div>

          <div className="border-t bg-white p-3">
            {error && <p className="mb-2 px-1 text-xs font-semibold text-red-600">{error}</p>}
            {file && (
              <div className="mb-2 flex items-center gap-2.5 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2">
                {file.type.startsWith('image/') && previewUrl ? (
                  <img src={previewUrl} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
                ) : (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-gray-400">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14 2v6h6" />
                    </svg>
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-700">{file.name}</span>
                <button onClick={() => setFile(null)} aria-label="Remove attachment" className="shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={pickFile} />
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={pickFile} />
              <div ref={attachRef} className="relative shrink-0">
                <button
                  onClick={() => setAttachMenu((value) => !value)}
                  aria-label="Attach a photo"
                  className={`flex h-11 w-11 items-center justify-center rounded-full transition ${attachMenu ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                  </svg>
                </button>
                {attachMenu && (
                  <div className="absolute bottom-full left-0 z-10 mb-2 w-48 overflow-hidden rounded-2xl border border-gray-100 bg-white py-1 shadow-xl">
                    <button onClick={() => galleryInputRef.current?.click()} className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50">
                      Choose photo
                    </button>
                    <button onClick={() => cameraInputRef.current?.click()} className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50">
                      Take photo
                    </button>
                  </div>
                )}
              </div>
              <input
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && send()}
                placeholder="Type a message..."
                className="min-w-0 flex-1 rounded-2xl bg-gray-100 px-4 py-3 text-sm focus:outline-none"
              />
              <button
                onClick={send}
                disabled={sending || (!text.trim() && !file)}
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
