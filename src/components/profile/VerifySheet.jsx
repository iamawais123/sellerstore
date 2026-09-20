import { useState } from 'react'
import { prepareKycDocument } from '../../data/kycDocument'
import { Icon, Notice, PrimaryButton, SectionLabel, Sheet } from './Sheet'

const DOCUMENT_TYPES = [
  { id: 'national-id', label: 'National ID', icon: 'user' },
  { id: 'driving-licence', label: 'Driving licence', icon: 'card' },
  { id: 'passport', label: 'Passport', icon: 'doc' },
]

const STATUSES = {
  verified: {
    title: 'Verified',
    text: 'Your identity has been verified. You have full access to your seller features.',
    icon: 'shield',
    card: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    body: 'text-emerald-600',
  },
  review: {
    title: 'Under review',
    text: "Your document is queued for review. We'll notify you once it's processed.",
    icon: 'shieldAlert',
    card: 'border-amber-200 bg-amber-50 text-amber-700',
    body: 'text-amber-600',
  },
  rejected: {
    title: 'Rejected',
    text: "We couldn't approve your documents. Upload clear photos of a valid ID and submit them again.",
    icon: 'shieldAlert',
    card: 'border-rose-200 bg-rose-50 text-rose-700',
    body: 'text-rose-600',
  },
  none: {
    title: 'Not submitted',
    text: 'Upload a government-issued ID to unlock payouts and product listings.',
    icon: 'shieldAlert',
    card: 'border-gray-200 bg-gray-50 text-gray-700',
    body: 'text-gray-500',
  },
}

export const verificationState = (seller) => {
  const kyc = seller.kyc || {}
  if (seller.verified || kyc.status === 'Approved') return 'verified'
  if (kyc.status === 'Rejected') return 'rejected'
  return kyc.hasDocuments === true ? 'review' : 'none'
}

const UploadSlot = ({ label, file, onPick }) => (
  <div>
    <p className="mb-1.5 text-xs font-medium text-gray-600">{label}</p>
    <label className="group flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-gray-200 p-3 transition hover:border-[#0a3d62]/40 hover:bg-blue-50/40">
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={(event) => {
          const picked = event.target.files && event.target.files[0]
          if (picked) onPick(picked)
          event.target.value = ''
        }}
      />
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-400 transition group-hover:bg-blue-100 group-hover:text-[#0a3d62]">
        <Icon name="upload" className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        {file ? (
          <>
            <span className="block truncate text-sm font-semibold text-[#0a3d62]">{file.name}</span>
            <span className="block text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB · Click to replace</span>
          </>
        ) : (
          <>
            <span className="block text-sm font-semibold text-gray-800">Upload image or PDF</span>
            <span className="block text-xs text-gray-500">Clear photo of the {label.toLowerCase()} of your document</span>
          </>
        )}
      </span>
    </label>
  </div>
)

const VerifySheet = ({ seller, onClose, onSubmit, onToast }) => {
  const state = verificationState(seller)
  const status = STATUSES[state]
  const canSubmit = state === 'rejected' || state === 'none'

  const [docType, setDocType] = useState(seller.kyc?.docType || 'national-id')
  const [front, setFront] = useState(null)
  const [back, setBack] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (busy) return
    if (!front || !back) return setError('Upload both the front and the back of your document.')
    setError('')
    setBusy(true)
    let documents
    try {
      documents = await Promise.all([prepareKycDocument(front), prepareKycDocument(back)])
    } catch (problem) {
      setBusy(false)
      return setError(problem.message || 'Could not read your identity documents.')
    }
    const result = await onSubmit({ docType, front: documents[0], back: documents[1] })
    setBusy(false)
    if (!result.success) return setError(result.error)
    setFront(null)
    setBack(null)
    onToast('Documents submitted for review')
  }

  return (
    <Sheet title="Identity verification" subtitle="Submit documents for KYC review." onClose={onClose}>
      <div>
        <SectionLabel icon="shield" tone="emerald">Verification status</SectionLabel>
        <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${status.card}`}>
          <Icon name={status.icon} className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">{status.title}</p>
            <p className={`mt-0.5 text-xs ${status.body}`}>{status.text}</p>
          </div>
        </div>
      </div>

      {canSubmit && (
        <div className="space-y-4">
          <div>
            <SectionLabel icon="card" tone="blue">Document type</SectionLabel>
            <div className="grid grid-cols-3 gap-2">
              {DOCUMENT_TYPES.map((type) => {
                const active = docType === type.id
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setDocType(type.id)}
                    aria-pressed={active}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-xs font-semibold transition ${
                      active ? 'border-[#0a3d62] bg-blue-50/60 text-[#0a3d62]' : 'border-gray-100 bg-white text-gray-700 hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Icon name={type.icon} className="h-5 w-5" />
                    {type.label}
                  </button>
                )
              })}
            </div>
          </div>

          <UploadSlot label="Front side" file={front} onPick={setFront} />
          <UploadSlot label="Back side" file={back} onPick={setBack} />

          <p className="text-[11px] leading-relaxed text-gray-500">
            JPG, PNG or WEBP photos of any size are compressed automatically. PDFs are accepted up to about 330 KB — prefer a photo or scan.
          </p>

          <Notice>{error}</Notice>
          <PrimaryButton icon="checkCircle" busy={busy} onClick={submit} className="w-full">
            {busy ? 'Submitting…' : 'Submit for review'}
          </PrimaryButton>
        </div>
      )}
    </Sheet>
  )
}

export default VerifySheet
