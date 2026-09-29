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

const formatBytes = (bytes) => {
  if (!bytes) return ''
  const kb = bytes / 1024
  return kb < 1024 ? `${Math.round(kb)} KB` : `${(kb / 1024).toFixed(1)} MB`
}

// A photo attached to a message — opens full-size in a new tab. The video/file branches are dead
// code for now (Composer only ever produces `type: 'image'`, since there's no Cloud Storage to put
// anything bigger in) but harmless to keep in case that changes later.
const Attachment = ({ attachment, mine }) => {
  if (attachment.type === 'image') {
    return (
      <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl">
        <img src={attachment.url} alt={attachment.name || 'Photo'} className="max-h-72 w-full object-cover" loading="lazy" />
      </a>
    )
  }
  if (attachment.type === 'video') {
    return (
      <video src={attachment.url} controls preload="metadata" className="max-h-72 w-full rounded-xl bg-black">
        Your browser can't play this video.
      </video>
    )
  }
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition ${mine ? 'border-white/25 hover:bg-white/10' : 'border-slate-200 hover:bg-slate-50'}`}
    >
      <Icon name="file" className={`h-6 w-6 shrink-0 ${mine ? 'text-white' : 'text-slate-500'}`} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{attachment.name || 'File'}</span>
        {attachment.size > 0 && <span className={`block text-xs ${mine ? 'text-indigo-200' : 'text-slate-400'}`}>{formatBytes(attachment.size)}</span>}
      </span>
      <Icon name="download" className={`h-4 w-4 shrink-0 ${mine ? 'text-white' : 'text-slate-400'}`} />
    </a>
  )
}

// One message: attachment and/or text, a hover menu (copy — plus edit/unsend for the admin's own
// messages), and, once unsent, a muted placeholder instead of its content.
const Bubble = ({ message, onEdit, onUnsend }) => {
  const mine = message.sender === 'admin'
  const [menu, setMenu] = useState(false)
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(message.text || '')
  const [confirmUnsend, setConfirmUnsend] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    if (!menu) return undefined
    const close = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setMenu(false)
        setConfirmUnsend(false)
      }
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

  const startEdit = () => {
    setDraft(message.text || '')
    setEditing(true)
    setMenu(false)
  }

  const saveEdit = async () => {
    const body = draft.trim()
    if (!body || busy) return
    setBusy(true)
    setError('')
    const result = await onEdit(message.id, body)
    setBusy(false)
    if (result?.success) setEditing(false)
    else setError(result?.error || 'Could not save this edit.')
  }

  const unsend = async () => {
    if (busy) return
    setBusy(true)
    const result = await onUnsend(message.id)
    setBusy(false)
    setConfirmUnsend(false)
    setMenu(false)
    if (!result?.success) setError(result?.error || 'Could not unsend this message.')
  }

  if (message.deleted) {
    return (
      <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[75%] rounded-2xl border border-dashed px-4 py-2.5 ${mine ? 'rounded-tr-md border-indigo-200 bg-indigo-50/60' : 'rounded-tl-md border-slate-200 bg-slate-50'}`}>
          <p className="flex items-center gap-1.5 text-[13px] italic text-slate-400">
            <Icon name="trash" className="h-3.5 w-3.5" />
            {mine ? 'You unsent this message' : 'This message was unsent'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`group flex items-start gap-1 ${mine ? 'flex-row-reverse' : ''}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${
          mine ? 'rounded-tr-md bg-indigo-600 text-white' : 'rounded-tl-md border border-slate-200 bg-white text-slate-800'
        }`}
      >
        {editing ? (
          <div className="min-w-[220px] space-y-2">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={Math.min(6, Math.max(2, draft.split('\n').length))}
              autoFocus
              className={`w-full resize-none rounded-lg px-2.5 py-2 text-[15px] font-medium leading-snug focus:outline-none focus:ring-2 ${
                mine ? 'bg-indigo-700/60 text-white placeholder-indigo-200 focus:ring-white/40' : 'bg-slate-50 text-slate-800 focus:ring-indigo-300'
              }`}
            />
            {error && <p className={`text-xs font-semibold ${mine ? 'text-rose-100' : 'text-rose-600'}`}>{error}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditing(false)
                  setError('')
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold ${mine ? 'text-indigo-100 hover:bg-white/10' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={busy || !draft.trim()}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold disabled:opacity-50 ${mine ? 'bg-white text-indigo-700' : 'bg-indigo-600 text-white'}`}
              >
                {busy ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {message.attachment && (
              <div className={message.text ? 'mb-2' : ''}>
                <Attachment attachment={message.attachment} mine={mine} />
              </div>
            )}
            {message.text && <p className="whitespace-pre-wrap break-words text-[15px] font-medium leading-snug">{message.text}</p>}
            {error && <p className={`mt-1 text-xs font-semibold ${mine ? 'text-rose-100' : 'text-rose-600'}`}>{error}</p>}
          </>
        )}
        {!editing && (
          <div className={`mt-1 flex items-center justify-end gap-1 text-[11px] ${mine ? 'text-indigo-200' : 'text-slate-400'}`}>
            {message.editedAt && <span className="italic">Edited</span>}
            <span>{message.time}</span>
            {mine && <Ticks read={message.read} className={`h-3.5 w-3.5 ${message.read ? 'text-sky-300' : ''}`} />}
          </div>
        )}
      </div>
      {!editing && (
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
            <div className="absolute left-0 top-7 z-10 w-44 overflow-hidden rounded-xl border border-slate-100 bg-white py-1 shadow-xl">
              {confirmUnsend ? (
                <div className="px-3 py-2">
                  <p className="mb-2 text-xs font-semibold text-slate-600">Unsend this message?</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={unsend} disabled={busy} className="flex-1 rounded-lg bg-rose-600 py-1.5 text-xs font-bold text-white disabled:opacity-50">
                      {busy ? 'Unsending…' : 'Yes, unsend'}
                    </button>
                    <button type="button" onClick={() => setConfirmUnsend(false)} className="flex-1 rounded-lg bg-slate-100 py-1.5 text-xs font-bold text-slate-600">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {message.text && (
                    <button type="button" onClick={copy} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50">
                      <Icon name={copied ? 'check' : 'copy'} className="h-4 w-4 text-slate-400" />
                      {copied ? 'Copied' : 'Copy text'}
                    </button>
                  )}
                  {mine && onEdit && (
                    <button type="button" onClick={startEdit} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50">
                      <Icon name="edit" className="h-4 w-4 text-slate-400" />
                      Edit
                    </button>
                  )}
                  {mine && onUnsend && (
                    <button type="button" onClick={() => setConfirmUnsend(true)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50">
                      <Icon name="trash" className="h-4 w-4" />
                      Unsend
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export const MessageList = ({ items, listRef, onEdit, onUnsend }) => (
  <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
    <div className="mx-auto flex max-w-3xl flex-col gap-2">
      {items.length === 0 && <p className="my-10 text-center text-sm text-slate-500">No messages yet. Say hello below.</p>}
      {items.map((item) =>
        item.type === 'day' ? <DateChip key={item.key} label={item.label} /> : <Bubble key={item.key} message={item.message} onEdit={onEdit} onUnsend={onUnsend} />
      )}
    </div>
  </div>
)

const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024

// A thumbnail/name chip for whatever is queued to send, shown above the text field until sent.
const PendingAttachment = ({ file, previewUrl, onRemove }) => (
  <div className="mx-auto mb-2 flex max-w-3xl items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
    {file.type.startsWith('image/') && previewUrl ? (
      <img src={previewUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
    ) : (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-slate-400">
        <Icon name={file.type.startsWith('video/') ? 'play' : 'file'} className="h-5 w-5" />
      </span>
    )}
    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700">{file.name}</span>
    <button type="button" onClick={onRemove} aria-label="Remove attachment" className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600">
      <Icon name="x" className="h-4 w-4" />
    </button>
  </div>
)

// The reply box: an auto-growing field (Enter sends, Shift+Enter starts a new line), emoji, a photo
// attach menu (gallery, or a direct "Take Photo" camera option), and send. Photos only, no video or
// other files — there's no Cloud Storage on the free plan, so an attachment has to be small enough
// to live inline in the message itself (see `compressImageToDataUrl` in core.js).
export const Composer = ({ value, onChange, onSend, sending, error, hint }) => {
  const fieldRef = useRef(null)
  const [emojis, setEmojis] = useState(false)
  const [attachMenu, setAttachMenu] = useState(false)
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [attachError, setAttachError] = useState('')
  const boxRef = useRef(null)
  const attachRef = useRef(null)
  const galleryInputRef = useRef(null)
  const cameraInputRef = useRef(null)

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

  useEffect(() => {
    if (!attachMenu) return undefined
    const close = (event) => {
      if (attachRef.current && !attachRef.current.contains(event.target)) setAttachMenu(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [attachMenu])

  // The preview thumbnail needs an object URL for as long as the file is queued, and no longer.
  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) {
      setPreviewUrl(null)
      return undefined
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

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

  const pickFile = (event) => {
    const picked = event.target.files?.[0]
    event.target.value = ''
    setAttachMenu(false)
    if (!picked) return
    if (picked.size > MAX_ATTACHMENT_BYTES) {
      setAttachError('That photo is larger than 25 MB.')
      return
    }
    setAttachError('')
    setFile(picked)
  }

  const canSend = !sending && (!!value.trim() || !!file)

  const send = () => {
    if (!canSend) return
    onSend(file)
    setFile(null)
    setAttachError('')
  }

  return (
    <div className="border-t border-slate-100 bg-white px-4 py-3 sm:px-6">
      {error && <p className="mb-2 text-sm font-semibold text-red-600">{error}</p>}
      {attachError && <p className="mb-2 text-sm font-semibold text-red-600">{attachError}</p>}
      {hint && <p className="mb-2 text-xs font-medium text-slate-400">{hint}</p>}
      {file && <PendingAttachment file={file} previewUrl={previewUrl} onRemove={() => setFile(null)} />}
      <div className="mx-auto flex max-w-3xl items-end gap-3">
        <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={pickFile} />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={pickFile} />
        <div ref={attachRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setAttachMenu((open) => !open)}
            aria-label="Attach a photo"
            className={`mb-0.5 flex h-11 w-11 items-center justify-center rounded-full transition ${attachMenu ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
          >
            <Icon name="paperclip" className="h-5 w-5" />
          </button>
          {attachMenu && (
            <div className="absolute bottom-full left-0 z-10 mb-2 w-52 overflow-hidden rounded-2xl border border-slate-100 bg-white py-1 shadow-xl">
              <button type="button" onClick={() => galleryInputRef.current?.click()} className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <Icon name="file" className="h-[18px] w-[18px] text-slate-400" />
                Choose photo
              </button>
              <button type="button" onClick={() => cameraInputRef.current?.click()} className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <Icon name="camera" className="h-[18px] w-[18px] text-slate-400" />
                Take photo
              </button>
            </div>
          )}
        </div>
        <div ref={boxRef} className="relative flex min-w-0 flex-1 items-end rounded-3xl border-2 border-indigo-300 bg-white px-4 py-1.5 transition focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10">
          <textarea
            ref={fieldRef}
            rows={1}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault()
                send()
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
          onClick={send}
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
