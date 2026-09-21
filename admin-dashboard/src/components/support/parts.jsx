import { useEffect, useRef, useState } from 'react'
import { money } from '../withdrawals/shared'
import { relativeTime } from '../../lib/activityFeed'
import { avatarTone, isOnline, lastSeenLabel, presenceText, shortThreadId } from '../../lib/supportChat'
import { Icon, Ticks } from './icons'

const EMOJIS = ['😀', '😊', '😉', '😍', '🙏', '👍', '👏', '🎉', '🔥', '✅', '👋', '🤝', '💬', '📦', '💰', '⏳', '❤️', '😅', '🙌', '😢']

// A soft-coloured initial (or the seller's own picture) with a green / grey presence dot.
export const SellerAvatar = ({ seller, online, className = 'h-11 w-11 text-lg', dot = 'h-3 w-3' }) => {
  const name = seller.shopName || seller.fullName || '?'
  return (
    <span className="relative inline-block shrink-0">
      {seller.avatar ? (
        <img src={seller.avatar} alt="" className={`rounded-full object-cover ${className}`} />
      ) : (
        <span className={`flex items-center justify-center rounded-full bg-gradient-to-br font-bold ${avatarTone(seller.id || name)} ${className}`}>
          {name.trim().charAt(0).toUpperCase()}
        </span>
      )}
      <span className={`absolute bottom-0 right-0 rounded-full border-2 border-white ${dot} ${online ? 'bg-emerald-500' : 'bg-slate-300'}`} />
    </span>
  )
}

