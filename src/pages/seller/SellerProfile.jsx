import { useNavigate, useOutletContext } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { loadSellerProfile } from '../../firebase/accounts'
import { prepareAvatar } from '../../data/avatar'
import { Icon } from '../../components/profile/Sheet'
import ShopSettingsSheet from '../../components/profile/ShopSettingsSheet'
import AccountSheet from '../../components/profile/AccountSheet'
import SecuritySheet from '../../components/profile/SecuritySheet'
import VerifySheet, { verificationState } from '../../components/profile/VerifySheet'

// What each verification state looks like in the header badge.
const VERIFICATION_BADGES = {
  verified: { label: 'Verified', icon: 'shield', className: 'bg-green-500/20 text-green-200 border-green-400/30' },
  review: { label: 'Under review', icon: 'shieldAlert', className: 'bg-white/15 text-white border-white/20' },
  rejected: { label: 'Rejected', icon: 'shieldAlert', className: 'bg-rose-500/20 text-rose-200 border-rose-400/30' },
  none: { label: 'Not verified', icon: 'shieldAlert', className: 'bg-amber-500/20 text-amber-200 border-amber-400/30' },
}

const initialsOf = (name) =>
  (name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('') || 'S'

const SellerProfile = () => {
  const { seller } = useOutletContext()
  const navigate = useNavigate()
  const {
    getSellerPayoutMethods,
    saveSellerPayoutMethod,
    removeSellerPayoutMethod,
    logoutSeller,
    accountEmail,
    accountEmailVerified,
    hasTransactionPassword,
    transactionPasswordError,
    saveShopSettings,
    saveAccountName,
    saveAvatar,
    changeAccountEmail,
    sendEmailVerification,
    changeSignInPassword,
    saveTransactionPassword,
    submitKycDocuments,
  } = useAuth()

  const [payoutOpen, setPayoutOpen] = useState(false)
  const [payoutType, setPayoutType] = useState('bank')
  const [payoutForm, setPayoutForm] = useState({ label: '', bankName: '', holderName: '', accountNumber: '', routingNumber: '', network: 'USDT_TRC20', walletAddress: '', isDefault: true })
  const payoutMethods = getSellerPayoutMethods(seller.id)
  const updatePayout = (key, value) => setPayoutForm((current) => ({ ...current, [key]: value }))
  const savePayout = () => {
    const required = payoutType === 'bank' ? ['bankName', 'holderName', 'accountNumber', 'routingNumber'] : ['walletAddress']
    if (required.some((key) => !payoutForm[key].trim())) return
    saveSellerPayoutMethod(seller.id, { ...payoutForm, type: payoutType, label: payoutForm.label || (payoutType === 'bank' ? payoutForm.bankName : payoutForm.network) })
    setPayoutOpen(false)
    setPayoutForm({ label: '', bankName: '', holderName: '', accountNumber: '', routingNumber: '', network: 'USDT_TRC20', walletAddress: '', isDefault: true })
  }

  // Which bottom sheet is open ('shop' | 'account' | 'security' | 'verify'), and the confirmation toast.
  const [sheet, setSheet] = useState(null)
  const closeSheet = () => setSheet(null)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)
  const showToast = (text, tone = 'success') => {
    setToast({ text, tone })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 5000)
  }
  useEffect(() => () => clearTimeout(toastTimer.current), [])

  // A shop that has never saved an address starts from the one given at sign-up.
  const [signupProfile, setSignupProfile] = useState(null)
  useEffect(() => {
    if (!seller.id || seller.impersonated || seller.address) return
    let cancelled = false
    loadSellerProfile(seller.id).then((profile) => {
      if (!cancelled) setSignupProfile(profile)
    })
    return () => {
      cancelled = true
    }
  }, [seller.id, seller.impersonated, seller.address])

  const avatarInput = useRef(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const pickAvatar = async (event) => {
    const file = event.target.files && event.target.files[0]
    event.target.value = ''
    if (!file) return
    setUploadingAvatar(true)
    try {
      const result = await saveAvatar(await prepareAvatar(file))
      if (result.success) showToast('Profile photo updated')
      else showToast(result.error, 'error')
    } catch (error) {
      showToast(error.message || 'Could not use that photo.', 'error')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const sellerData = {
    ...seller,
    storeName: seller.shopName || 'My Shop',
    ownerName: seller.ownerName || seller.fullName || 'Seller',
  }

  const verification = VERIFICATION_BADGES[verificationState(seller)]
  const accountActive = !seller.suspended

  const settingsSections = [
    {
      id: 'shop',
      title: 'Shop',
      subtitle: 'Shop name, phone & SEO',
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-600',
      icon: 'shop',
    },
    {
      id: 'account',
      title: 'Account',
      subtitle: 'Email & contact details',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      icon: 'user',
    },
    {
      id: 'security',
      title: 'Security',
      subtitle: 'Login & transaction password',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      icon: 'lock',
    },
    {
      id: 'payout',
      title: 'Payout Method',
      subtitle: 'Bank accounts & wallets for withdrawals',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      icon: 'card',
    },
    {
      id: 'verify',
      title: 'Verify',
      subtitle: 'Identity verification',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      icon: 'shield',
    },
  ]

  const openSection = (id) => (id === 'payout' ? setPayoutOpen(true) : setSheet(id))

  const handleLogout = () => {
    logoutSeller()
    navigate('/')
  }

  return (
    <div className="-mx-6 lg:-mx-8 -mt-6 lg:-mt-8">
      {toast && (
        <div
          role={toast.tone === 'error' ? 'alert' : 'status'}
          className={`animate-toast-in fixed right-4 top-4 z-[60] flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${
            toast.tone === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          <Icon name={toast.tone === 'error' ? 'alert' : 'checkCircle'} className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm font-semibold">{toast.text}</p>
          <button type="button" onClick={() => setToast(null)} aria-label="Dismiss" className="-mr-1 shrink-0 rounded-full p-0.5 opacity-60 transition hover:opacity-100">
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="bg-gradient-to-br from-[#0a3d62] via-[#0f4c81] to-[#1a6fb0] px-6 lg:px-8 pt-8 lg:pt-10 pb-24 lg:pb-28">
        <div className="flex items-start space-x-5">
          <div className="relative shrink-0">
            <div className="w-24 h-24 lg:w-28 lg:h-28 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden text-4xl lg:text-5xl font-bold text-white border-2 border-white/30">
              {seller.avatar ? <img src={seller.avatar} alt="Profile" className="h-full w-full object-cover" /> : initialsOf(sellerData.ownerName)}
            </div>
            <input ref={avatarInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={pickAvatar} />
            <button
              type="button"
              onClick={() => avatarInput.current?.click()}
              disabled={uploadingAvatar || seller.impersonated}
              aria-label="Change profile photo"
              className="absolute -bottom-1 -right-1 w-9 h-9 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-100 disabled:opacity-60"
            >
              {uploadingAvatar ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#0a3d62]" />
              ) : (
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
          <div className="flex-1 min-w-0 pt-2">
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1 truncate">{sellerData.storeName}</h1>
            <p className="text-blue-100 text-base lg:text-lg mb-4 truncate">{sellerData.ownerName}</p>

            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`inline-flex items-center space-x-1.5 px-3 py-1.5 backdrop-blur-sm text-xs font-semibold rounded-full border ${verification.className}`}>
                <Icon name={verification.icon} className="w-3.5 h-3.5" />
                <span>{verification.label}</span>
              </span>
              <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white/15 backdrop-blur-sm text-white text-xs font-semibold rounded-full border border-white/20">
                <span className={`w-1.5 h-1.5 rounded-full ${accountActive ? 'bg-green-400' : 'bg-red-400'}`} />
                <span>{accountActive ? 'Active' : 'Suspended'}</span>
              </span>
              <span className="inline-flex items-center space-x-1 px-3 py-1.5 bg-yellow-500/20 backdrop-blur-sm text-yellow-200 text-xs font-semibold rounded-full border border-yellow-400/30">
                <span>{Number(sellerData.rating ?? 5).toFixed(1)}</span>
                <svg className="w-3.5 h-3.5 fill-yellow-300 text-yellow-300" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </span>
            </div>

            <p className="text-blue-200 text-sm">
              Member since {sellerData.memberSince}
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 lg:px-8 -mt-16 lg:-mt-20 space-y-6 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => navigate('/seller/withdraw')}
            className="group flex items-center justify-between p-4 lg:p-5 text-left transition-colors hover:bg-gray-50"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-slate-100 p-2.5 rounded-xl text-slate-600">
                <Icon name="wallet" className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-0.5">Shop Balance</p>
                <p className="text-xl font-bold text-gray-900">${Number(sellerData.balance || 0).toFixed(2)}</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="flex items-center justify-between p-4 lg:p-5">
            <div className="flex items-center space-x-3">
              <div className="bg-slate-100 p-2.5 rounded-xl text-slate-600">
                <Icon name="shield" className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-0.5">Guarantee</p>
                <p className="text-xl font-bold text-gray-900">${Number(sellerData.guarantee || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
          {settingsSections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => openSection(section.id)}
              className="w-full flex items-center justify-between p-4 lg:p-5 hover:bg-gray-50 transition-colors text-left group"
            >
              <div className="flex items-center space-x-4">
                <div className={`${section.iconBg} ${section.iconColor} p-3 rounded-xl shrink-0`}>
                  <Icon name={section.icon} className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-[#0a3d62] transition-colors">
                    {section.title}
                  </p>
                  <p className="text-sm text-gray-500">{section.subtitle}</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#0a3d62] group-hover:translate-x-0.5 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>

        {payoutOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4" onClick={() => setPayoutOpen(false)}><div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between"><div><h2 className="text-2xl font-black text-gray-900">Payout methods</h2><p className="mt-1 text-sm text-gray-500">Add a bank account or crypto wallet for withdrawals.</p></div><button onClick={() => setPayoutOpen(false)} className="text-2xl text-gray-400">×</button></div><div className="mt-5 grid grid-cols-2 gap-2"><button onClick={() => setPayoutType('bank')} className={`rounded-xl border-2 p-3 font-bold ${payoutType === 'bank' ? 'border-[#0a3d62] bg-blue-50' : 'border-gray-200'}`}>Bank account</button><button onClick={() => setPayoutType('crypto')} className={`rounded-xl border-2 p-3 font-bold ${payoutType === 'crypto' ? 'border-[#0a3d62] bg-blue-50' : 'border-gray-200'}`}>Crypto wallet</button></div><div className="mt-4 space-y-3">{payoutType === 'bank' ? <>{[['label','Label (optional)'],['bankName','Bank name'],['holderName','Account holder name'],['accountNumber','Account number'],['routingNumber','Routing / IFSC']].map(([key, label]) => <input key={key} value={payoutForm[key]} onChange={(event) => updatePayout(key, event.target.value)} placeholder={label} className="w-full rounded-xl border border-gray-200 px-4 py-3" />)}</> : <>{<input value={payoutForm.label} onChange={(event) => updatePayout('label', event.target.value)} placeholder="Label (optional)" className="w-full rounded-xl border border-gray-200 px-4 py-3" />}<select value={payoutForm.network} onChange={(event) => updatePayout('network', event.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-3"><option>USDT_TRC20</option><option>USDT_ERC20</option><option>BTC</option></select><input value={payoutForm.walletAddress} onChange={(event) => updatePayout('walletAddress', event.target.value)} placeholder="Wallet address" className="w-full rounded-xl border border-gray-200 px-4 py-3" /></>}</div>{payoutMethods.length > 0 && <div className="mt-4 space-y-2">{payoutMethods.map((method) => <div key={method.id} className="flex items-center justify-between rounded-xl bg-gray-50 p-3 text-sm"><span className="font-bold">{method.label}</span><button onClick={() => removeSellerPayoutMethod(seller.id, method.id)} className="font-bold text-rose-600">Remove</button></div>)}</div>}<button onClick={savePayout} className="mt-5 w-full rounded-xl bg-[#0a3d62] px-4 py-3 font-black text-white">Save method</button></div></div>}

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-4 lg:p-5 hover:bg-red-50 transition-colors text-left group"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-red-100 p-3 rounded-xl shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-red-600 group-hover:text-red-700 transition-colors">
                  Log out
                </p>
                <p className="text-sm text-red-400">Sign out of your seller account</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {sheet === 'shop' && (
        <ShopSettingsSheet
          key={signupProfile ? 'with-profile' : 'no-profile'}
          seller={seller}
          profile={signupProfile}
          onClose={closeSheet}
          onSave={saveShopSettings}
          onSaved={(message) => {
            closeSheet()
            showToast(message)
          }}
        />
      )}
      {sheet === 'account' && (
        <AccountSheet
          seller={seller}
          email={accountEmail}
          emailVerified={accountEmailVerified}
          onClose={closeSheet}
          onSaveName={saveAccountName}
          onChangeEmail={changeAccountEmail}
          onSendVerification={sendEmailVerification}
          onToast={showToast}
        />
      )}
      {sheet === 'security' && (
        <SecuritySheet
          hasTransactionPassword={hasTransactionPassword}
          statusError={transactionPasswordError}
          onClose={closeSheet}
          onChangePassword={changeSignInPassword}
          onSaveTransactionPassword={saveTransactionPassword}
          onToast={showToast}
        />
      )}
      {sheet === 'verify' && <VerifySheet seller={seller} onClose={closeSheet} onSubmit={submitKycDocuments} onToast={showToast} />}
    </div>
  )
}

export default SellerProfile
