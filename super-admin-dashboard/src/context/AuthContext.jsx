import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  NOT_CONFIGURED_MESSAGE,
  SUPER_APP,
  assignAdmin,
  changeOwnPasswordTo,
  getBootstrapState,
  isFirebaseConfigured,
  newInviteCode,
  provisionAccount,
  registerSuperAdminAccount,
  sendPasswordResetTo,
  setAccountRemoved,
  signInSuperAdminAccount,
  signOutSuperAdminAccount,
  subscribeAuth,
  updateOwnInviteCode,
  watchAccounts,
  watchOwnProfile,
} from '../firebase/accounts'
import { describeError, getServices } from '../firebase/core'
import * as shopData from '../firebase/shopData'

// Everything here is live from Firebase: accounts (Auth + Firestore `users`) and the shop data the
// admins' networks produce (sellers, orders, withdrawals, activity), which this console only reads.
// The one thing handed over to another console through localStorage is a "log in as admin" session:
// the admin console (same origin) picks it up and, having no Firebase user for that admin, reads and
// writes with this super admin's own Firebase session instead.
const KEYS = {
  adminSession: 'uss_admin_auth',
  impersonation: 'uss_admin_impersonation',
}

const EMPTY_LIST = []

const AuthContext = createContext(null)

const writeJSON = (key, value) => {
  try {
    if (value == null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch (_) {}
}

const generateStrongPassword = (len = 14) => {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghjkmnpqrstuvwxyz'
  const nums = '23456789'
  const syms = '!@#$%^&*()_+-='
  const all = upper + lower + nums + syms
  const pick = (set) => set[Math.floor(Math.random() * set.length)]
  let pw = pick(upper) + pick(lower) + pick(nums) + pick(syms)
  for (let i = pw.length; i < len; i++) pw += pick(all)
  return pw.split('').sort(() => Math.random() - 0.5).join('')
}

const validateAccountFields = ({ fullName, email, password }) => {
  if (!(fullName || '').trim()) return 'Please enter a full name.'
  if (!(email || '').trim()) return 'Please enter an email address.'
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'Please enter a valid email address.'
  if (!password) return 'Please enter a password.'
  if (password.length < 6) return 'Password must be at least 6 characters.'
  return null
}

const ORDER_PENDING = ['Unpaid', 'Paid']
const ORDER_IN_DELIVERY = ['Pickup', 'On the way', 'Out for delivery']

export function SuperAuthProvider({ children }) {
  // ---- Firebase session state ----------------------------------------------------------------
  const [authReady, setAuthReady] = useState(!isFirebaseConfigured)
  const [authUid, setAuthUid] = useState(null)
  // The signed-in account's own profile, tagged with the user it was resolved for. Readiness is
  // derived from that tag (not a separate flag) so there is never a render where a user is known
  // but their profile is not yet — which would look "logged out" and bounce off protected routes.
  const [ownProfile, setOwnProfile] = useState({ uid: null, profile: null })
  const profile = ownProfile.uid === authUid ? ownProfile.profile : null
  const profileReady = !authUid || ownProfile.uid === authUid
  const [accounts, setAccounts] = useState({ superAdmins: EMPTY_LIST, admins: EMPTY_LIST, ready: false, error: '' })
  const [bootstrap, setBootstrap] = useState({
    checked: !isFirebaseConfigured,
    open: false,
    error: isFirebaseConfigured ? '' : NOT_CONFIGURED_MESSAGE,
  })

  // While a sign-in / registration is in flight it sets the session itself; the profile listener
  // must not sign the user out just because their profile document doesn't exist *yet*.
  const busyRef = useRef(0)
  const runExclusive = async (task) => {
    busyRef.current += 1
    try {
      return await task()
    } finally {
      busyRef.current -= 1
    }
  }

  useEffect(
    () =>
      subscribeAuth(SUPER_APP, (user) => {
        setAuthUid(user ? user.uid : null)
        setAuthReady(true)
      }),
    []
  )

  useEffect(() => {
    let cancelled = false
    getBootstrapState().then((state) => {
      if (!cancelled) setBootstrap({ checked: true, open: state.open, error: state.error })
    })
    return () => {
      cancelled = true
    }
  }, [])

  // The signed-in account's own profile. Removing a super admin (or anything that stops the profile
  // being a live super admin) takes effect immediately, in every tab.
  useEffect(() => {
    if (!authUid) return undefined
    return watchOwnProfile(authUid, (next) => {
      if (next && next.role === 'superadmin' && !next.removed) {
        setOwnProfile({ uid: authUid, profile: next })
        return
      }
      if (busyRef.current) return
      setOwnProfile({ uid: authUid, profile: null })
      signOutSuperAdminAccount()
    })
  }, [authUid])

  const superAdmin = profile
  const superAdminId = profile?.id || null

  // Every admin and super admin, live.
  useEffect(() => {
    if (!superAdminId) {
      setAccounts({ superAdmins: EMPTY_LIST, admins: EMPTY_LIST, ready: false, error: '' })
      return undefined
    }
    return watchAccounts(
      (rows) => {
        const superAdmins = rows.filter((r) => r.role === 'superadmin' && !r.removed)
        const admins = rows.filter((r) => r.role === 'admin')
        setAccounts({ superAdmins, admins, ready: true, error: '' })
      },
      (error) => setAccounts((prev) => ({ ...prev, ready: true, error }))
    )
  }, [superAdminId])

  // The whole network, live: every seller shop, order and withdrawal, plus the activity feeds. Only
  // a super admin can read across admins (see firestore.rules).
  const [network, setNetwork] = useState({ sellers: EMPTY_LIST, orders: EMPTY_LIST, withdrawals: EMPTY_LIST })
  const [networkLogs, setNetworkLogs] = useState(EMPTY_LIST)
  const [superLogs, setSuperLogs] = useState(EMPTY_LIST)
  const [adminLogins, setAdminLogins] = useState(EMPTY_LIST)
  const [dataError, setDataError] = useState('')

  useEffect(() => {
    if (!superAdminId) {
      setNetwork({ sellers: EMPTY_LIST, orders: EMPTY_LIST, withdrawals: EMPTY_LIST })
      setNetworkLogs(EMPTY_LIST)
      setSuperLogs(EMPTY_LIST)
      setAdminLogins(EMPTY_LIST)
      return undefined
    }
    const { db } = getServices(SUPER_APP)
    setDataError('')
    const onError = (error, name) => {
      // eslint-disable-next-line no-console
      console.error(`[super admin data] ${name}:`, error)
      setDataError(describeError(error))
    }
    const newest = (count) => [shopData.orderBy('at', 'desc'), shopData.limit(count)]
    const unsubscribers = [
      shopData.watchList(db, shopData.COL.shops, [], (rows) => setNetwork((prev) => ({ ...prev, sellers: rows })), onError, shopData.mapShop),
      shopData.watchList(db, shopData.COL.orders, [], (rows) => setNetwork((prev) => ({ ...prev, orders: rows })), onError),
      shopData.watchList(db, shopData.COL.withdrawals, [], (rows) => setNetwork((prev) => ({ ...prev, withdrawals: rows })), onError),
      shopData.watchList(db, shopData.COL.activity, newest(200), setNetworkLogs, onError, shopData.mapLog),
      shopData.watchList(db, shopData.COL.superLogs, newest(200), setSuperLogs, onError),
      shopData.watchList(db, shopData.COL.adminLogins, newest(500), setAdminLogins, onError),
    ]
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe())
  }, [superAdminId])

  const adminLoginHistory = useMemo(
    () =>
      adminLogins.reduce((byAdmin, entry) => {
        ;(byAdmin[entry.adminId] ||= []).push(entry)
        return byAdmin
      }, {}),
    [adminLogins]
  )

  const { superAdmins, admins } = accounts
  const loading = !authReady || (!!authUid && !profileReady) || (!!superAdminId && !accounts.ready)

  // Best effort: a failed log line never fails the action it describes.
  const pushLog = (entry, actor = superAdmin) =>
    shopData.pushSuperLog(getServices(SUPER_APP).db, {
      superAdminId: actor?.id || '',
      actorId: actor?.id || '',
      actorName: actor?.fullName || '',
      ...entry,
    })

  // ---- Super admin accounts ------------------------------------------------------------------

  // Registration is only open until the first super admin exists. After that, super admins are
  // created from inside the console by an existing one (see createSuperAdmin).
  const canRegisterSuperAdmin = bootstrap.open

  const registerSuperAdmin = (fields) =>
    runExclusive(async () => {
      const problem = validateAccountFields(fields)
      if (problem) return { success: false, error: problem }
      const result = await registerSuperAdminAccount(fields)
      if (!result.success) return result
      setOwnProfile({ uid: result.user.uid, profile: result.profile })
      setBootstrap((prev) => ({ ...prev, open: false }))
      pushLog({ type: 'super_admin_registered', title: 'Super admin account created', entity: result.profile.fullName, icon: 'crown' }, result.profile)
      return { success: true }
    })

  const loginSuperAdmin = ({ email, password, remember }) =>
    runExclusive(async () => {
      if (!(email || '').trim() || !password) return { success: false, error: 'Enter your email and password.' }
      const result = await signInSuperAdminAccount({ email, password, remember })
      if (!result.success) return result
      setOwnProfile({ uid: result.user.uid, profile: result.profile })
      return { success: true }
    })

  const logoutSuperAdmin = () => {
    signOutSuperAdminAccount()
  }

  const applyOwnInviteCode = async (produce) => {
    if (!superAdmin) return { success: false, error: 'Not logged in' }
    const result = await produce()
    if (!result.success) return result
    pushLog({ type: 'invite_change', title: 'Invite code updated', entity: result.code, icon: 'key' })
    return { success: true }
  }

  const updateInviteCode = (rawCode) =>
    applyOwnInviteCode(() => updateOwnInviteCode({ uid: superAdmin.id, fullName: superAdmin.fullName, oldCode: superAdmin.inviteCode, rawNewCode: rawCode }))

  const regenerateInviteCode = () =>
    applyOwnInviteCode(async () => {
      try {
        return await updateOwnInviteCode({ uid: superAdmin.id, fullName: superAdmin.fullName, oldCode: superAdmin.inviteCode, rawNewCode: await newInviteCode() })
      } catch (error) {
        return { success: false, error: error?.message || 'Could not generate a new invite code.' }
      }
    })

  const changeOwnPassword = async (newPassword) => {
    if (!superAdmin) return { success: false, error: 'Not logged in' }
    if (!newPassword || newPassword.length < 6) return { success: false, error: 'Password must be at least 6 characters' }
    const result = await changeOwnPasswordTo(newPassword)
    if (result.success) pushLog({ type: 'password_change', title: 'Your password was changed', entity: superAdmin.fullName, icon: 'key' })
    return result
  }

  const createSuperAdmin = async (fields) => {
    if (!superAdmin) return { success: false, error: 'Not logged in' }
    const problem = validateAccountFields(fields)
    if (problem) return { success: false, error: problem }
    const result = await provisionAccount({ role: 'superadmin', ...fields, createdBy: superAdmin.id })
    if (!result.success) return result
    pushLog({ type: 'super_admin_created', title: 'Super admin added', entity: result.record.fullName, icon: 'crown' })
    return { success: true, superAdmin: result.record }
  }

  // Admins invited by the removed super admin are handed to the super admin doing the removal so
  // no admin is ever left without an owner.
  const removeSuperAdmin = async (targetId) => {
    if (!superAdmin) return { success: false, error: 'Not logged in' }
    if (targetId === superAdmin.id) return { success: false, error: 'You cannot remove your own super admin account.' }
    const target = superAdmins.find((s) => s.id === targetId)
    if (!target) return { success: false, error: 'Super admin not found' }
    const adminIds = admins.filter((a) => a.superAdminId === targetId).map((a) => a.id)
    const result = await setAccountRemoved({
      target,
      removed: true,
      actorUid: superAdmin.id,
      reassignAdminsTo: superAdmin.id,
      adminIdsToReassign: adminIds,
    })
    if (!result.success) return result
    pushLog({
      type: 'super_admin_removed',
      title: adminIds.length ? `Super admin removed (${adminIds.length} admin${adminIds.length === 1 ? '' : 's'} transferred to you)` : 'Super admin removed',
      entity: target.fullName,
      icon: 'trash',
    })
    return { success: true, transferred: adminIds.length }
  }

  // ---- Admin accounts ------------------------------------------------------------------------

  const addAdmin = async (fields) => {
    if (!superAdmin) return { success: false, error: 'Not logged in' }
    const problem = validateAccountFields(fields)
    if (problem) return { success: false, error: problem }
    const result = await provisionAccount({ role: 'admin', ...fields, superAdminId: superAdmin.id })
    if (!result.success) return result
    pushLog({ type: 'admin_added', title: 'Admin added', entity: result.record.fullName, icon: 'signup' })
    return { success: true, admin: result.record }
  }

  const setAdminRemoved = async (adminId, removed) => {
    const target = admins.find((a) => a.id === adminId)
    if (!target) return { success: false, error: 'Admin not found' }
    const result = await setAccountRemoved({ target, removed, actorUid: superAdmin?.id || null })
    if (!result.success) return result
    pushLog({
      type: removed ? 'admin_removed' : 'admin_restored',
      title: removed ? 'Admin removed' : 'Admin restored',
      entity: target.fullName,
      icon: removed ? 'trash' : 'shield',
    })
    return { success: true }
  }

  // Passwords live in Firebase Auth and can't be read or chosen from here, so the admin is sent a
  // reset link instead.
  const resetAdminPassword = async (adminId) => {
    const target = admins.find((a) => a.id === adminId)
    if (!target) return { success: false, error: 'Admin not found' }
    const result = await sendPasswordResetTo(target.email)
    if (!result.success) return result
    pushLog({ type: 'admin_password_reset', title: 'Password reset email sent to admin', entity: target.fullName, icon: 'key' })
    return { success: true }
  }

  const assignAdminToMe = async (adminId) => {
    if (!superAdmin) return { success: false, error: 'Not logged in' }
    const target = admins.find((a) => a.id === adminId)
    if (!target) return { success: false, error: 'Admin not found' }
    const result = await assignAdmin(adminId, superAdmin.id)
    if (!result.success) return result
    pushLog({ type: 'admin_assigned', title: 'Admin assigned to you', entity: target.fullName, icon: 'users' })
    return { success: true }
  }

  // Signs the browser into the admin console as `adminId`. Both consoles share one origin, so
  // writing the admin session is all the admin app needs; the caller then navigates there. (The
  // admin console then uses this super admin's Firebase session to read and write that admin's
  // data — the admin has no Firebase session here — so it can't change the admin's password or
  // invite code.) Async so the audit lines are saved before the caller navigates away.
  const loginAsAdmin = async (adminId) => {
    if (!superAdmin) return { success: false, error: 'Not logged in' }
    const target = admins.find((a) => a.id === adminId)
    if (!target) return { success: false, error: 'Admin not found' }
    if (target.removed) return { success: false, error: 'This admin has been removed. Restore them first.' }
    const { db } = getServices(SUPER_APP)
    await Promise.all([
      shopData.logAdminLogin(db, adminId, `Super admin: ${superAdmin.fullName}`),
      pushLog({ type: 'admin_impersonate', title: 'Signed in as admin', entity: target.fullName, icon: 'signin' }),
    ])
    writeJSON(KEYS.adminSession, target)
    writeJSON(KEYS.impersonation, {
      adminId,
      superAdminId: superAdmin.id,
      superAdminName: superAdmin.fullName,
      at: new Date().toISOString(),
    })
    return { success: true }
  }

  // ---- Read helpers ----

  const getSuperAdminById = (id) => superAdmins.find((s) => s.id === id) || null

  const getAdminLoginHistory = (adminId) => adminLoginHistory[adminId] || EMPTY_LIST

  const getAdminStats = (adminId) => {
    const sellerList = network.sellers.filter((s) => s.adminId === adminId && !s.deleted)
    const ids = new Set(sellerList.map((s) => s.id))
    const orders = network.orders.filter((o) => ids.has(o.sellerId) && Array.isArray(o.items))
    const delivered = orders.filter((o) => o.status === 'Delivered')
    const pendingWithdrawals = network.withdrawals.filter((w) => ids.has(w.sellerId) && w.status === 'Pending').length
    return {
      sellerList,
      sellers: sellerList.length,
      verifiedSellers: sellerList.filter((s) => s.verified).length,
      pendingKYC: sellerList.filter((s) => !s.verified).length,
      balance: sellerList.reduce((sum, s) => sum + (s.balance || 0), 0),
      guarantee: sellerList.reduce((sum, s) => sum + (s.guarantee || 0), 0),
      orders: orders.length,
      pendingOrders: orders.filter((o) => ORDER_PENDING.includes(o.status)).length,
      inDelivery: orders.filter((o) => ORDER_IN_DELIVERY.includes(o.status)).length,
      delivered: delivered.length,
      revenue: delivered.reduce((sum, o) => sum + (o.total || 0), 0),
      pendingWithdrawals,
    }
  }

  const value = {
    superAdmin,
    isSuperAdminLoggedIn: !!superAdmin,
    loading,
    firebaseConfigured: isFirebaseConfigured,
    bootstrapReady: bootstrap.checked,
    bootstrapError: bootstrap.error,
    accountsError: accounts.error,
    dataError,
    canRegisterSuperAdmin,
    superAdmins,
    admins,
    superLogs,
    networkLogs,
    registerSuperAdmin,
    loginSuperAdmin,
    logoutSuperAdmin,
    updateInviteCode,
    regenerateInviteCode,
    changeOwnPassword,
    createSuperAdmin,
    removeSuperAdmin,
    addAdmin,
    setAdminRemoved,
    resetAdminPassword,
    assignAdminToMe,
    loginAsAdmin,
    getSuperAdminById,
    getAdminLoginHistory,
    getAdminStats,
    generatePassword: generateStrongPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useSuperAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useSuperAuth must be used within SuperAuthProvider')
  return ctx
}
