import { useState } from 'react'
import { Avatar, Icon, ModalShell, StatusPill, describePayout, formatDateTime, inputClass, money } from './shared'

const MAX_MESSAGE = 1000

// The note a seller is sent about the decision; the admin can rewrite it before confirming.
const defaultMessage = (withdrawal, approve, reference) => {
  const amount = money(withdrawal.amount)
  if (!approve) {
    return `❌ Withdrawal Rejected\n\nYour withdrawal request of ${amount} was not approved. The amount has been returned to your shop balance.\n\nPlease contact support if you need more information.`
  }
  const payout = describePayout(withdrawal)
  const method = payout.rows[0]?.[1] || payout.title
  return [
    '✅ Withdrawal Approved',
    '',
    `Your withdrawal request of ${amount} has been successfully approved by our team.`,
    '',
    '💳 Status: Approved and processing',
    `🏦 Payout method: ${method}`,
    ...(reference ? [`🔖 Reference: ${reference}`] : []),
    '',
    'The funds will reach your payout method shortly. Contact support if you have any questions.',
  ].join('\n')
}

const DetailRow = ({ icon, label, children, strong }) => (
  <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0">
    <span className="text-slate-400">
      <Icon name={icon} className="h-4 w-4" />
    </span>
    <span className="flex-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
    <span className={`text-right text-sm ${strong ? 'font-bold text-indigo-600' : 'font-medium text-slate-800'}`}>{children}</span>
  </div>
)

const PayoutCard = ({ withdrawal }) => {
  const payout = describePayout(withdrawal)
  const rows = payout.rows.filter(([, value]) => value)
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="flex items-center gap-2.5 bg-slate-50/70 px-4 py-2.5">
        <span className="text-indigo-500">
          <Icon name={payout.icon} className="h-4 w-4" />
        </span>
        <span className="flex-1 text-[11px] font-bold uppercase tracking-wider text-slate-700">{payout.title}</span>
        {payout.tag && <span className="text-[11px] font-medium text-slate-500">{payout.tag}</span>}
      </div>
      {rows.map(([label, value, style]) => (
        <div key={label} className="flex items-start justify-between gap-4 border-t border-slate-100 px-4 py-2.5">
          <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
          <span className={`min-w-0 text-right text-sm font-medium text-slate-800 ${style === 'mono' ? 'font-mono text-[13px]' : ''} ${style === 'break' ? 'break-all font-mono text-xs' : ''}`}>
            {value}
          </span>
        </div>
      ))}
    </div>
  )
}