// "● Online" or "Last seen 15:01".
const PresenceLabel = ({ shop, now, className = 'text-[11px]' }) =>
  isOnline(shop, now) ? (
    <span className={`inline-flex shrink-0 items-center gap-1 font-semibold text-emerald-600 ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Online
    </span>
  ) : (
    <span className={`shrink-0 text-slate-400 ${className}`}>Last seen {lastSeenLabel(shop, now)}</span>
  )

export const ConversationRow = ({ conversation, selected, pinned, now, onSelect }) => {
  const { seller } = conversation
  const last = conversation.messages.at(-1)
  const unread = conversation.unreadForAdmin || 0
  return (
    <button
      type="button"
      onClick={() => onSelect(conversation.id)}
      aria-current={selected ? 'true' : undefined}
      className={`flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3.5 text-left transition-colors ${selected ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}
    >
      <SellerAvatar seller={seller} online={isOnline(seller, now)} />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="min-w-0 truncate text-[14px] font-bold text-slate-900">
            {seller.shopName}
            {seller.email && <span className="font-normal text-slate-400"> · {seller.email}</span>}
          </span>
          <PresenceLabel shop={seller} now={now} />
        </span>
        <span className="mt-0.5 flex items-center justify-between gap-2">
          <span className={`min-w-0 truncate text-[13px] ${unread ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>
            {last ? `${last.sender === 'admin' ? 'You: ' : ''}${last.text}` : 'No messages yet'}
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            {pinned && <Icon name="pin" filled className="h-3 w-3 text-slate-400" />}
            {unread > 0 && (
              <span className="min-w-[1.25rem] rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[11px] font-bold leading-none text-white">{unread > 99 ? '99+' : unread}</span>
            )}
          </span>
        </span>
      </span>
    </button>
  )
}

const DateChip = ({ label }) => (
  <div className="my-3 flex justify-center">
    <span className="rounded-full bg-slate-200/70 px-3 py-1 text-xs font-semibold text-slate-500">{label}</span>
  </div>
)

// One message, with a hover menu (copy).
const Bubble = ({ message }) => {
  const mine = message.sender === 'admin'
  const [menu, setMenu] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!menu) return undefined
    const close = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setMenu(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menu])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.text)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
        setMenu(false)
      }, 900)
    } catch (_) {
      setMenu(false)
    }
  }

  return (
    <div className={`group flex items-start gap-1 ${mine ? 'flex-row-reverse' : ''}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${
          mine ? 'rounded-tr-md bg-indigo-600 text-white' : 'rounded-tl-md border border-slate-200 bg-white text-slate-800'
        }`}
      >
        <p className="whitespace-pre-wrap break-words text-[15px] font-medium leading-snug">{message.text}</p>
        <div className={`mt-1 flex items-center justify-end gap-1 text-[11px] ${mine ? 'text-indigo-200' : 'text-slate-400'}`}>
          <span>{message.time}</span>
          {mine && <Ticks read={message.read} className={`h-3.5 w-3.5 ${message.read ? 'text-sky-300' : ''}`} />}
        </div>
      </div>
      <div ref={ref} className="relative mt-1.5">
        <button
          type="button"
          onClick={() => setMenu((open) => !open)}
          aria-label="Message options"
          className={`rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600 focus-visible:opacity-100 group-hover:opacity-100 ${menu ? 'opacity-100' : 'opacity-0'}`}
        >
          <Icon name="dots" className="h-4 w-4" strokeWidth={2.6} />
        </button>
        {menu && (
          <div className="absolute left-0 top-7 z-10 w-36 overflow-hidden rounded-xl border border-slate-100 bg-white py-1 shadow-xl">
            <button type="button" onClick={copy} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <Icon name={copied ? 'check' : 'copy'} className="h-4 w-4 text-slate-400" />
              {copied ? 'Copied' : 'Copy text'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export const MessageList = ({ items, listRef }) => (
  <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
    <div className="mx-auto flex max-w-3xl flex-col gap-2">
      {items.length === 0 && <p className="my-10 text-center text-sm text-slate-500">No messages yet. Say hello below.</p>}
      {items.map((item) => (item.type === 'day' ? <DateChip key={item.key} label={item.label} /> : <Bubble key={item.key} message={item.message} />))}
    </div>
  </div>
)

// The reply box: an auto-growing field (Enter sends, Shift+Enter starts a new line), emoji, and send.
export const Composer = ({ value, onChange, onSend, sending, error, hint }) => {
  const fieldRef = useRef(null)
  const [emojis, setEmojis] = useState(false)
  const boxRef = useRef(null)

  useEffect(() => {
    const field = fieldRef.current
    if (!field) return
    field.style.height = 'auto'
    field.style.height = `${Math.min(field.scrollHeight, 120)}px`
  }, [value])

  useEffect(() => {
    if (!emojis) return undefined
    const close = (event) => {
      if (boxRef.current && !boxRef.current.contains(event.target)) setEmojis(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [emojis])

  const insert = (emoji) => {
    const field = fieldRef.current
    const at = field?.selectionStart ?? value.length
    onChange(`${value.slice(0, at)}${emoji}${value.slice(field?.selectionEnd ?? at)}`)
    setEmojis(false)
    requestAnimationFrame(() => {
      field?.focus()
      field?.setSelectionRange(at + emoji.length, at + emoji.length)
    })
  }

  const canSend = !sending && !!value.trim()

  return (
    <div className="border-t border-slate-100 bg-white px-4 py-3 sm:px-6">
      {error && <p className="mb-2 text-sm font-semibold text-red-600">{error}</p>}
      {hint && <p className="mb-2 text-xs font-medium text-slate-400">{hint}</p>}
      <div className="mx-auto flex max-w-3xl items-end gap-3">
        <div ref={boxRef} className="relative flex min-w-0 flex-1 items-end rounded-3xl border-2 border-indigo-300 bg-white px-4 py-1.5 transition focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10">
          <textarea
            ref={fieldRef}
            rows={1}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault()
                if (canSend) onSend()
              }
            }}
            placeholder="Type a message..."
            aria-label="Type a message"
            maxLength={2000}
            className="max-h-[120px] min-w-0 flex-1 resize-none bg-transparent py-2 text-[15px] text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          <button type="button" onClick={() => setEmojis((open) => !open)} aria-label="Insert emoji" className="mb-1 ml-2 shrink-0 rounded-full p-1 text-slate-400 hover:text-indigo-600">
            <Icon name="smile" className="h-5 w-5" />
          </button>
          {emojis && (
            <div className="absolute bottom-full right-0 z-10 mb-2 grid w-64 grid-cols-5 gap-1 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl">
              {EMOJIS.map((emoji) => (
                <button key={emoji} type="button" onClick={() => insert(emoji)} className="rounded-lg p-1.5 text-xl hover:bg-slate-100">
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          aria-label="Send message"
          className={`mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white transition ${canSend ? 'bg-indigo-600 shadow-lg shadow-indigo-500/30 hover:bg-indigo-700' : 'cursor-not-allowed bg-slate-300'}`}
        >
          <Icon name="send" className="h-5 w-5 rotate-90" />
        </button>
      </div>
    </div>
  )
}

const KYC_TONE = {
  Approved: 'bg-emerald-50 text-emerald-700',
  Rejected: 'bg-rose-50 text-rose-700',
  Pending: 'bg-amber-50 text-amber-700',
}

const accountState = (seller) => (seller.deleted ? ['Deleted', 'bg-rose-50 text-rose-700'] : seller.suspended ? ['Suspended', 'bg-amber-50 text-amber-700'] : ['Active', 'bg-slate-100 text-slate-600'])

const Row = ({ icon, label, children, caption }) => (
  <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3.5">
    <span className="flex shrink-0 items-center gap-3 pt-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
      <Icon name={icon} className="h-[18px] w-[18px]" />
      {label}
    </span>
    <span className="min-w-0 text-right">
      <span className="block break-words text-[13px] font-semibold text-slate-800">{children}</span>
      {caption && <span className="mt-0.5 block text-[11px] font-medium text-slate-400">{caption}</span>}
    </span>
  </div>
)

const CopyEmail = ({ email }) => {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (_) {}
  }
  return (
    <button type="button" onClick={copy} aria-label="Copy email" title="Copy email" className="shrink-0 text-slate-400 hover:text-indigo-600">
      <Icon name={copied ? 'check' : 'copy'} className="h-3.5 w-3.5" />
    </button>
  )
}

// Everything the admin wants to know about who they are talking to; the location and device are the
// seller's live ones (see resolvePresence).
export const SellerPanel = ({ conversation, presence, pinned, now, onPin, onArchive, onOpenProfile, onClose }) => {
  const { seller } = conversation
  const online = isOnline(seller, now)
  const [account, accountTone] = accountState(seller)
  const kyc = seller.kyc?.status || (seller.verified ? 'Approved' : 'Pending')
  const rating = Number(seller.rating ?? 5)
  const archived = conversation.status === 'archived'

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-white">
      <div className="flex items-center justify-between px-4 pt-4">
        <button type="button" onClick={onClose} aria-label="Close details" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 xl:invisible">
          <Icon name="x" className="h-[18px] w-[18px]" />
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPin}
            aria-label={pinned ? 'Unpin conversation' : 'Pin conversation'}
            aria-pressed={pinned}
            title={pinned ? 'Unpin' : 'Pin to top'}
            className={`rounded-lg p-1.5 hover:bg-slate-100 ${pinned ? 'text-indigo-600' : 'text-slate-400'}`}
          >
            <Icon name="pin" filled={pinned} className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            onClick={onArchive}
            aria-label={archived ? 'Move back to Active' : 'Archive conversation'}
            title={archived ? 'Move back to Active' : 'Archive'}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
          >
            <Icon name={archived ? 'inbox' : 'archive'} className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center px-5 pb-5 pt-1 text-center">
        <SellerAvatar seller={seller} online={online} className="h-[88px] w-[88px] text-4xl" dot="h-4 w-4" />
        <h2 className="mt-3 max-w-full break-words text-lg font-black text-slate-900">{seller.shopName}</h2>
        <p className="text-sm font-medium text-slate-500">{seller.fullName}</p>
        <p className={`mt-0.5 text-sm font-semibold ${online ? 'text-emerald-600' : 'text-slate-400'}`}>{presenceText(seller, now)}</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold">
          <span className={`rounded-full px-2 py-0.5 ${KYC_TONE[kyc] || KYC_TONE.Pending}`}>KYC · {kyc}</span>
          <span className={`rounded-full px-2 py-0.5 ${accountTone}`}>{account}</span>
          <span className="text-amber-500">
            ★ <span className="text-slate-700">{rating.toFixed(2)}</span>
          </span>
        </div>
      </div>

      <div className="px-5">
        <Row icon="mail" label="Email">
          {seller.email ? (
            <span className="inline-flex max-w-full items-center justify-end gap-1.5">
              <span className="truncate" title={seller.email}>
                {seller.email}
              </span>
              <CopyEmail email={seller.email} />
            </span>
          ) : (
            '—'
          )}
        </Row>
        <Row icon="phone" label="Phone">
          {seller.phone || '—'}
        </Row>
        <Row
          icon="mapPin"
          label="Location"
          caption={
            presence.location || presence.ip
              ? `${online ? 'Live' : 'Last known'}${presence.ip ? ` · IP ${presence.ip}` : ''}${!online && presence.at ? ` · ${relativeTime(presence.at, now)}` : ''}`
              : 'Appears once they open their store'
          }
        >
          {presence.location ? (
            <span className="inline-flex items-center justify-end gap-1.5">
              {online && (
                <span className="relative flex h-2 w-2" title="Live location">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
              )}
              {presence.location}
            </span>
          ) : (
            '—'
          )}
        </Row>
        <Row icon="card" label="Balance">
          {money(seller.balance)}
        </Row>
        <Row icon="monitor" label="Device">
          {presence.device || '—'}
        </Row>
      </div>

      <div className="mt-auto px-5 pb-5 pt-5">
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-800 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
        >
          Open full profile
          <Icon name="external" className="h-4 w-4" />
        </button>
        <p className="mt-3 text-center text-[11px] font-medium text-slate-400">Thread ID: {shortThreadId(conversation.id)}</p>
      </div>
    </div>
  )
}
