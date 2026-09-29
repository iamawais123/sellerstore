import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSuperAuth } from '../../context/AuthContext'
import { AddAccountModal, ConfirmModal, SetPasswordModal } from '../../components/AccountModals'
import { CopyButton, EmptyState, Icon, OwnerBadge, avatarColorFor, initialsOf, primaryButtonClass, timeAgo } from '../../components/ui'

const SuperAdminsManage = () => {
  const {
    superAdmin, superAdmins, removedSuperAdmins, admins, ownerUid, isOwner, isOwnerId, superAdminName,
    createSuperAdmin, removeSuperAdmin, restoreSuperAdmin, changeOwnPassword,
  } = useSuperAuth()
  const navigate = useNavigate()
  const [modal, setModal] = useState(null)
  const closeModal = () => setModal(null)

  // The owner always leads the list; everyone else follows in the order they were added.
  const ordered = useMemo(
    () => [...superAdmins].sort((a, b) => (b.id === ownerUid) - (a.id === ownerUid) || (a.createdAt || '').localeCompare(b.createdAt || '')),
    [superAdmins, ownerUid]
  )

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4">
        <div>
          <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.18em] text-indigo-600">Access</p>
          <h1 className="mt-1 text-xl sm:text-3xl font-black text-gray-900">Super Admins</h1>
          <p className="mt-1 text-[13px] sm:text-base text-gray-500">
            {isOwner
              ? 'You are the owner: you add and remove the other super admins and see everything. Each of them sees only their own admins and activity — not you, and not each other.'
              : 'Super admins each have their own invite code for onboarding admins. Only the owner can add or remove super admins.'}
          </p>
        </div>
        {isOwner && (
          <button onClick={() => setModal({ type: 'add' })} className={`${primaryButtonClass} !px-4 !py-2.5 !text-sm sm:!px-6 sm:!py-3.5 sm:!text-base`}>
            <Icon name="user-plus" className="w-4 h-4 sm:w-5 sm:h-5" />
            Add Super Admin
          </button>
        )}
      </div>

      <div className="space-y-3 sm:space-y-4">
        {ordered.length === 0 ? (
          <EmptyState icon="crown" title="No super admins" />
        ) : (
          ordered.map((person) => {
            const isMe = person.id === superAdmin.id
            const isOwnerAccount = isOwnerId(person.id)
            const adminCount = admins.filter((a) => a.superAdminId === person.id && !a.removed).length
            const canRemove = isOwner && !isOwnerAccount && !isMe
            return (
              <div
                key={person.id}
                className={`bg-white rounded-2xl sm:rounded-[28px] border shadow-sm p-3.5 sm:p-5 ${isOwnerAccount ? 'border-amber-200 ring-1 ring-amber-100' : 'border-gray-100'}`}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className={`w-11 h-11 sm:w-16 sm:h-16 rounded-xl sm:rounded-[22px] bg-gradient-to-br ${avatarColorFor(person.fullName, person.email)} flex items-center justify-center text-white text-sm sm:text-2xl font-black shadow-lg shrink-0`}>
                    {initialsOf(person.fullName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <h3 className="text-[15px] sm:text-2xl font-black text-gray-900 truncate">{person.fullName}</h3>
                      {isOwnerAccount && <OwnerBadge />}
                      {isMe && <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10.5px] sm:text-sm font-bold">You</span>}
                      <span className="text-[11px] sm:text-sm font-semibold text-gray-500">{person.lastLoginAt ? `Active ${timeAgo(person.lastLoginAt)}` : 'Never signed in'}</span>
                    </div>
                    <p className="mt-0.5 sm:mt-1 text-[12.5px] sm:text-base text-gray-600 font-medium truncate">{person.email}</p>
                    <div className="mt-1.5 sm:mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="inline-flex items-center gap-2 text-[11.5px] sm:text-base text-gray-500 font-semibold">
                        Invite code: <span className="text-gray-900 font-mono font-black">{person.inviteCode}</span>
                        <CopyButton value={person.inviteCode} className="!p-1.5" />
                      </span>
                      <span className="text-gray-300 hidden sm:inline">|</span>
                      <span className="text-[11.5px] sm:text-base text-gray-500 font-semibold">
                        Admins: <span className="text-gray-900 font-black">{adminCount}</span>
                      </span>
                      <span className="text-gray-300 hidden sm:inline">|</span>
                      <span className="text-[11.5px] sm:text-base text-gray-500 font-semibold">
                        Added by: <span className="text-gray-900 font-black">{person.createdBy ? superAdminName(person.createdBy) || (isOwner ? 'Removed super admin' : 'Owner') : 'First registration'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {(isMe || canRemove) && (
                  <div className="mt-3 sm:mt-5 flex flex-wrap items-center gap-2.5 sm:gap-3">
                    {isMe ? (
                      <button
                        onClick={() => setModal({ type: 'password' })}
                        className="inline-flex items-center justify-center gap-2 sm:gap-2.5 h-10 sm:h-[52px] px-4 sm:px-5 rounded-xl sm:rounded-2xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 text-gray-900 text-sm sm:text-base font-bold transition-all shadow-sm"
                      >
                        <Icon name="key" className="w-4 h-4 sm:w-5 sm:h-5" />
                        Change my password
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => navigate(`/admins?by=${person.id}`)}
                          className="inline-flex items-center justify-center gap-2 sm:gap-2.5 h-10 sm:h-[52px] px-4 sm:px-5 rounded-xl sm:rounded-2xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 text-gray-900 text-sm sm:text-base font-bold transition-all shadow-sm"
                        >
                          <Icon name="users" className="w-4 h-4 sm:w-5 sm:h-5" />
                          View their admins
                        </button>
                        <button
                          onClick={() => navigate(`/activity?by=${person.id}`)}
                          className="inline-flex items-center justify-center gap-2 sm:gap-2.5 h-10 sm:h-[52px] px-4 sm:px-5 rounded-xl sm:rounded-2xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 text-gray-900 text-sm sm:text-base font-bold transition-all shadow-sm"
                        >
                          <Icon name="activity" className="w-4 h-4 sm:w-5 sm:h-5" />
                          View their activity
                        </button>
                        <button
                          onClick={() => setModal({ type: 'remove', person })}
                          className="inline-flex items-center justify-center gap-2 sm:gap-2.5 h-10 sm:h-[52px] px-4 sm:px-5 rounded-xl sm:rounded-2xl border-2 border-rose-100 bg-rose-50/50 hover:bg-rose-50 text-rose-600 text-sm sm:text-base font-bold transition-all"
                        >
                          <Icon name="trash" className="w-4 h-4 sm:w-5 sm:h-5" />
                          Remove super admin
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {isOwner && removedSuperAdmins.length > 0 && (
        <div className="space-y-3 sm:space-y-4 pt-2">
          <div>
            <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.18em] text-rose-500">Removed</p>
            <p className="mt-1 text-[13px] sm:text-base text-gray-500">These super admins can't sign in and their invite codes are switched off. Restore one to give the access back.</p>
          </div>
          {removedSuperAdmins.map((person) => (
            <div key={person.id} className="bg-white rounded-2xl sm:rounded-[28px] border border-rose-100 shadow-sm p-3.5 sm:p-5 flex flex-wrap items-center gap-3 sm:gap-4">
              <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-[20px] bg-gradient-to-br ${avatarColorFor(person.fullName, person.email)} flex items-center justify-center text-white text-sm sm:text-xl font-black opacity-50 shrink-0`}>
                {initialsOf(person.fullName)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-[15px] sm:text-xl font-black text-gray-900 truncate">{person.fullName}</h3>
                <p className="text-[12.5px] sm:text-base text-gray-600 font-medium truncate">{person.email}</p>
                <p className="text-[11px] sm:text-sm font-semibold text-rose-500">{person.removedAt ? `Removed ${timeAgo(person.removedAt)}` : 'Removed'}</p>
              </div>
              <button
                onClick={() => setModal({ type: 'restore', person })}
                className="inline-flex items-center justify-center gap-2 sm:gap-2.5 h-10 sm:h-[52px] px-4 sm:px-5 rounded-xl sm:rounded-2xl border-2 border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 text-sm sm:text-base font-bold transition-all"
              >
                <Icon name="undo" className="w-4 h-4 sm:w-5 sm:h-5" />
                Restore
              </button>
            </div>
          ))}
        </div>
      )}

      {modal?.type === 'add' && (
        <AddAccountModal
          title="Add Super Admin"
          subtitle="They get full super admin access and their own invite code for onboarding admins. You stay the owner."
          icon="crown"
          iconClass="bg-amber-100 text-amber-700"
          submitLabel="Add super admin"
          successTitle="Super admin added"
          onSubmit={createSuperAdmin}
          onClose={closeModal}
        />
      )}
      {modal?.type === 'password' && (
        <SetPasswordModal
          title="Change my password"
          subtitle="Choose a new password for your super admin account."
          onSubmit={changeOwnPassword}
          onClose={closeModal}
        />
      )}
      {modal?.type === 'remove' && (
        <ConfirmModal
          title="Remove super admin"
          subtitle={modal.person.fullName}
          confirmLabel="Remove super admin"
          onConfirm={() => removeSuperAdmin(modal.person.id)}
          onClose={closeModal}
        >
          <p>They will lose all access to this console immediately and their invite code stops working.</p>
          <p>Any admins they invited are transferred to you, so nobody is left without a super admin.</p>
        </ConfirmModal>
      )}
      {modal?.type === 'restore' && (
        <ConfirmModal
          title="Restore super admin"
          subtitle={modal.person.fullName}
          icon="undo"
          iconClass="bg-emerald-100 text-emerald-700"
          danger={false}
          confirmLabel="Restore super admin"
          onConfirm={() => restoreSuperAdmin(modal.person.id)}
          onClose={closeModal}
        >
          <p>They can sign in to this console again and their invite code works again.</p>
          <p>Admins that were transferred to you when they were removed stay with you.</p>
        </ConfirmModal>
      )}
    </div>
  )
}

export default SuperAdminsManage