// `withdrawal` is a request joined with its seller's shop (`withdrawal.seller`). `onProcess(approve,
// { reference, message })` resolves to `{ success, error }`, and `onDone` is told what to announce.
const ProcessWithdrawalModal = ({ withdrawal, onClose, onProcess, onDone }) => {
  const pending = withdrawal.status === 'Pending'
  const shop = withdrawal.seller
  const [step, setStep] = useState('review') // 'review' | 'approve' | 'reject'
  const [reference, setReference] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const goTo = (next) => {
    setError('')
    if (next !== 'review') setMessage(defaultMessage(withdrawal, next === 'approve', reference.trim()))
    setStep(next)
  }

  const confirm = async () => {
    if (busy) return
    const approve = step === 'approve'
    setBusy(true)
    setError('')
    const result = await onProcess(approve, { reference: reference.trim(), message: message.trim() })
    setBusy(false)
    if (!result.success) {
      setError(result.error || 'Could not process this withdrawal.')
      return
    }
    onDone(
      approve
        ? `Payout confirmed${reference.trim() ? ` — ref ${reference.trim()}` : ''}`
        : `Withdrawal rejected — ${money(withdrawal.amount)} returned to the seller's balance`
    )
    onClose()
  }

  const confirming = step !== 'review'
  const approving = step === 'approve'

  const footer = !pending ? (
    <button type="button" onClick={onClose} className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200">
      Close
    </button>
  ) : confirming ? (
    <>
      <button type="button" onClick={() => goTo('review')} disabled={busy} className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50">
        Back
      </button>
      <button
        type="button"
        onClick={confirm}
        disabled={busy}
        className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-60 ${approving ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
      >
        <Icon name={approving ? 'check' : 'x'} className="h-4 w-4" stroke={2.2} />
        {busy ? 'Saving…' : approving ? 'Confirm approval' : 'Confirm rejection'}
      </button>
    </>
  ) : (
    <>
      <button
        type="button"
        onClick={() => goTo('reject')}
        className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
      >
        <Icon name="x" className="h-4 w-4" stroke={2.2} />
        Reject
      </button>
      <button
        type="button"
        onClick={() => goTo('approve')}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-800"
      >
        <Icon name="check" className="h-4 w-4" stroke={2.2} />
        Confirm Payout
      </button>
    </>
  )

  return (
    <ModalShell title="Process withdrawal" subtitle="Review the request and confirm or reject the payout." onClose={onClose} busy={busy} footer={footer}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar name={shop?.shopName || withdrawal.shopName || withdrawal.sellerName} className="h-10 w-10 text-base" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-900">{shop?.shopName || withdrawal.shopName || withdrawal.sellerName}</p>
            <p className="truncate text-xs text-slate-500">{shop?.email || withdrawal.sellerName}</p>
          </div>
          <StatusPill status={withdrawal.status} />
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <DetailRow icon="cash" label="Amount" strong>
            {money(withdrawal.amount)}
          </DetailRow>
          <DetailRow icon="card" label="Seller balance">
            {money(shop?.balance)}
          </DetailRow>
          <DetailRow icon="calendar" label="Submitted">
            {formatDateTime(withdrawal.createdAt)}
          </DetailRow>
          {withdrawal.initiatedBy === 'admin' && (
            <DetailRow icon="user" label="Filed by">
              Admin, for the seller
            </DetailRow>
          )}
          {!pending && withdrawal.processedAt && (
            <DetailRow icon="clock" label={withdrawal.status === 'Completed' ? 'Approved' : 'Rejected'}>
              {formatDateTime(withdrawal.processedAt)}
            </DetailRow>
          )}
        </div>

        {withdrawal.note && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Note</p>
            <p className="whitespace-pre-line text-sm text-slate-700">{withdrawal.note}</p>
          </div>
        )}

        <PayoutCard withdrawal={withdrawal} />

        {pending && step !== 'reject' && (
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Transaction ID / Reference Hash</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Icon name="hash" className="h-4 w-4" />
              </span>
              <input
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                readOnly={approving}
                maxLength={200}
                placeholder="0x9f…  or  bank ref number"
                className={`${inputClass} pl-9 font-mono ${approving ? 'bg-slate-50' : ''}`}
                autoComplete="off"
                autoFocus={!approving}
              />
            </div>
            {!approving && <p className="mt-1.5 text-[11px] text-slate-500">Optional. Recorded for your internal audit trail.</p>}
          </div>
        )}

        {!pending && withdrawal.reference && (
          <div>
            <p className="mb-1.5 text-xs font-semibold text-slate-700">Transaction ID / Reference Hash</p>
            <p className="break-all rounded-xl bg-slate-50 px-3.5 py-2.5 font-mono text-sm text-slate-800">{withdrawal.reference}</p>
          </div>
        )}

        {confirming && (
          <div className={`rounded-xl border p-3 ${approving ? 'border-emerald-200 bg-emerald-50/60' : 'border-rose-200 bg-rose-50/60'}`}>
            <p className={`mb-2 text-xs font-semibold ${approving ? 'text-emerald-700' : 'text-rose-700'}`}>Message shown to seller (you can edit this)</p>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={MAX_MESSAGE}
              rows={5}
              autoFocus
              className={`${inputClass} resize-y ${approving ? 'focus:border-emerald-500 focus:ring-emerald-500/10' : 'focus:border-rose-500 focus:ring-rose-500/10'}`}
            />
            <p className="mt-1 text-right text-[11px] text-slate-400">
              {message.length}/{MAX_MESSAGE}
            </p>
          </div>
        )}

        {!pending && withdrawal.sellerMessage && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
            <p className="mb-1.5 text-xs font-semibold text-slate-700">Message sent to seller</p>
            <p className="whitespace-pre-line text-sm text-slate-700">{withdrawal.sellerMessage}</p>
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700">
            {error}
          </p>
        )}
      </div>
    </ModalShell>
  )
}

export default ProcessWithdrawalModal
