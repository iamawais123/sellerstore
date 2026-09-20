import { useState } from 'react'
import { GhostButton, Icon, Notice, OutlineButton, PrimaryButton, SectionLabel, Sheet, Spinner, inputClass } from './Sheet'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const AccountSheet = ({ seller, email, emailVerified, onClose, onSaveName, onChangeEmail, onSendVerification, onToast }) => {
  const [name, setName] = useState(seller.fullName || '')
  const [savingName, setSavingName] = useState(false)
  const [nameError, setNameError] = useState('')

  const [changing, setChanging] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [verifying, setVerifying] = useState(false)

  const nameChanged = name.trim() !== '' && name.trim() !== (seller.fullName || '')

  const saveName = async () => {
    if (!nameChanged || savingName) return
    setNameError('')
    setSavingName(true)
    const result = await onSaveName(name)
    setSavingName(false)
    if (result.success) onToast('Name updated')
    else setNameError(result.error)
  }

  const closeEmailForm = () => {
    setChanging(false)
    setNewEmail('')
    setEmailError('')
  }

  const sendConfirmation = async () => {
    const address = newEmail.trim()
    if (!EMAIL_PATTERN.test(address)) {
      setEmailError('Enter a valid email address.')
      return
    }
    setEmailError('')
    setSending(true)
    const result = await onChangeEmail(address)
    setSending(false)
    if (!result.success) {
      setEmailError(result.error)
      return
    }
    closeEmailForm()
    onToast('Confirmation link sent — check your new inbox to complete the change')
  }

  const sendVerification = async () => {
    setVerifying(true)
    const result = await onSendVerification()
    setVerifying(false)
    if (result.success) onToast('Verification link sent — check your inbox')
    else setEmailError(result.error)
  }

  return (
    <Sheet title="Account info" subtitle="Your email and account details." onClose={onClose}>
      <div>
        <SectionLabel icon="user" tone="blue">Your name</SectionLabel>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && saveName()}
            maxLength={80}
            aria-label="Your name"
            className={inputClass}
          />
          <button
            type="button"
            onClick={saveName}
            disabled={!nameChanged || savingName}
            aria-label="Save name"
            className="flex w-12 shrink-0 items-center justify-center rounded-xl bg-[#0a3d62] text-white transition hover:bg-[#0f4c81] disabled:cursor-not-allowed disabled:bg-[#0a3d62]/40"
          >
            {savingName ? <Spinner /> : <Icon name="save" />}
          </button>
        </div>
        <div className="mt-2">
          <Notice>{nameError}</Notice>
        </div>
      </div>

      <div>
        <SectionLabel icon="mail" tone="blue">Email address</SectionLabel>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50/60 px-3.5 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">{email}</p>
            {emailVerified ? (
              <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                <Icon name="shield" className="h-3 w-3" /> Verified
              </p>
            ) : (
              <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-amber-600">
                <Icon name="shieldAlert" className="h-3 w-3" /> Not verified
                <button type="button" onClick={sendVerification} disabled={verifying} className="ml-1 underline underline-offset-2 hover:text-amber-700 disabled:opacity-60">
                  {verifying ? 'Sending…' : 'Send verification link'}
                </button>
              </p>
            )}
          </div>
          {!changing && <OutlineButton onClick={() => setChanging(true)}>Change</OutlineButton>}
        </div>

        {changing && (
          <div className="mt-3 space-y-3">
            <p className="text-xs text-gray-500">
              We'll send a confirmation link to your <span className="font-semibold text-gray-700">new address</span>. Your sign-in email only changes once you open it, and you'll sign in with the new address afterwards.
            </p>
            <input
              type="email"
              value={newEmail}
              onChange={(event) => setNewEmail(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && sendConfirmation()}
              placeholder="new@example.com"
              autoComplete="email"
              aria-label="New email address"
              autoFocus
              className={inputClass}
            />
            <div className="flex items-center justify-end gap-2">
              <GhostButton onClick={closeEmailForm}>Cancel</GhostButton>
              <PrimaryButton icon="checkCircle" busy={sending} onClick={sendConfirmation}>
                Send confirmation
              </PrimaryButton>
            </div>
          </div>
        )}
        <div className="mt-2">
          <Notice>{emailError}</Notice>
        </div>
      </div>
    </Sheet>
  )
}

export default AccountSheet
