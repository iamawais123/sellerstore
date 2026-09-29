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
import { newestFirst, watchForAdmins, watchWithIndexFallback } from '../firebase/scoped'

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

const newest = (count) => [shopData.orderBy('at', 'desc'), shopData.limit(count)]

// Shows a failed live query on the page (and in the console) instead of throwing.
const logDataError = (setDataError) => (error, name) => {
  // eslint-disable-next-line no-console
  console.error(`[super admin data] ${name}:`, error)
  setDataError(describeError(error))
}

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
  const [accounts, setAccounts] = useState({ superAdmins: EMPTY_LIST, removedSuperAdmins: EMPTY_LIST, admins: EMPTY_LIST, ready: false, error: '' })
  // `ownerUid` is the first super admin ever registered (see meta/bootstrap): the one account that
  // manages the other super admins and that nobody else can remove. It never changes once set.
  const [bootstrap, setBootstrap] = useState({
    checked: !isFirebaseConfigured,
    open: false,
    ownerUid: null,
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
      if (!cancelled) setBootstrap({ checked: true, open: state.open, ownerUid: state.ownerUid, error: state.error })
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
  const { ownerUid } = bootstrap
  const isOwner = !!superAdminId && superAdminId === ownerUid
  const isOwnerId = (id) => !!id && id === ownerUid

  // If the first bootstrap read failed (offline, a slow start), look up the owner again once a super
  // admin is signed in, so the console never sits there not knowing who the owner is. Only the owner
  // is filled in — `open` (whether registration is still allowed) is never touched here.
  useEffect(() => {
    if (!superAdminId || bootstrap.ownerUid) return undefined
    let cancelled = false
    getBootstrapState().then((state) => {
      if (!cancelled && state.ownerUid) setBootstrap((prev) => ({ ...prev, ownerUid: state.ownerUid }))
    })
    return () => {
      cancelled = true
    }
  }, [superAdminId, bootstrap.ownerUid])

  // The accounts this console may see, live. The owner sees every admin and super admin. Any other super
  // admin works inside their own branch: the admins who belong to them, and nobody else — no other super
  // admin, no other branch's admins. What a query may ask for depends on who is asking, so this waits
  // until the owner is known.
  useEffect(() => {
    if (!superAdminId) {
      setAccounts({ superAdmins: EMPTY_LIST, removedSuperAdmins: EMPTY_LIST, admins: EMPTY_LIST, ready: false, error: '' })
      return undefined
    }
    if (!ownerUid) {
      const error = bootstrap.error || 'Could not tell who owns this console. Reload the page to try again.'
      setAccounts((prev) => (bootstrap.checked ? { ...prev, ready: true, error } : prev))
      return undefined
    }
    return watchAccounts(
      (rows) => {
        const superAdmins = rows.filter((r) => r.role === 'superadmin' && !r.removed)
        const removedSuperAdmins = rows.filter((r) => r.role === 'superadmin' && r.removed)
        const admins = rows.filter((r) => r.role === 'admin')
        setAccounts({ superAdmins, removedSuperAdmins, admins, ready: true, error: '' })
      },
      (error) => setAccounts((prev) => ({ ...prev, ready: true, error })),
      { asOwner: superAdminId === ownerUid, uid: superAdminId }
    )
  }, [superAdminId, ownerUid, bootstrap.checked, bootstrap.error])

  const { admins } = accounts
  // Only the owner ever has other super admins to list; everyone else sees just themself.
  const superAdmins = useMemo(() => (isOwner ? accounts.superAdmins : superAdmin ? [superAdmin] : EMPTY_LIST), [isOwner, accounts.superAdmins, superAdmin])
  const removedSuperAdmins = isOwner ? accounts.removedSuperAdmins : EMPTY_LIST
  // The ids of the admins in a non-owner's branch: everything below is read for those admins only.
  const myAdminIds = isOwner
    ? ''
    : admins
        .map((a) => a.id)
        .sort()
        .join(',')

  // The network, live: shops, orders and withdrawals, plus the activity feeds. The owner reads it all;
  // every other super admin reads only what belongs to their own admins (see firestore.rules).
  const [network, setNetwork] = useState({ sellers: EMPTY_LIST, orders: EMPTY_LIST, withdrawals: EMPTY_LIST })
  const [networkLogs, setNetworkLogs] = useState(EMPTY_LIST)
  const [superLogs, setSuperLogs] = useState(EMPTY_LIST)
  const [adminLogins, setAdminLogins] = useState(EMPTY_LIST)
  const [dataError, setDataError] = useState('')

  useEffect(() => {
    if (!superAdminId || !accounts.ready || !ownerUid) {
      setNetwork({ sellers: EMPTY_LIST, orders: EMPTY_LIST, withdrawals: EMPTY_LIST })
      setNetworkLogs(EMPTY_LIST)
      setAdminLogins(EMPTY_LIST)
      return undefined
    }
    const { db } = getServices(SUPER_APP)
    setDataError('')
    const onError = logDataError(setDataError)
    const setNetworkPart = (key) => (rows) => setNetwork((prev) => ({ ...prev, [key]: rows }))
    let unsubscribers
    if (isOwner) {
      unsubscribers = [
        shopData.watchList(db, shopData.COL.shops, [], setNetworkPart('sellers'), onError, shopData.mapShop),
        shopData.watchList(db, shopData.COL.orders, [], setNetworkPart('orders'), onError),
        shopData.watchList(db, shopData.COL.withdrawals, [], setNetworkPart('withdrawals'), onError),
        shopData.watchList(db, shopData.COL.activity, newest(200), setNetworkLogs, onError, shopData.mapLog),
        shopData.watchList(db, shopData.COL.adminLogins, newest(500), setAdminLogins, onError),
      ]
    } else {
      const adminIds = myAdminIds ? myAdminIds.split(',') : []
      const forMyAdmins = (name, onData, options) => watchForAdmins(db, name, adminIds, options, onData, onError)
      unsubscribers = [
        forMyAdmins(shopData.COL.shops, setNetworkPart('sellers'), { map: shopData.mapShop }),
        forMyAdmins(shopData.COL.orders, setNetworkPart('orders')),
        forMyAdmins(shopData.COL.withdrawals, setNetworkPart('withdrawals')),
        forMyAdmins(shopData.COL.activity, setNetworkLogs, { map: shopData.mapLog, newest: { field: 'at', count: 200 } }),
        forMyAdmins(shopData.COL.adminLogins, setAdminLogins, { newest: { field: 'at', count: 500 } }),
      ]
    }
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe())
  }, [superAdminId, accounts.ready, ownerUid, isOwner, myAdminIds])

  // The super admin audit trail. Each super admin reads only their own entries (including the notes left
  // when an admin registers with their invite code); the owner reads them all.
  useEffect(() => {
    if (!superAdminId || !accounts.ready || !ownerUid) {
      setSuperLogs(EMPTY_LIST)
      return undefined
    }
    const { db } = getServices(SUPER_APP)
    const onError = logDataError(setDataError)
    if (isOwner) return shopData.watchList(db, shopData.COL.superLogs, newest(200), setSuperLogs, onError)
    // Filtered by super admin and sorted by time: that needs a composite index (firestore.indexes.json).
    // If it has not been deployed yet, filter alone and sort here, so the log is never empty for lack of it.
    return watchWithIndexFallback(
      (indexed, onLogError) =>
        shopData.watchList(
          db,
          shopData.COL.superLogs,
          [shopData.where('superAdminId', '==', superAdminId), ...(indexed ? newest(200) : [])],
          (rows) => setSuperLogs(indexed ? rows : newestFirst(rows, 'at', 200)),
          onLogError
        ),
      onError
    )
  }, [superAdminId, accounts.ready, ownerUid, isOwner])

  // Admin sign-ins, grouped by admin. A "log in as admin" is recorded as "Super admin: <name>". Someone
  // else's — the owner signing in as one of your admins — would reveal who they are and what they did,
  // so outside the owner's own view only the entries made by you are kept.
  const myName = superAdmin?.fullName
  const adminLoginHistory = useMemo(
    () =>
      adminLogins
        .filter((entry) => {
          const asSuperAdmin = /^Super admin: (.*)$/.exec(entry.via || '')
          return isOwner || !asSuperAdmin || asSuperAdmin[1] === myName
        })
        .reduce((byAdmin, entry) => {
          ;(byAdmin[entry.adminId] ||= []).push(entry)
          return byAdmin
        }, {}),
    [adminLogins, isOwner, myName]
  )

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
      setBootstrap((prev) => ({ ...prev, open: false, ownerUid: result.user.uid }))
      pushLog({ type: 'super_admin_registered', title: 'Super admin account created', entity: result.profile.fullName, icon: 'crown' }, result.profile)
      return { success: true }
    })

  const loginSuperAdmin = ({ email, password, remember }) =>
    runExclusive(async () => {
      if (!(email || '').trim() || !password) return { success: false, error: 'Enter your email and password.' }
      const result = await signInSuperAdminAccount({ email, password, remember })
      if (!result.success) return result
      setOwnProfile({ uid: result.user.uid, profile: result.profile })
      pushLog({ type: 'super_admin_login', title: 'Signed in', entity: result.profile.fullName, icon: 'signin' }, result.profile)
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

  // Only the owner — the first super admin — adds, removes and restores super admins. The security
  // rules enforce this; the checks here just fail fast with a readable reason.
  const createSuperAdmin = async (fields) => {
    if (!superAdmin) return { success: false, error: 'Not logged in' }
    if (!isOwner) return { success: false, error: 'Only the owner can add super admins.' }
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
    if (isOwnerId(targetId)) return { success: false, error: 'The owner is the first super admin and cannot be removed.' }
    if (!isOwner) return { success: false, error: 'Only the owner can remove super admins.' }
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

  // Brings a removed super admin back (sign-in and invite code both). The admins that were handed to
  // the owner when they were removed stay with the owner.
  const restoreSuperAdmin = async (targetId) => {
    if (!superAdmin) return { success: false, error: 'Not logged in' }
    if (!isOwner) return { success: false, error: 'Only the owner can restore super admins.' }
    const target = removedSuperAdmins.find((s) => s.id === targetId)
    if (!target) return { success: false, error: 'Super admin not found' }
    const result = await setAccountRemoved({ target, removed: false, actorUid: superAdmin.id })
    if (!result.success) return result
    pushLog({ type: 'super_admin_restored', title: 'Super admin restored', entity: target.fullName, icon: 'shield' })
    return { success: true }
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

  // Admins belong to the super admin they registered with; only the owner can move one to themself.
  const assignAdminToMe = async (adminId) => {
    if (!superAdmin) return { success: false, error: 'Not logged in' }
    if (!isOwner) return { success: false, error: 'Only the owner can reassign admins.' }
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

  // How a super admin is named around the console: "You", the person's name (owner only — everyone else
  // never has another super admin in view), or null when there is no such active super admin.
  const superAdminName = (id) => {
    if (!id) return null
    if (id === superAdminId) return 'You'
    return getSuperAdminById(id)?.fullName || null
  }

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
    ownerUid,
    isOwner,
    isOwnerId,
    superAdmins,
    removedSuperAdmins,
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
    restoreSuperAdmin,
    addAdmin,
    setAdminRemoved,
    resetAdminPassword,
    assignAdminToMe,
    loginAsAdmin,
    getSuperAdminById,
    superAdminName,
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
