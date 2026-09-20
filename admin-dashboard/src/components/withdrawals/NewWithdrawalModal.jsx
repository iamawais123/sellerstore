import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Avatar, FieldLabel, Icon, ModalShell, NETWORKS, inputClass, isOnline, maskAccount, money } from './shared'

// A seller can only be picked when a withdrawal could actually be filed for them.
const unavailableReason = (shop) => {
  if (shop.deleted) return 'Account deleted'
  if (shop.suspended) return 'Account suspended'
  if (shop.withdrawalsBlocked) return 'Withdrawals blocked'
  if (!(Number(shop.balance) > 0)) return 'No balance to withdraw'
  return ''
}

// Searchable seller dropdown. Hovering the closed picker, or an option, turns it orange.
const SellerSelect = ({ sellers, value, onChange }) => {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [active, setActive] = useState(0)
  const rootRef = useRef(null)
  const searchRef = useRef(null)

  const selected = sellers.find((shop) => shop.id === value)

  const matches = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return sellers
    return sellers.filter((shop) => [shop.shopName, shop.fullName, shop.ownerName, shop.email].some((part) => String(part || '').toLowerCase().includes(needle)))
  }, [sellers, search])

  useEffect(() => {
    if (!open) return undefined
    const close = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  useEffect(() => {
    if (open) searchRef.current?.focus()
  }, [open])

  useEffect(() => setActive(0), [search])

  const openMenu = () => {
    setSearch('')
    setActive(0)
    setOpen((current) => !current)
  }

  const choose = (shop) => {
    if (unavailableReason(shop)) return
    onChange(shop.id)
    setOpen(false)
  }

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((index) => Math.min(index + 1, matches.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (matches[active]) choose(matches[active])
    } else if (event.key === 'Escape') {
      event.stopPropagation()
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={openMenu}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors hover:border-[#f2a93b] hover:bg-[#f2a93b] focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/20 ${
          open ? 'border-[#f2a93b] bg-[#f2a93b]' : 'border-slate-200 bg-white'
        }`}
      >
        {selected ? (
          <>
            <Avatar name={selected.shopName || selected.fullName} className="h-8 w-8 text-sm" online={isOnline(selected)} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-slate-900">{selected.shopName || selected.fullName}</span>
              <span className="block truncate text-xs text-slate-600">{selected.email}</span>
            </span>
          </>
        ) : (
          <span className="flex-1 text-sm text-slate-500">Search seller by name or email...</span>
        )}
        <Icon name="select" className="h-4 w-4 shrink-0 text-slate-500" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-20 mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-100 px-3.5 py-2.5">
            <Icon name="search" className="h-4 w-4 text-slate-400" />
            <input
              ref={searchRef}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search by shop, name, or email..."
              className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
            />
          </div>
          <ul role="listbox" className="max-h-56 overflow-y-auto p-1.5">
            {matches.length === 0 && <li className="px-3 py-6 text-center text-sm text-slate-500">No sellers found.</li>}
            {matches.map((shop, index) => {
              const reason = unavailableReason(shop)
              const online = isOnline(shop)
              return (
                <li key={shop.id} role="option" aria-selected={shop.id === value} aria-disabled={!!reason}>
                  <button
                    type="button"
                    onClick={() => choose(shop)}
                    onMouseEnter={() => setActive(index)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                      reason ? 'cursor-not-allowed opacity-50' : active === index ? 'bg-[#f2a93b]' : ''
                    }`}
                  >
                    <Avatar name={shop.shopName || shop.fullName} className="h-8 w-8 text-sm" online={online} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900">{shop.shopName || shop.fullName}</span>
                      <span className="block truncate text-[11px] text-slate-600">{shop.email}</span>
                      <span className="block text-[11px] font-medium text-slate-600">
                        {reason ? (
                          reason
                        ) : (
                          <>
                            <span className={online ? 'font-semibold text-emerald-700' : ''}>{online ? 'Online' : `Active ${shop.lastActive}`}</span>
                            {' · '}
                            {money(shop.balance)} available
                          </>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

const Segmented = ({ options, value, onChange }) => (
  <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
    {options.map(([id, label]) => (
      <button
        key={id}
        type="button"
        onClick={() => onChange(id)}
        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${value === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
      >
        {label}
      </button>
    ))}
  </div>
)

const Toggle = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-[#0a3d62]' : 'bg-slate-300'}`}
  >
    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
  </button>
)

const EMPTY_BANK = { bankName: '', holderName: '', accountNumber: '', routingNumber: '' }
const EMPTY_CRYPTO = { network: NETWORKS[0][0], walletAddress: '' }

const NewWithdrawalModal = ({ onClose, onCreated }) => {
  const { admin, getSellersForAdmin, getSellerPayoutMethods, initiateWithdrawal } = useAuth()
  const [sellerId, setSellerId] = useState('')
  const [mode, setMode] = useState('saved') // 'saved' | 'new'
  const [savedId, setSavedId] = useState('')
  const [kind, setKind] = useState('bank') // 'bank' | 'crypto'
  const [bank, setBank] = useState(EMPTY_BANK)
  const [crypto, setCrypto] = useState(EMPTY_CRYPTO)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [notify, setNotify] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const sellers = getSellersForAdmin(admin.id)
    .filter((shop) => !shop.deleted)
    .sort((a, b) => String(a.shopName || a.fullName).localeCompare(String(b.shopName || b.fullName)))
  const seller = sellers.find((shop) => shop.id === sellerId)
  const saved = seller ? getSellerPayoutMethods(seller.id) : []
  const available = Number(seller?.balance || 0)

  // Picking a seller resets the payout choice to that seller's own methods.
  const pickSeller = (id) => {
    setSellerId(id)
    setMode('saved')
    setSavedId('')
    setError('')
  }

  const chosenSaved = saved.find((method) => method.id === savedId) || saved.find((method) => method.isDefault) || saved[0]

  const payout = useMemo(() => {
    if (!seller) return null
    if (mode === 'saved') return chosenSaved || null
    const trim = (value) => String(value || '').trim()
    if (kind === 'bank') {
      const holderName = trim(bank.holderName)
      const accountNumber = trim(bank.accountNumber)
      if (!holderName || !accountNumber) return null
      const bankName = trim(bank.bankName)
      const routingNumber = trim(bank.routingNumber)
      return {
        type: 'bank',
        label: bankName || 'Bank account',
        holderName,
        accountNumber,
        ...(bankName && { bankName }),
        ...(routingNumber && { routingNumber }),
      }
    }
    const walletAddress = trim(crypto.walletAddress)
    return walletAddress ? { type: 'crypto', label: crypto.network, network: crypto.network, walletAddress } : null
  }, [seller, mode, chosenSaved, kind, bank, crypto])

  const value = Number(amount)
  const amountValid = amount !== '' && Number.isFinite(value) && value > 0
  const overBalance = amountValid && value > available + 0.004
  const canSubmit = !!seller && !!payout && amountValid && !overBalance && !busy

  const submit = async () => {
    if (!canSubmit) return
    setBusy(true)
    setError('')
    const result = await initiateWithdrawal(seller.id, { amount: value, method: payout, note: note.trim(), notify })
    setBusy(false)
    if (!result.success) {
      setError(result.error || 'Could not create the withdrawal.')
      return
    }
    onCreated(`Withdrawal of ${money(value)} filed for ${seller.shopName || seller.fullName} — pending review`)
    onClose()
  }

  const bankField = (key, label, props = {}) => (
    <div className={props.wide ? 'col-span-2' : ''}>
      <FieldLabel tiny>{label}</FieldLabel>
      <input
        value={bank[key]}
        onChange={(event) => setBank({ ...bank, [key]: event.target.value })}
        placeholder={props.placeholder}
        maxLength={props.maxLength || 80}
        className={`${inputClass} ${props.mono ? 'font-mono' : ''}`}
        autoComplete="off"
      />
    </div>
  )

  return (
    <ModalShell
      title="Initiate Withdrawal Request"
      subtitle="File a withdrawal on behalf of a seller. It enters the pending queue."
      icon="cash"
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50">
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300 disabled:shadow-none"
          >
            {busy ? 'Processing…' : 'Confirm & Process'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <FieldLabel>Seller</FieldLabel>
          <SellerSelect sellers={sellers} value={sellerId} onChange={pickSeller} />
          {seller && (
            <div className="mt-1.5 flex items-center justify-between text-xs">
              <span className="truncate text-slate-500">{seller.email}</span>
              <span className="shrink-0 text-slate-500">
                Available: <span className="font-bold text-slate-900">{money(available)}</span>
              </span>
            </div>
          )}
        </div>

        {seller && (
          <div>
            <FieldLabel>Payout method</FieldLabel>
            <Segmented
              value={mode}
              onChange={setMode}
              options={[
                ['saved', `Use saved (${saved.length})`],
                ['new', 'Enter new'],
              ]}
            />

            {mode === 'saved' && (
              <div className="mt-3">
                {saved.length === 0 ? (
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-xs text-slate-600">
                    This seller has no saved payout methods. Switch to{' '}
                    <button type="button" onClick={() => setMode('new')} className="font-bold text-slate-900 hover:underline">
                      Enter new
                    </button>
                    .
                  </p>
                ) : (
                  <div className="space-y-2">
                    {saved.map((method) => {
                      const on = chosenSaved?.id === method.id
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setSavedId(method.id)}
                          className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors ${on ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}
                        >
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${on ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                            <Icon name={method.type === 'crypto' ? 'wallet' : 'bank'} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-slate-900">{method.label}</span>
                            <span className="block truncate text-xs text-slate-500">
                              {method.type === 'crypto' ? method.walletAddress : [method.holderName, maskAccount(method.accountNumber)].filter(Boolean).join(' · ')}
                            </span>
                          </span>
                          {method.isDefault && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">Default</span>}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {mode === 'new' && (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ['bank', 'Bank', 'bank'],
                    ['crypto', 'Crypto', 'wallet'],
                  ].map(([id, label, icon]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setKind(id)}
                      className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                        kind === id ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon name={icon} />
                      {label}
                    </button>
                  ))}
                </div>

                {kind === 'bank' ? (
                  <div className="grid grid-cols-2 gap-3">
                    {bankField('bankName', 'Bank name', { placeholder: 'e.g. Chase' })}
                    {bankField('holderName', 'Account holder*', { placeholder: 'Full name' })}
                    {bankField('accountNumber', 'Account number*', { placeholder: '•••• •••• ••••', mono: true, wide: true, maxLength: 40 })}
                    {bankField('routingNumber', 'Routing / IFSC / SWIFT', { placeholder: 'Optional', mono: true, wide: true, maxLength: 40 })}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <FieldLabel tiny>Network</FieldLabel>
                      <select value={crypto.network} onChange={(event) => setCrypto({ ...crypto, network: event.target.value })} className={inputClass}>
                        {NETWORKS.map(([id, label]) => (
                          <option key={id} value={id}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <FieldLabel tiny>Wallet address*</FieldLabel>
                      <input
                        value={crypto.walletAddress}
                        onChange={(event) => setCrypto({ ...crypto, walletAddress: event.target.value })}
                        placeholder="Paste the wallet address"
                        maxLength={120}
                        className={`${inputClass} font-mono`}
                        autoComplete="off"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div>
          <FieldLabel>Amount</FieldLabel>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">$</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
              className={`${inputClass} pl-8 font-semibold ${overBalance ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10' : ''}`}
            />
          </div>
          {seller && (
            <p className={`mt-1.5 text-xs font-semibold ${overBalance ? 'text-rose-600' : 'text-emerald-600'}`}>
              {overBalance ? `Exceeds the available balance of ${money(available)}` : `Available Balance: ${money(available)}`}
            </p>
          )}
        </div>

        <div>
          <FieldLabel>Note (optional)</FieldLabel>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={240}
            rows={3}
            placeholder="e.g. Requested via WhatsApp on 25 Apr"
            className={`${inputClass} resize-y`}
          />
          <p className="mt-1 text-right text-[11px] text-slate-400">{note.length}/240</p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Icon name="bell" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-slate-900">Notify seller</span>
            <span className="block text-xs text-slate-500">Send a notification about this withdrawal</span>
          </span>
          <Toggle checked={notify} onChange={setNotify} label="Notify seller" />
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700">
            {error}
          </p>
        )}
      </div>
    </ModalShell>
  )
}

export default NewWithdrawalModal
