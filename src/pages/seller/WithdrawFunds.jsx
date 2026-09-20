import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { PasswordField } from '../../components/profile/Sheet'

const WithdrawFunds = () => {
  const navigate = useNavigate()
  const { seller, getSellerWithdrawals, requestSellerWithdrawal, getSellerPayoutMethods, hasTransactionPassword, verifyTransactionPassword } = useAuth()
  const [amount, setAmount] = useState('')
  const [pin, setPin] = useState('')
  const [message, setMessage] = useState('')

  const available = Number(seller.balance || 0)
  const guarantee = Number(seller.guarantee || 0)
  const payoutMethods = getSellerPayoutMethods(seller.id)
  const hasPayoutMethod = payoutMethods.length > 0
  const parsedAmount = parseFloat(amount || '0')
  const canApply = hasPayoutMethod && parsedAmount > 0 && parsedAmount <= available && !seller.withdrawalsBlocked && (!hasTransactionPassword || pin !== '')

  const recentRequests = getSellerWithdrawals(seller.id)

  const [messageOk, setMessageOk] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const submitWithdrawal = async () => {
    if (submitting) return
    setSubmitting(true)
    if (hasTransactionPassword) {
      const check = await verifyTransactionPassword(pin)
      if (!check.success) {
        setSubmitting(false)
        setMessage(check.error)
        setMessageOk(false)
        return
      }
    }
    const result = await requestSellerWithdrawal(seller.id, parsedAmount, payoutMethods[0])
    setSubmitting(false)
    setMessage(result.success ? 'Withdrawal submitted for admin review.' : result.error)
    setMessageOk(result.success)
    if (result.success) {
      setAmount('')
      setPin('')
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 text-gray-700 transition-colors mb-2"
          aria-label="Back"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Withdraw funds</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Request a payout from your shop balance
        </p>
      </div>

      <div className="space-y-5">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#011829] via-[#042c4b] to-[#0a4d7a] p-6 lg:p-8 text-white shadow-lg">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-sky-400/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex items-start space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-sky-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-200/90 mb-2">
                Available Balance
              </p>
              <p className="text-4xl lg:text-5xl font-bold tracking-tight">
                ${available.toFixed(2)}
              </p>
              <div className="inline-flex items-center space-x-1.5 mt-4 text-sm text-sky-100/80">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Guarantee money: ${guarantee.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-start justify-between p-5 lg:p-6 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Payout methods</h2>
              <p className="text-sm text-gray-500 mt-1">
                Save your bank account or USDT wallet for fast payouts.
              </p>
            </div>
            <button type="button" onClick={() => navigate('/seller/profile')} className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-900 font-semibold rounded-xl shadow-sm transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add</span>
            </button>
          </div>

          {payoutMethods.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-5">
                <svg className="w-9 h-9 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <p className="text-base font-semibold text-gray-900 mb-1.5">
                No payout methods yet
              </p>
              <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
                Add a bank account or crypto wallet to receive funds.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {payoutMethods.map((m) => (
                <div key={m.id} className="p-5 lg:p-6">
                  <p className="font-semibold">{m.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-start space-x-3 p-5 lg:p-6 border-b border-gray-100">
            <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">New withdrawal</h2>
              <p className="text-sm text-gray-500 mt-1">
                Your admin will review and approve the payout.
              </p>
            </div>
          </div>

          <div className="p-5 lg:p-6 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                Amount (USD)
              </label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-900 select-none">
                  $
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 text-2xl font-bold text-gray-900 bg-white border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-[#0a3d62] focus:ring-4 focus:ring-[#0a3d62]/10 transition-all placeholder-gray-300"
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-sm">
                <span className="text-gray-500 font-medium">
                  Available: <span className="text-gray-900 font-semibold">${available.toFixed(2)}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setAmount(String(available.toFixed(2)))}
                  className="text-[#0a3d62] font-semibold hover:text-[#0f4c81] transition-colors"
                >
                  Use max
                </button>
              </div>
            </div>

            {seller.withdrawalsBlocked ? (
              <div className="flex items-start space-x-3 p-4 border border-rose-200 rounded-2xl bg-rose-50">
                <svg className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                <p className="text-sm font-medium text-rose-700">
                  Withdrawals are currently blocked by admin for your store. Contact support for details.
                </p>
              </div>
            ) : !hasPayoutMethod && (
              <div className="flex items-start space-x-3 p-4 border border-dashed border-gray-200 rounded-2xl bg-gray-50/60">
                <svg className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm font-medium text-gray-600">
                  Add a payout method above before submitting a withdrawal.
                </p>
              </div>
            )}

            {hasTransactionPassword ? (
              <PasswordField label="Transaction password" value={pin} onChange={setPin} hint="Enter the transaction password you set in Profile → Security to confirm this withdrawal." />
            ) : (
              !seller.impersonated && (
                <p className="text-sm text-gray-500">
                  Protect your withdrawals with a transaction password.{' '}
                  <button type="button" onClick={() => navigate('/seller/profile')} className="font-semibold text-[#0a3d62] underline underline-offset-2 hover:text-[#0f4c81]">
                    Set one up in Profile → Security
                  </button>
                </p>
              )
            )}

            <button
              type="button"
              disabled={!canApply || submitting}
              onClick={submitWithdrawal}
              className={`w-full py-4 font-semibold rounded-2xl text-lg transition-all duration-200 ${
                canApply
                  ? 'bg-gradient-to-r from-[#0a3d62] to-[#1a6fb0] hover:from-[#0f4c81] hover:to-[#2b7fc0] text-white shadow-lg shadow-[#0a3d62]/20 hover:shadow-xl hover:shadow-[#0a3d62]/30'
                  : 'bg-slate-400 text-white cursor-not-allowed shadow-none'
              }`}
            >
              Apply for withdrawal
            </button>
            {message && <p className={`text-center text-sm font-bold ${messageOk ? 'text-emerald-700' : 'text-rose-700'}`}>{message}</p>}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-start justify-between p-5 lg:p-6 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Recent requests</h2>
              <p className="text-sm text-gray-500 mt-1">
                Your latest 20 withdrawal requests.
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          {recentRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-5">
                <svg className="w-9 h-9 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-base font-semibold text-gray-900 mb-1.5">
                No withdrawals yet
              </p>
              <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
                Submit your first request above.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentRequests.map((r) => (
                <div key={r.id} className="p-5 lg:p-6">
                  <p className="font-semibold">${r.amount.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WithdrawFunds
