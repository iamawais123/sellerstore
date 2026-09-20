import { useState } from 'react'
import { useSuperAuth } from '../context/AuthContext'
import {
  CopyButton,
  Icon,
  Modal,
  PasswordFields,
  dangerButtonClass,
  ghostButtonClass,
  inputClass,
  labelClass,
  primaryButtonClass,
} from './ui'

export const AddAccountModal = ({ title, subtitle, icon, iconClass, submitLabel, successTitle, onSubmit, onClose }) => {
  const { generatePassword } = useSuperAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState(null)
  const [busy, setBusy] = useState(false)

  const generate = () => {
    const pw = generatePassword(14)
    setPassword(pw)
    setConfirm(pw)
    setShow(true)
    setError('')
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (password !== confirm) return setError('Passwords do not match')
    setBusy(true)
    const result = await onSubmit({ fullName, email, password })
    setBusy(false)
    if (!result.success) return setError(result.error)
    setCreated({ ...(result.admin || result.superAdmin), password })
  }

  if (created) {
    return (
      <Modal title={successTitle} subtitle="Share these sign-in details with them securely." icon="check" iconClass="bg-emerald-100 text-emerald-700" onClose={onClose}>
        <div className="space-y-3">
          {[
            ['Name', created.fullName],
            ['Email', created.email],
            ['Password', created.password],
            ['Invite code', created.inviteCode],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400">{label}</p>
                <p className="font-mono font-bold text-gray-900 truncate">{value}</p>
              </div>
              {label !== 'Name' && <CopyButton value={value} />}
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-6">
          <button onClick={onClose} className={primaryButtonClass}>Done</button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title={title} subtitle={subtitle} icon={icon} iconClass={iconClass} onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className={labelClass}>Full name</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Jordan Lee" className={inputClass} autoFocus />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Password</label>
          <PasswordFields
            value={password}
            onChange={setPassword}
            confirm={confirm}
            onConfirmChange={setConfirm}
            show={show}
            onToggleShow={() => setShow((v) => !v)}
            generate={generate}
          />
        </div>
        {error && <p className="text-rose-600 font-semibold text-sm">{error}</p>}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className={ghostButtonClass}>Cancel</button>
          <button type="submit" disabled={busy} className={`${primaryButtonClass}`}>
            <Icon name="user-plus" className="w-5 h-5" />
            {busy ? 'Creating…' : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export const SetPasswordModal = ({ title, subtitle, onSubmit, onClose }) => {
  const { generatePassword } = useSuperAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [busy, setBusy] = useState(false)

  const generate = () => {
    const pw = generatePassword(14)
    setPassword(pw)
    setConfirm(pw)
    setShow(true)
    setError('')
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (password !== confirm) return setError('Passwords do not match')
    setBusy(true)
    const result = await onSubmit(password)
    setBusy(false)
    if (!result.success) return setError(result.error)
    setSuccess(true)
  }

  return (
    <Modal title={title} subtitle={subtitle} icon="key" onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">
        <PasswordFields
          value={password}
          onChange={setPassword}
          confirm={confirm}
          onConfirmChange={setConfirm}
          show={show}
          onToggleShow={() => setShow((v) => !v)}
          generate={generate}
        />
        {error && <p className="text-rose-600 font-semibold text-sm">{error}</p>}
        {success && <p className="text-emerald-600 font-semibold text-sm">Password updated successfully.</p>}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className={ghostButtonClass}>Close</button>
          <button type="submit" disabled={!password || success || busy} className={primaryButtonClass}>{busy ? 'Updating…' : 'Update password'}</button>
        </div>
      </form>
    </Modal>
  )
}

export const ConfirmModal = ({ title, subtitle, icon = 'warn', iconClass = 'bg-rose-100 text-rose-600', confirmLabel, danger = true, onConfirm, onClose, children }) => {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const confirm = async () => {
    setError('')
    setBusy(true)
    const result = await onConfirm()
    setBusy(false)
    if (result && !result.success) return setError(result.error || 'Something went wrong')
    onClose()
  }

  return (
    <Modal title={title} subtitle={subtitle} icon={icon} iconClass={iconClass} onClose={onClose}>
      {children && <div className="text-gray-600 space-y-2 mb-2">{children}</div>}
      {error && <p className="text-rose-600 font-semibold text-sm mt-3">{error}</p>}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
        <button onClick={onClose} className={ghostButtonClass}>Cancel</button>
        <button onClick={confirm} disabled={busy} className={`${danger ? dangerButtonClass : primaryButtonClass}`}>{busy ? 'Working…' : confirmLabel}</button>
      </div>
    </Modal>
  )
}
