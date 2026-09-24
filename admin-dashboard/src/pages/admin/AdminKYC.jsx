import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'

// Browsers refuse to open a data: URL as a page, so a PDF is opened through a temporary blob URL.
const openPdf = (dataUrl) => {
  try {
    const bytes = Uint8Array.from(atob(dataUrl.split(',')[1]), (char) => char.charCodeAt(0))
    window.open(URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })), '_blank', 'noopener')
  } catch (_) {}
}

const Icon = ({ name, className = 'w-5 h-5', strokeWidth = 2 }) => {
  const common = {
    xmlns: 'http://www.w3.org/2000/svg',
    fill: 'none',
    viewBox: '0 0 24 24',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className,
  }
  switch (name) {
    case 'shield':
      return <svg {...common}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
    case 'search':
      return <svg {...common}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
    case 'check':
      return <svg {...common}><polyline points="20 6 9 17 4 12" /></svg>
    case 'clock':
      return <svg {...common}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
    case 'mail':
      return <svg {...common}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
    case 'calendar':
      return <svg {...common}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
    case 'phone':
      return <svg {...common}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
    case 'copy':
      return <svg {...common}><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
    case 'file':
      return <svg {...common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
    case 'idcard':
      return <svg {...common}><rect x="3" y="4" width="18" height="16" rx="2" ry="2" /><circle cx="9" cy="10" r="2" /><path d="M14 8h4M14 12h4M9 16h6" /></svg>
    case 'close':
      return <svg {...common}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
    case 'x':
      return <svg {...common}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
    case 'user':
      return <svg {...common}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
    default:
      return null
  }
}

const KYCDetailModal = ({ seller, onClose }) => {
  const { approveKYC, rejectKYC, loadKycDocuments } = useAuth()
  const [msg, setMsg] = useState('')
  const [msgT, setMsgT] = useState('')
  const [busy, setBusy] = useState(false)
  // The identity images are stored apart from the shop record: fetched when the modal opens.
  const [docs, setDocs] = useState({ loading: true, front: null, back: null })

  useEffect(() => {
    let cancelled = false
    loadKycDocuments(seller.id).then((loaded) => {
      if (!cancelled) setDocs({ loading: false, front: loaded?.front || null, back: loaded?.back || null })
    })
    return () => { cancelled = true }
  }, [seller.id])

  const copyEmail = () => {
    try { navigator.clipboard.writeText(seller.email) } catch (_) {}
  }
  const kycStatus = seller.kyc?.status || (seller.verified ? 'Approved' : 'Pending')

  const doApprove = async () => {
    if (busy) return
    setBusy(true)
    const res = await approveKYC(seller.id)
    setBusy(false)
    if (res.success) { setMsg('KYC Approved'); setMsgT('success'); setTimeout(onClose, 900) }
    else { setMsg(res.error || 'Failed'); setMsgT('error') }
  }
  const doReject = async () => {
    if (busy) return
    setBusy(true)
    const res = await rejectKYC(seller.id)
    setBusy(false)
    if (res.success) { setMsg('KYC Rejected'); setMsgT('error'); setTimeout(onClose, 900) }
    else { setMsg(res.error || 'Failed'); setMsgT('error') }
  }

  const approved = kycStatus === 'Approved'
  const rejected = kycStatus === 'Rejected'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75" onClick={onClose}>
      <div className="w-full max-w-lg bg-white sm:rounded-3xl rounded-t-[32px] shadow-2xl overflow-hidden animate-in max-h-[95vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl font-black shrink-0">
                {(seller.shopName || 'S').split(' ').map(x=>x[0]).join('').toUpperCase().slice(0,2)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-black text-gray-900">{seller.shopName}</h3>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-black border ${approved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : rejected ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    <Icon name="check" className="w-4 h-4" /> {kycStatus}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-gray-600 font-semibold">
                  <Icon name="user" className="w-4 h-4 text-gray-400" />
                  <span>{seller.ownerName || seller.fullName}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-gray-500 font-medium text-sm">
                  <Icon name="calendar" className="w-4 h-4 text-gray-400" />
                  <span>Submitted {seller.kyc?.submittedAt || seller.memberSince}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors">
              <Icon name="close" className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Icon name="shield" className="w-5 h-5 text-gray-800" />
              <h4 className="text-lg font-black text-gray-900 uppercase tracking-wide">Identity</h4>
            </div>
            <div className="space-y-3.5">
              <div>
                <p className="text-sm font-black uppercase tracking-wider text-gray-500 mb-1">Shop name</p>
                <p className="text-xl font-bold text-gray-900">{seller.shopName}</p>
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-wider text-gray-500 mb-1">Owner</p>
                <p className="text-xl font-bold text-gray-900">{seller.ownerName || seller.fullName}</p>
              </div>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-black uppercase tracking-wider text-gray-500 mb-1">Email</p>
                  <div className="flex items-center gap-1 text-gray-900">
                    <Icon name="mail" className="w-5 h-5 text-gray-500 shrink-0" />
                    <p className="text-lg font-bold truncate">{seller.email}</p>
                  </div>
                </div>
                <button onClick={copyEmail} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-indigo-600 transition-colors shrink-0">
                  <Icon name="copy" className="w-5 h-5" />
                </button>
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-wider text-gray-500 mb-1">Phone</p>
                <div className="flex items-center gap-1 text-gray-900">
                  <Icon name="phone" className="w-5 h-5 text-gray-500 shrink-0" />
                  <p className="text-lg font-bold">{seller.kyc?.phone || '—'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-wider text-gray-500 mb-1">Joined</p>
                <div className="flex items-center gap-1 text-gray-900">
                  <Icon name="calendar" className="w-5 h-5 text-gray-500 shrink-0" />
                  <p className="text-lg font-bold">{seller.kyc?.joined || seller.memberSince}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-wider text-gray-500 mb-1">Document type</p>
                <p className="text-xl font-bold text-gray-900">{seller.kyc?.docType || 'national_id'}</p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Icon name="file" className="w-5 h-5 text-gray-800" />
              <h4 className="text-lg font-black text-gray-900 uppercase tracking-wide">
                Submitted Documents — Type: {seller.kyc?.docType || 'national_id'}
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                ['front', 'Identity Document — Front'],
                ['back', 'Identity Document — Back'],
              ].map(([side, label]) => {
                const src = docs[side]
                return (
                  <div key={side} className="rounded-3xl border-2 border-gray-100 overflow-hidden bg-gray-50">
                    <div className="aspect-[4/3] flex items-center justify-center bg-gray-100">
                      {src ? (
                        src.startsWith('data:application/pdf') ? (
                          <button type="button" onClick={() => openPdf(src)} className="flex flex-col items-center gap-2 text-gray-500 hover:text-indigo-600">
                            <Icon name="file" className="w-10 h-10" />
                            <span className="text-sm font-bold">Open PDF</span>
                          </button>
                        ) : (
                          <img src={src} alt={label} className="h-full w-full object-contain" />
                        )
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                          <Icon name="idcard" className="w-10 h-10" />
                          <span className="text-sm font-bold">{docs.loading ? 'Loading…' : 'Not uploaded'}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-white border-t border-gray-100 text-gray-600 font-semibold">
                      <Icon name="idcard" className="w-5 h-5 text-gray-500" />
                      {label}
                    </div>
                  </div>
                )
              })}
            </div>
            {(seller.kyc?.country || seller.kyc?.address) && (
              <div className="mt-4 rounded-2xl bg-gray-50 p-4">
                <p className="text-xs font-black uppercase tracking-wider text-gray-500 mb-1">Registered address</p>
                <p className="font-bold text-gray-800">{[seller.kyc?.address, seller.kyc?.country].filter(Boolean).join(' · ')}</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 space-y-3">
          {msg && <p className={`text-center font-black ${msgT === 'error' ? 'text-rose-600' : 'text-emerald-600'}`}>{msg}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={doApprove}
              disabled={approved || busy}
              className="inline-flex items-center justify-center gap-2 px-5 py-4 rounded-3xl font-black text-lg text-white bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon name="check" className="w-6 h-6" />
              Approve
            </button>
            <button
              onClick={doReject}
              disabled={rejected || busy}
              className="inline-flex items-center justify-center gap-2 px-5 py-4 rounded-3xl font-black text-lg text-rose-700 bg-rose-50 border-2 border-rose-200 hover:bg-rose-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon name="x" className="w-6 h-6" />
              Reject
            </button>
          </div>
          <p className="text-center text-sm text-gray-500 font-semibold">
            Status: {kycStatus} · use the seller's profile to reset.
          </p>
        </div>
      </div>
    </div>
  )
}

const AdminKYC = () => {
  const { getKYCRecords } = useAuth()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const records = useMemo(() => {
    const all = getKYCRecords()
    const q = search.toLowerCase().trim()
    if (!q) return all
    return all.filter((s) =>
      (s.shopName && s.shopName.toLowerCase().includes(q)) ||
      (s.ownerName && s.ownerName.toLowerCase().includes(q)) ||
      (s.fullName && s.fullName.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q))
    )
  }, [getKYCRecords, search])

  const copyEmail = (e) => { e.stopPropagation(); try { navigator.clipboard.writeText(e.currentTarget.dataset.email) } catch (_) {} }

  const initials = (n) => (n || 'S').split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2)

  const avatarColors = (i) => {
    const palette = [
      ['bg-purple-100 text-purple-700', 'border-purple-200'],
      ['bg-blue-100 text-blue-700', 'border-blue-200'],
      ['bg-emerald-100 text-emerald-700', 'border-emerald-200'],
      ['bg-teal-100 text-teal-700', 'border-teal-200'],
      ['bg-rose-100 text-rose-700', 'border-rose-200'],
      ['bg-amber-100 text-amber-700', 'border-amber-200'],
    ]
    return palette[i % palette.length]
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 py-2">
      <div className="sticky top-0 z-10 -mx-2 px-2 pt-2 pb-3 bg-gray-50/95 backdrop-blur-md">
        <div className="relative">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon name="search" className="w-7 h-7" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search shop, owner, email..."
            className="w-full pl-16 pr-5 py-4 bg-white border-2 border-gray-100 rounded-3xl text-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="space-y-3.5">
        {records.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
              <Icon name="shield" className="w-8 h-8 text-gray-400" />
            </div>
            <p className="font-bold text-gray-700">No KYC records match</p>
          </div>
        ) : (
          records.map((s, idx) => {
            const status = s.kyc?.status || (s.verified ? 'Approved' : 'Pending')
            const approved = status === 'Approved'
            const rejected = status === 'Rejected'
            const pending = status === 'Pending'
            const [color] = avatarColors(idx)
            return (
              <button
                key={s.id}
                onClick={() => setSelected(s)}
                className={`w-full text-left relative overflow-hidden rounded-3xl bg-white border-2 ${pending ? 'border-amber-100' : approved ? 'border-emerald-50' : 'border-rose-50'} shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all pr-4 pl-5 py-5`}
              >
                <span className={`absolute left-0 top-0 bottom-0 w-[5px] ${pending ? 'bg-amber-400' : approved ? 'bg-teal-400' : 'bg-rose-400'}`} />
                <div className="flex items-start gap-4">
                  <div className={`w-16 h-16 rounded-2xl ${color} flex items-center justify-center shrink-0 font-black text-2xl`}>
                    {initials(s.shopName || s.ownerName || s.fullName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-2xl font-black text-gray-900 truncate">{s.shopName}</h3>
                          <div className="flex items-center gap-1.5 text-gray-500 font-semibold whitespace-nowrap">
                            <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
                            {s.lastActive}
                          </div>
                        </div>
                        <p className="mt-0.5 text-lg font-bold text-gray-700">{s.ownerName || s.fullName}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-black border shrink-0 ${approved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : rejected ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        <Icon name={pending ? 'clock' : 'check'} className="w-4 h-4" />
                        {status}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 text-gray-700">
                        <Icon name="mail" className="w-5 h-5 text-gray-400 shrink-0" />
                        <span className="truncate font-semibold">{s.email}</span>
                      </div>
                      <button
                        data-email={s.email}
                        onClick={copyEmail}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition-colors shrink-0"
                      >
                        <Icon name="copy" className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1 text-gray-500 font-medium">
                      <Icon name="calendar" className="w-4 h-4 text-gray-400" />
                      <span>Joined {s.kyc?.joined || s.memberSince}</span>
                    </div>
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>

      {selected && <KYCDetailModal seller={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

export default AdminKYC
