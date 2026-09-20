import { useState } from 'react'
import { useSuperAuth } from '../../context/AuthContext'
import { AddAccountModal, ConfirmModal, SetPasswordModal } from '../../components/AccountModals'
import { CopyButton, EmptyState, Icon, avatarColorFor, initialsOf, primaryButtonClass, timeAgo } from '../../components/ui'

const SuperAdminsManage = () => {
  const { superAdmin, superAdmins, admins, getSuperAdminById, createSuperAdmin, removeSuperAdmin, changeOwnPassword } = useSuperAuth()
  const [modal, setModal] = useState(null)
  const closeModal = () => setModal(null)

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">Access</p>
          <h1 className="mt-1 text-3xl font-black text-gray-900">Super Admins</h1>
          <p className="mt-1 text-gray-500">Super admins each have their own invite code for onboarding admins. Add trusted people to share control.</p>
        </div>
        <button onClick={() => setModal({ type: 'add' })} className={primaryButtonClass}>
          <Icon name="user-plus" className="w-5 h-5" />
          Add Super Admin
        </button>
      </div>

      <div className="space-y-4">
        {superAdmins.length === 0 ? (
          <EmptyState icon="crown" title="No super admins" />
        ) : (
          superAdmins.map((person) => {
            const isMe = person.id === superAdmin.id
            const adminCount = admins.filter((a) => a.superAdminId === person.id && !a.removed).length
            const creator = person.createdBy ? getSuperAdminById(person.createdBy) : null
            return (
              <div key={person.id} className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-5">
                <div className="flex items-start gap-4">
                  <div className={`w-16 h-16 rounded-[22px] bg-gradient-to-br ${avatarColorFor(person.fullName, person.email)} flex items-center justify-center text-white text-2xl font-black shadow-lg shrink-0`}>
                    {initialsOf(person.fullName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-2xl font-black text-gray-900 truncate">{person.fullName}</h3>
                      {isMe && <span className="px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-bold">You</span>}
                      <span className="text-sm font-semibold text-gray-500">{person.lastLoginAt ? `Active ${timeAgo(person.lastLoginAt)}` : 'Never signed in'}</span>
                    </div>
                    <p className="mt-1 text-gray-600 font-medium truncate">{person.email}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="inline-flex items-center gap-2 text-gray-500 font-semibold">
                        Invite code: <span className="text-gray-900 font-mono font-black">{person.inviteCode}</span>
                        <CopyButton value={person.inviteCode} className="!p-1.5" />
                      </span>
                      <span className="text-gray-300 hidden sm:inline">|</span>
                      <span className="text-gray-500 font-semibold">
                        Admins: <span className="text-gray-900 font-black">{adminCount}</span>
                      </span>
                      <span className="text-gray-300 hidden sm:inline">|</span>
                      <span className="text-gray-500 font-semibold">
                        Added by: <span className="text-gray-900 font-black">{creator ? (creator.id === superAdmin.id ? 'You' : creator.fullName) : person.createdBy ? 'Removed super admin' : 'First registration'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  {isMe ? (
                    <button
                      onClick={() => setModal({ type: 'password' })}
                      className="inline-flex items-center justify-center gap-2.5 h-[52px] px-5 rounded-2xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 text-gray-900 font-bold transition-all shadow-sm"
                    >
                      <Icon name="key" className="w-5 h-5" />
                      Change my password
                    </button>
                  ) : (
                    <button
                      onClick={() => setModal({ type: 'remove', person })}
                      className="inline-flex items-center justify-center gap-2.5 h-[52px] px-5 rounded-2xl border-2 border-rose-100 bg-rose-50/50 hover:bg-rose-50 text-rose-600 font-bold transition-all"
                    >
                      <Icon name="trash" className="w-5 h-5" />
                      Remove super admin
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {modal?.type === 'add' && (
        <AddAccountModal
          title="Add Super Admin"
          subtitle="They get full super admin access and their own invite code for onboarding admins."
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
    </div>
  )
}

export default SuperAdminsManage
