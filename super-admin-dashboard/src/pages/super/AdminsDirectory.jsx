import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSuperAuth } from '../../context/AuthContext'
import { AddAccountModal, ConfirmModal } from '../../components/AccountModals'
import {
  CopyButton,
  EmptyState,
  Icon,
  Modal,
  avatarColorFor,
  formatDateTime,
  initialsOf,
  money,
  primaryButtonClass,
  timeAgo,
} from '../../components/ui'

const StatTile = ({ label, value, tone = 'text-gray-900' }) => (
  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 leading-tight">{label}</p>
    <p className={`mt-1 text-sm font-black leading-tight break-all ${tone}`}>{value}</p>
  </div>
)

const AdminDetailsModal = ({ admin, ownerName, onClose }) => {
  const { getAdminStats, getAdminLoginHistory } = useSuperAuth()
  const stats = getAdminStats(admin.id)
  const history = getAdminLoginHistory(admin.id).slice(0, 8)

  return (
    <Modal
      title={admin.fullName}
      subtitle={`${admin.email} · ${admin.removed ? 'Removed' : 'Active'}`}
      icon="activity"
      iconClass="bg-indigo-100 text-indigo-700"
      maxWidth="max-w-2xl"
      onClose={onClose}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatTile label="Sellers" value={stats.sellers} />
          <StatTile label="Verified" value={stats.verifiedSellers} tone="text-emerald-600" />
          <StatTile label="Pending KYC" value={stats.pendingKYC} tone="text-amber-600" />
          <StatTile label="Seller balance" value={money(stats.balance)} />
          <StatTile label="Guarantee held" value={money(stats.guarantee)} />
          <StatTile label="Revenue" value={money(stats.revenue)} tone="text-indigo-600" />
          <StatTile label="Orders" value={stats.orders} />
          <StatTile label="Delivered" value={stats.delivered} />
          <StatTile label="Pending withdrawals" value={stats.pendingWithdrawals} tone="text-rose-600" />
        </div>

        <div className="rounded-2xl border border-gray-100 divide-y divide-gray-100">
          {[
            ['Invite code (for sellers)', <span key="c" className="inline-flex items-center gap-2 font-mono font-bold">{admin.inviteCode}<CopyButton value={admin.inviteCode} className="!p-1.5" /></span>],
            ['Invited by', ownerName],
            ['Member since', admin.memberSince || '—'],
            ['Last login', admin.lastLoginAt ? formatDateTime(admin.lastLoginAt) : 'Never'],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="text-gray-500 font-semibold">{label}</span>
              <span className="text-gray-900 font-bold text-right">{value}</span>
            </div>
          ))}
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-gray-500 mb-2">Sellers ({stats.sellers})</p>
          {stats.sellerList.length ? (
            <div className="rounded-2xl border border-gray-100 divide-y divide-gray-100 max-h-56 overflow-y-auto">
              {stats.sellerList.map((seller) => (
                <div key={seller.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate">{seller.shopName || seller.fullName}</p>
                    <p className="text-sm text-gray-500 truncate">{seller.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-gray-900">{money(seller.balance)}</p>
                    <p className={`text-xs font-bold ${seller.verified ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {seller.verified ? 'Verified' : 'Pending KYC'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border-2 border-dashed border-gray-200 py-6 text-center font-semibold text-gray-400">No sellers yet</p>
          )}
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-gray-500 mb-2">Login history</p>
          {history.length ? (
            <div className="rounded-2xl border border-gray-100 divide-y divide-gray-100">
              {history.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="font-semibold text-gray-700 truncate">{entry.via}</span>
                  <span className="text-sm font-semibold text-gray-400 shrink-0">{formatDateTime(entry.at)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border-2 border-dashed border-gray-200 py-6 text-center font-semibold text-gray-400">No logins recorded</p>
          )}
        </div>
      </div>
    </Modal>
  )
}

const AdminsDirectory = () => {
  const {
    superAdmin, admins, getSuperAdminById, getAdminStats, addAdmin, setAdminRemoved,
    resetAdminPassword, assignAdminToMe, loginAsAdmin,
  } = useSuperAuth()
  const [searchParams] = useSearchParams()
  const [scope, setScope] = useState(searchParams.get('scope') === 'all' ? 'all' : 'mine')
  const [search, setSearch] = useState('')
  const [showRemoved, setShowRemoved] = useState(false)
  const [openMenuFor, setOpenMenuFor] = useState(null)
  const [modal, setModal] = useState(null)
  const [notice, setNotice] = useState('')

  const menuRef = useRef(null)
  useEffect(() => {
    const onDoc = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setOpenMenuFor(null)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => {
    if (!notice) return undefined
    const timer = setTimeout(() => setNotice(''), 2600)
    return () => clearTimeout(timer)
  }, [notice])

  const ownerOf = (admin) => (admin.superAdminId ? getSuperAdminById(admin.superAdminId) : null)
  const inScope = (admin) => scope === 'all' || admin.superAdminId === superAdmin.id
  const scoped = admins.filter(inScope)
  const activeCount = scoped.filter((a) => !a.removed).length
  const removedCount = scoped.filter((a) => a.removed).length
  const myActiveCount = admins.filter((a) => a.superAdminId === superAdmin.id && !a.removed).length
  const allActiveCount = admins.filter((a) => !a.removed).length

  const query = search.toLowerCase().trim()
  const filtered = scoped
    .filter((a) => (showRemoved ? a.removed : !a.removed))
    .filter(
      (a) =>
        !query ||
        (a.fullName || '').toLowerCase().includes(query) ||
        (a.email || '').toLowerCase().includes(query) ||
        (a.inviteCode || '').toLowerCase().includes(query)
    )

  const handleLoginAs = async (admin) => {
    const result = await loginAsAdmin(admin.id)
    if (result.success) window.location.assign('/admin-app/dashboard')
    else setNotice(result.error)
  }

  const copyInviteCode = async (admin) => {
    try {
      await navigator.clipboard.writeText(admin.inviteCode)
      setNotice(`Copied ${admin.fullName}'s invite code`)
    } catch (_) {
      setNotice('Could not copy to the clipboard')
    }
  }

  const menuFor = (admin) => [
    { separator: true, label: 'Account Actions' },
    { id: 'details', label: 'Overview & Details', icon: 'activity', run: () => setModal({ type: 'details', admin }) },
    { id: 'password', label: 'Reset Password', icon: 'key', run: () => setModal({ type: 'password', admin }) },
    { id: 'copy', label: 'Copy Invite Code', icon: 'copy', run: () => copyInviteCode(admin) },
    ...(admin.superAdminId !== superAdmin.id
      ? [{ id: 'assign', label: 'Assign to Me', icon: 'users', run: () => setModal({ type: 'assign', admin }) }]
      : []),
    { separator: true, label: 'Access' },
    admin.removed
      ? { id: 'restore', label: 'Restore Admin', icon: 'undo', color: 'text-emerald-600', run: () => setModal({ type: 'restore', admin }) }
      : { id: 'remove', label: 'Remove Admin', icon: 'trash', color: 'text-rose-600', run: () => setModal({ type: 'remove', admin }) },
  ]

  const closeModal = () => setModal(null)

  const toolbarButton = (active) =>
    `flex-1 px-4 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${active ? 'bg-white shadow text-indigo-700' : 'text-gray-500 hover:text-gray-800'}`

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">Network</p>
          <h1 className="mt-1 text-3xl font-black text-gray-900">Admins Directory</h1>
          <p className="mt-1 text-gray-500">Every admin under your invite code — sign in as them, reset access, or remove them.</p>
        </div>
        <button onClick={() => setModal({ type: 'add' })} className={primaryButtonClass}>
          <Icon name="user-plus" className="w-5 h-5" />
          Add Admin
        </button>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon name="search" className="w-6 h-6" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search admin name, email, or invite code..."
            className="w-full pl-14 pr-5 h-[60px] bg-slate-50 border-2 border-slate-100 rounded-3xl text-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex flex-1 gap-1 p-1 bg-gray-100 rounded-2xl">
            <button onClick={() => setScope('mine')} className={toolbarButton(scope === 'mine')}>
              My admins <span className="ml-1 text-xs opacity-70">{myActiveCount}</span>
            </button>
            <button onClick={() => setScope('all')} className={toolbarButton(scope === 'all')}>
              All admins <span className="ml-1 text-xs opacity-70">{allActiveCount}</span>
            </button>
          </div>
          <div className="flex items-center justify-between gap-4 px-5 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl">
            <span className="font-bold text-gray-700">
              Removed <span className="text-xs opacity-70">{removedCount}</span>
            </span>
            <button
              onClick={() => setShowRemoved((v) => !v)}
              className={`relative w-14 h-8 rounded-full transition-all ${showRemoved ? 'bg-indigo-500' : 'bg-gray-300'}`}
              aria-pressed={showRemoved}
              aria-label="Show removed admins"
            >
              <span className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${showRemoved ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <EmptyState
            icon="users"
            title="No admins found"
            message={
              search
                ? 'Try a different search term'
                : showRemoved
                  ? 'No removed admins'
                  : activeCount === 0 && scope === 'mine'
                    ? 'Add an admin, or share your invite code so they can register'
                    : 'Nothing to show here yet'
            }
          />
        ) : (
          filtered.map((admin) => {
            const menuOpen = openMenuFor === admin.id
            const owner = ownerOf(admin)
            const stats = getAdminStats(admin.id)
            return (
              <div key={admin.id} className={`relative bg-white rounded-[28px] border shadow-sm overflow-visible ${admin.removed ? 'border-rose-100' : 'border-gray-100'}`}>
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="relative shrink-0">
                      <div className={`w-16 h-16 rounded-[22px] bg-gradient-to-br ${avatarColorFor(admin.fullName, admin.email)} flex items-center justify-center text-white text-2xl font-black shadow-lg ${admin.removed ? 'opacity-50' : ''}`}>
                        {initialsOf(admin.fullName)}
                      </div>
                      <span className={`absolute -right-1 -bottom-1 w-5 h-5 rounded-full border-2 border-white ${admin.removed ? 'bg-rose-400' : 'bg-emerald-500'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-2xl font-black text-gray-900 truncate">{admin.fullName}</h3>
                        {admin.removed && (
                          <span className="px-2.5 py-1 rounded-full bg-rose-50 border border-rose-100 text-rose-700 text-sm font-bold">Removed</span>
                        )}
                        {!owner && (
                          <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-sm font-bold">Unassigned</span>
                        )}
                        <span className="text-sm font-semibold text-gray-500">{admin.lastLoginAt ? `Active ${timeAgo(admin.lastLoginAt)}` : 'Never signed in'}</span>
                      </div>
                      <p className="mt-1 text-gray-600 font-medium truncate">{admin.email}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-gray-500 font-semibold">
                          Invite code: <span className="text-gray-900 font-mono font-black">{admin.inviteCode}</span>
                        </span>
                        <span className="text-gray-300 hidden sm:inline">|</span>
                        <span className="text-gray-500 font-semibold">
                          Invited by:{' '}
                          <span className="text-gray-900 font-black">
                            {admin.superAdminId === superAdmin.id ? 'You' : owner ? owner.fullName : 'No super admin'}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <StatTile label="Sellers" value={stats.sellers} />
                    <StatTile label="Pending KYC" value={stats.pendingKYC} tone={stats.pendingKYC ? 'text-amber-600' : 'text-gray-900'} />
                    <StatTile label="Seller balance" value={money(stats.balance)} />
                  </div>

                  <div className="mt-5 flex items-center gap-3">
                    <button
                      onClick={() => handleLoginAs(admin)}
                      disabled={admin.removed}
                      className="flex-1 inline-flex items-center justify-center gap-2.5 h-[56px] px-5 rounded-2xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 text-gray-900 text-lg font-bold transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
                    >
                      <Icon name="login" className="w-6 h-6" />
                      Login
                    </button>
                    <div className="relative" ref={menuOpen ? menuRef : undefined}>
                      <button
                        onClick={() => setOpenMenuFor(menuOpen ? null : admin.id)}
                        className={`w-14 h-[56px] rounded-2xl border-2 transition-all flex items-center justify-center ${menuOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-600'}`}
                        aria-expanded={menuOpen}
                        aria-haspopup="menu"
                        aria-label={`Actions for ${admin.fullName}`}
                      >
                        <Icon name="dots" className="w-6 h-6" />
                      </button>

                      {menuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-[300px] bg-white rounded-3xl shadow-2xl border border-gray-100 z-40 overflow-hidden">
                          <ul className="max-h-[70vh] overflow-y-auto py-2">
                            {menuFor(admin).map((entry, idx) =>
                              entry.separator ? (
                                <li key={'sep-' + idx}>
                                  {idx > 0 && <div className="h-px bg-gray-100 my-1.5 mx-3" />}
                                  <p className="px-5 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">{entry.label}</p>
                                </li>
                              ) : (
                                <li key={entry.id}>
                                  <button
                                    onClick={() => {
                                      setOpenMenuFor(null)
                                      entry.run()
                                    }}
                                    className={`w-full flex items-center gap-3.5 px-5 py-3.5 text-left hover:bg-gray-50 transition-colors ${entry.color || 'text-gray-700'}`}
                                  >
                                    <span className="w-9 h-9 rounded-xl bg-gray-100/70 flex items-center justify-center shrink-0">
                                      <Icon name={entry.icon} className="w-5 h-5" />
                                    </span>
                                    <span className="font-bold text-lg flex-1">{entry.label}</span>
                                  </button>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {modal?.type === 'add' && (
        <AddAccountModal
          title="Add Admin"
          subtitle="The admin is created under your invite code and can sign in right away."
          icon="user-plus"
          iconClass="bg-violet-100 text-violet-700"
          submitLabel="Add admin"
          successTitle="Admin added"
          onSubmit={addAdmin}
          onClose={closeModal}
        />
      )}
      {modal?.type === 'details' && (
        <AdminDetailsModal
          admin={admins.find((a) => a.id === modal.admin.id) || modal.admin}
          ownerName={modal.admin.superAdminId === superAdmin.id ? 'You' : ownerOf(modal.admin)?.fullName || 'No super admin'}
          onClose={closeModal}
        />
      )}
      {modal?.type === 'password' && (
        <ConfirmModal
          title="Reset password"
          subtitle={modal.admin.fullName}
          icon="key"
          iconClass="bg-indigo-100 text-indigo-700"
          danger={false}
          confirmLabel="Send reset email"
          onConfirm={async () => {
            const result = await resetAdminPassword(modal.admin.id)
            if (result.success) setNotice(`Password reset email sent to ${modal.admin.email}`)
            return result
          }}
          onClose={closeModal}
        >
          <p>Passwords are private to each admin. We'll email <span className="font-semibold text-gray-900">{modal.admin.email}</span> a link to choose a new one.</p>
        </ConfirmModal>
      )}
      {modal?.type === 'assign' && (
        <ConfirmModal
          title="Assign to me"
          subtitle={modal.admin.fullName}
          icon="users"
          iconClass="bg-indigo-100 text-indigo-700"
          danger={false}
          confirmLabel="Assign to me"
          onConfirm={() => assignAdminToMe(modal.admin.id)}
          onClose={closeModal}
        >
          <p>This admin will appear under “My admins” and count as invited by you.</p>
        </ConfirmModal>
      )}
      {modal?.type === 'remove' && (
        <ConfirmModal
          title="Remove admin"
          subtitle={modal.admin.fullName}
          confirmLabel="Remove admin"
          onConfirm={() => setAdminRemoved(modal.admin.id, true)}
          onClose={closeModal}
        >
          <p>They will be signed out and blocked from the admin console, and their invite code will stop working for new seller sign-ups.</p>
          <p>Their sellers and data are kept, and you can restore this admin at any time.</p>
        </ConfirmModal>
      )}
      {modal?.type === 'restore' && (
        <ConfirmModal
          title="Restore admin"
          subtitle={modal.admin.fullName}
          icon="undo"
          iconClass="bg-emerald-100 text-emerald-700"
          danger={false}
          confirmLabel="Restore admin"
          onConfirm={() => setAdminRemoved(modal.admin.id, false)}
          onClose={closeModal}
        >
          <p>They will be able to sign in again and their invite code will work for seller sign-ups.</p>
        </ConfirmModal>
      )}

      {notice && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-gray-900 text-white font-semibold shadow-2xl" role="status">
          {notice}
        </div>
      )}
    </div>
  )
}

export default AdminsDirectory
