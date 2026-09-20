import { useState } from 'react'
import { GhostButton, Icon, Notice, OutlineButton, PasswordField, PrimaryButton, SectionLabel, Sheet } from './Sheet'

const SignInPassword = ({ onChangePassword, onToast }) => {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const update = (key) => (value) => setForm((current) => ({ ...current, [key]: value }))

  const close = () => {
    setOpen(false)
    setForm({ current: '', next: '', confirm: '' })
    setError('')
  }

  const submit = async () => {
    if (busy) return
    if (!form.current || !form.next || !form.confirm) return setError('Fill in all three fields.')
    if (form.next.length < 6) return setError('The new password must be at least 6 characters.')
    if (form.next !== form.confirm) return setError('The new passwords do not match.')
    if (form.next === form.current) return setError('Choose a password that is different from the current one.')
    setError('')
    setBusy(true)
    const result = await onChangePassword(form.current, form.next)
    setBusy(false)
    if (!result.success) return setError(result.error)
    close()
    onToast('Sign-in password updated')
  }

  return (
    <div>
      <SectionLabel icon="key" tone="orange">Sign-in password</SectionLabel>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
        >
          Change sign-in password
        </button>
      ) : (
        <div className="space-y-3">
          <PasswordField label="Current password" value={form.current} onChange={update('current')} autoComplete="current-password" />
          <PasswordField label="New password" value={form.next} onChange={update('next')} autoComplete="new-password" />
          <PasswordField label="Confirm new password" value={form.confirm} onChange={update('confirm')} autoComplete="new-password" />
          <Notice>{error}</Notice>
          <div className="flex items-center justify-end gap-2">
            <GhostButton onClick={close}>Cancel</GhostButton>
            <PrimaryButton icon="checkCircle" busy={busy} onClick={submit}>
              Update password
            </PrimaryButton>
          </div>
        </div>
      )}
    </div>
  )
}

const TransactionPassword = ({ isSet, statusError, onSave, onToast }) => {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  // Someone who forgot their transaction password can prove it is them with the sign-in password instead.
  const [useAccountPassword, setUseAccountPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const update = (key) => (value) => setForm((current) => ({ ...current, [key]: value }))

  const close = () => {
    setOpen(false)
    setForm({ current: '', next: '', confirm: '' })
    setUseAccountPassword(false)
    setError('')
  }

  const submit = async () => {
    if (busy) return
    if (isSet && !form.current) return setError(useAccountPassword ? 'Enter your sign-in password.' : 'Enter your current transaction password.')
    if (form.next.length < 4 || form.next.length > 32) return setError('Use 4 to 32 characters for the transaction password.')
    if (form.next !== form.confirm) return setError('The new passwords do not match.')
    setError('')
    setBusy(true)
    const result = await onSave({
      newPassword: form.next,
      currentPassword: useAccountPassword ? '' : form.current,
      accountPassword: useAccountPassword ? form.current : '',
    })
    setBusy(false)
    if (!result.success) return setError(result.error)
    close()
    onToast(isSet ? 'Transaction password updated' : 'Transaction password set')
  }

  return (
    <div>
      <SectionLabel icon="lock" tone="emerald">Transaction password</SectionLabel>
      <div
        className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 ${isSet ? 'border-emerald-200 bg-emerald-50/60' : 'border-amber-200 bg-amber-50/60'}`}
      >
        <p className={`flex items-center gap-2 text-sm font-medium ${isSet ? 'text-emerald-700' : 'text-amber-600'}`}>
          <Icon name={isSet ? 'shield' : 'shieldAlert'} />
          {isSet ? 'Transaction password is set' : 'Not set up yet'}
        </p>
        {!open && <OutlineButton onClick={() => setOpen(true)}>{isSet ? 'Change' : 'Set up'}</OutlineButton>}
      </div>
      {statusError && (
        <p className="mt-2 text-[11px] text-amber-700">We couldn't check whether a transaction password is set. Reload the page and try again.</p>
      )}

      {open && (
        <div className="mt-3 space-y-3">
          {isSet && (
            <div>
              <PasswordField
                label={useAccountPassword ? 'Sign-in password' : 'Current transaction password'}
                value={form.current}
                onChange={update('current')}
                autoComplete={useAccountPassword ? 'current-password' : 'off'}
              />
              <button
                type="button"
                onClick={() => {
                  setUseAccountPassword((current) => !current)
                  update('current')('')
                }}
                className="mt-1.5 text-[11px] font-medium text-[#0a3d62] underline underline-offset-2 hover:text-[#0f4c81]"
              >
                {useAccountPassword ? 'Use my current transaction password' : 'Forgot it? Use my sign-in password instead'}
              </button>
            </div>
          )}
          <PasswordField
            label="New transaction password"
            hint="Tip: a 4–6 digit PIN is fine — keep it memorable."
            value={form.next}
            onChange={update('next')}
          />
          <PasswordField label="Confirm new transaction password" value={form.confirm} onChange={update('confirm')} />
          <Notice>{error}</Notice>
          <div className="flex items-center justify-end gap-2">
            <GhostButton onClick={close}>Cancel</GhostButton>
            <PrimaryButton icon="checkCircle" busy={busy} onClick={submit}>
              {isSet ? 'Update password' : 'Set password'}
            </PrimaryButton>
          </div>
        </div>
      )}
    </div>
  )
}

const SecuritySheet = ({ hasTransactionPassword, statusError, onClose, onChangePassword, onSaveTransactionPassword, onToast }) => (
  <Sheet title="Security" subtitle="Manage login & transaction passwords." onClose={onClose}>
    <SignInPassword onChangePassword={onChangePassword} onToast={onToast} />
    <TransactionPassword isSet={hasTransactionPassword} statusError={statusError} onSave={onSaveTransactionPassword} onToast={onToast} />
  </Sheet>
)

export default SecuritySheet
