import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { masterCatalog } from '../data/masterCatalog'
import {
  ADMIN_APP,
  SUPER_APP,
  findSuperAdminByInviteCode,
  loadAdminProfile,
  newInviteCode,
  registerAdminAccount,
  sendPasswordResetTo,
  signInAdminAccount,
  signOutAdminAccount,
  subscribeAuth,
  updateOwnInviteCode,
  watchAdminProfile,
} from '../firebase/accounts'
import { describeError, getServices } from '../firebase/core'
import * as shopData from '../firebase/shopData'

const AuthContext = createContext(null)

// Session hand-offs between the consoles (same origin). The data itself lives in Firestore.
const ADMIN_KEY = 'uss_admin_auth' // cached admin session (so a reload doesn't flash the login page)
const ADMIN_IMPERSONATION_KEY = 'uss_admin_impersonation' // written by the super-admin console's "log in as admin"
const SELLER_IMPERSONATION_KEY = 'uss_seller_impersonation' // read by the storefront's "log in as seller"

const generateInviteCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

const readStored = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    if (raw != null) return JSON.parse(raw)
  } catch (_) {}
  return fallback
}

const writeStored = (key, value) => {
  try {
    if (value == null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch (_) {}
}

const stripPassword = ({ password, ...rest }) => rest

const defaultAdmin = {
  id: null,
  fullName: 'Administrator',
  email: '',
  inviteCode: generateInviteCode(),
  memberSince: '',
}

const EMPTY = []

const groupBy = (list, key) =>
  list.reduce((groups, item) => {
    ;(groups[item[key]] ||= []).push(item)
    return groups
  }, {})

const NO_STATS = { total: 0, pending: 0, delivered: 0 }

// The admin console's data layer. Everything an admin sees or changes — their sellers' shops, KYC,
// orders, withdrawals, notifications, support chat, ledger, campaigns and activity — is live from
// Firestore, scoped to the sellers who joined through this admin's invite code. What sellers do in
// the storefront (paying orders, requesting withdrawals, signing up) appears here as it happens.
export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    const cached = readStored(ADMIN_KEY, null)
    return cached ? { ...defaultAdmin, ...cached } : defaultAdmin
  })
  const [impersonation, setImpersonation] = useState(() => readStored(ADMIN_IMPERSONATION_KEY, null))

  // While a sign-in / registration is in flight it sets the session itself, so the auth listener
  // must not race it (Firebase reports state changes half-way through creating an account).
  const busyRef = useRef(0)
  const adminRef = useRef(admin)
  adminRef.current = admin
  const impersonationRef = useRef(impersonation)
  impersonationRef.current = impersonation

  useEffect(() => {
    try {
      if (admin && admin.id) localStorage.setItem(ADMIN_KEY, JSON.stringify(admin))
      else localStorage.removeItem(ADMIN_KEY)
    } catch (_) {}
  }, [admin])

  // A super admin's "log in as admin" session has no Firebase user of its own: it is a local
  // session, and this console then reads and writes with the *super admin's* Firebase identity.
  const impersonatedNow = !!(impersonation && admin.id && impersonation.adminId === admin.id)
  const identityApp = impersonatedNow ? SUPER_APP : ADMIN_APP

  const [adminFirebaseUid, setAdminFirebaseUid] = useState(null)
  const [superFirebaseUid, setSuperFirebaseUid] = useState(null)
  const identityReady = impersonatedNow ? !!superFirebaseUid : !!admin.id && adminFirebaseUid === admin.id

  const adoptAdminProfile = (profile) => setAdmin({ ...defaultAdmin, ...stripPassword(profile) })

  const clearImpersonation = () => {
    writeStored(ADMIN_IMPERSONATION_KEY, null)
    setImpersonation(null)
  }

  const endAdminSession = () => {
    try {
      localStorage.removeItem(ADMIN_KEY)
    } catch (_) {}
    setAdmin(defaultAdmin)
  }

  // Keep the session in step with Firebase Auth (expired, signed out in another tab, or restored
  // after the browser was reopened).
  useEffect(
    () =>
      subscribeAuth(ADMIN_APP, async (user) => {
        if (busyRef.current) return
        setAdminFirebaseUid(user ? user.uid : null)
        const current = adminRef.current
        const impersonating = impersonationRef.current?.adminId === current.id
        if (!user) {
          if (current.id && !impersonating) endAdminSession()
          return
        }
        if (current.id === user.uid || impersonating) return
        const profile = await loadAdminProfile(user.uid)
        if (busyRef.current) return
        if (!profile || profile.role !== 'admin' || profile.removed) {
          await signOutAdminAccount()
          return
        }
        adoptAdminProfile(profile)
      }),
    []
  )

  // The super admin's session, only while one of their "log in as admin" sessions is open. If it is
  // gone (signed out, expired) the impersonation can no longer read anything, so it ends.
  useEffect(() => {
    if (!impersonatedNow) {
      setSuperFirebaseUid(null)
      return undefined
    }
    return subscribeAuth(SUPER_APP, (user) => {
      if (user) {
        setSuperFirebaseUid(user.uid)
        return
      }
      setSuperFirebaseUid(null)
      clearImpersonation()
      endAdminSession()
    })
  }, [impersonatedNow])

  // Live view of the signed-in admin's own profile: a super admin removing the account (or changing
  // the invite code) takes effect immediately, in this tab or any other.
  useEffect(() => {
    if (!admin.id || !identityReady) return undefined
    return watchAdminProfile(
      admin.id,
      (profile) => {
        if (busyRef.current) return
        if (!profile || profile.role !== 'admin' || profile.removed) {
          if (impersonatedNow) clearImpersonation()
          else signOutAdminAccount()
          endAdminSession()
          return
        }
        adoptAdminProfile(profile)
      },
      identityApp
    )
  }, [admin.id, identityApp, identityReady, impersonatedNow])

  // The impersonation record is written by another console (same origin), so follow it.
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === ADMIN_IMPERSONATION_KEY || event.key === null) setImpersonation(readStored(ADMIN_IMPERSONATION_KEY, null))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // ---- live data ---------------------------------------------------------------------------------
  const [shops, setShops] = useState(EMPTY)
  const [orders, setOrders] = useState(EMPTY)
  const [withdrawals, setWithdrawals] = useState(EMPTY)
  const [notifications, setNotifications] = useState(EMPTY)
  const [ledger, setLedger] = useState(EMPTY)
  const [campaigns, setCampaigns] = useState(EMPTY)
  const [loginHistory, setLoginHistory] = useState(EMPTY)
  const [conversations, setConversations] = useState(EMPTY)
  const [adminLogs, setAdminLogs] = useState(EMPTY)
  const [dataError, setDataError] = useState('')

  useEffect(() => {
    const clear = () => {
      ;[setShops, setOrders, setWithdrawals, setNotifications, setLedger, setCampaigns, setLoginHistory, setConversations, setAdminLogs].forEach((set) => set(EMPTY))
    }
    if (!admin.id || !identityReady) {
      clear()
      return undefined
    }
    const { db } = getServices(identityApp)
    setDataError('')
    const onError = (error, name) => {
      // eslint-disable-next-line no-console
      console.error(`[admin data] ${name}:`, error)
      setDataError(describeError(error))
    }
    const mine = [shopData.where('adminId', '==', admin.id)]
    const unsubscribers = [
      shopData.watchList(db, shopData.COL.shops, mine, setShops, onError, shopData.mapShop),
      shopData.watchList(db, shopData.COL.orders, mine, (rows) => setOrders(rows.filter((order) => Array.isArray(order.items))), onError),
      shopData.watchList(db, shopData.COL.withdrawals, mine, setWithdrawals, onError),
      shopData.watchList(db, shopData.COL.notifications, mine, setNotifications, onError, shopData.mapNotification),
      shopData.watchList(db, shopData.COL.ledger, mine, setLedger, onError, shopData.mapTimed),
      shopData.watchList(db, shopData.COL.campaigns, mine, setCampaigns, onError),
      shopData.watchList(db, shopData.COL.loginHistory, mine, setLoginHistory, onError, shopData.mapTimed),
      shopData.watchList(db, shopData.COL.support, mine, setConversations, onError, shopData.mapConversation),
      // The 100 most recent lines of this admin's network activity (needs the composite index in firestore.indexes.json).
      shopData.watchList(db, shopData.COL.activity, [...mine, shopData.orderBy('at', 'desc'), shopData.limit(100)], setAdminLogs, onError, shopData.mapLog),
    ]
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe())
  }, [admin.id, identityApp, identityReady])

  const sellersRegistry = shops
  const ordersBySeller = useMemo(() => groupBy(shopData.sortNewest(orders), 'sellerId'), [orders])
  const withdrawalsBySeller = useMemo(() => groupBy(shopData.sortNewest(withdrawals), 'sellerId'), [withdrawals])
  // One collection holds both directions: notes the admin sent to a seller, and the chat notes
  // sellers raised for the admin (`recipient: 'admin'`).
  const sortedNotifications = useMemo(() => shopData.sortNewest(notifications), [notifications])
  const notificationsBySeller = useMemo(
    () => groupBy(sortedNotifications.filter((item) => item.recipient !== 'admin'), 'sellerId'),
    [sortedNotifications]
  )
  const adminNotifications = useMemo(() => sortedNotifications.filter((item) => item.recipient === 'admin'), [sortedNotifications])
  const ledgerBySeller = useMemo(() => groupBy(shopData.sortNewest(ledger, 'at'), 'sellerId'), [ledger])
  const campaignsBySeller = useMemo(() => groupBy(shopData.sortNewest(campaigns), 'sellerId'), [campaigns])
  const loginsBySeller = useMemo(() => groupBy(shopData.sortNewest(loginHistory, 'at'), 'sellerId'), [loginHistory])

  // The Firestore instance and uid of whoever is acting (the admin, or the super admin behind a
  // "log in as admin" session).
  const acting = () => {
    const { db, auth } = getServices(identityApp)
    return { db, actorId: auth.currentUser?.uid || admin.id }
  }
  const shopById = (sellerId) => shops.find((item) => item.id === sellerId)
  const withShop = (sellerId, run) => {
    const target = shopById(sellerId)
    if (!target) return Promise.resolve({ success: false, error: 'Seller not found' })
    const { db, actorId } = acting()
    return run(db, target, actorId)
  }

  // ---- account session ----------------------------------------------------------------------------

  const runExclusive = async (task) => {
    busyRef.current += 1
    try {
      return await task()
    } finally {
      busyRef.current -= 1
    }
  }

  // Admin accounts are created either by registering with a super admin's invite code (below) or
  // directly from the super-admin console, so signing in never creates an account on its own.
  const loginAdmin = ({ email, password, remember }) =>
    runExclusive(async () => {
      const result = await signInAdminAccount({ email, password, remember })
      if (!result.success) return result
      clearImpersonation()
      adoptAdminProfile(result.profile)
      setAdminFirebaseUid(result.user.uid)
      shopData.logAdminLogin(getServices(ADMIN_APP).db, result.user.uid, 'Admin console')
      return { success: true }
    })

  const registerAdmin = ({ fullName, email, password, inviteCode }) =>
    runExclusive(async () => {
      const name = (fullName || '').trim()
      const mail = (email || '').trim()
      if (!name || !mail || !password) return { success: false, error: 'Please fill in your name, email and password.' }
      if (password.length < 6) return { success: false, error: 'Password must be at least 6 characters.' }
      const result = await registerAdminAccount({ fullName: name, email: mail, password, inviteCode })
      if (!result.success) return result
      clearImpersonation()
      adoptAdminProfile(result.profile)
      setAdminFirebaseUid(result.user.uid)
      const { db } = getServices(ADMIN_APP)
      shopData.logAdminLogin(db, result.user.uid, 'Admin console')
      shopData.pushSuperLog(db, {
        superAdminId: result.superAdmin.ownerUid,
        actorId: result.user.uid,
        actorName: name,
        type: 'admin_registered',
        title: 'Admin registered with your invite code',
        entity: name,
        icon: 'signup',
      })
      return { success: true }
    })

  const logoutAdmin = () => {
    endAdminSession()
    clearImpersonation()
    signOutAdminAccount()
  }

  const pushAdminLog = (entry) => {
    const { db, actorId } = acting()
    return shopData.pushActivity(db, { adminId: admin.id, actorId, ...entry })
  }

  // Invite codes are owned by Firestore; only the admin themselves (or a super admin from the
  // super-admin console) can change one, so a "log in as admin" session cannot.
  const applyInviteCode = async (produce) => {
    if (!admin.id) return { success: false, error: 'Not logged in' }
    if (impersonatedNow) return { success: false, error: 'Invite codes can only be changed by the admin themselves, or from the super-admin console.' }
    const result = await produce()
    if (!result.success) return result
    setAdmin((prev) => ({ ...prev, inviteCode: result.code }))
    pushAdminLog({ type: 'invite_change', title: 'Invite code updated', entity: result.code, icon: 'key' })
    return { success: true }
  }

  const updateAdminInviteCode = (newCode) =>
    applyInviteCode(() => updateOwnInviteCode({ uid: admin.id, fullName: admin.fullName, oldCode: admin.inviteCode, rawNewCode: newCode }))

  const regenerateAdminInviteCode = () =>
    applyInviteCode(async () => {
      try {
        return await updateOwnInviteCode({ uid: admin.id, fullName: admin.fullName, oldCode: admin.inviteCode, rawNewCode: await newInviteCode() })
      } catch (error) {
        return { success: false, error: error?.message || 'Could not generate a new invite code.' }
      }
    })

  // ---- sellers ---------------------------------------------------------------------------------------

  const getSellersForAdmin = (adminIdFilter = admin.id) => (adminIdFilter ? shops.filter((s) => s.adminId === adminIdFilter) : EMPTY)

  const getAllSellersCount = (adminIdFilter = admin.id) => shops.filter((s) => s.adminId === adminIdFilter && !s.deleted).length

  const getPendingKYCCount = (adminIdFilter = admin.id) => shops.filter((s) => s.adminId === adminIdFilter && !s.verified && !s.deleted).length

  const getVerifiedSellersForAdmin = (adminIdFilter = admin.id) => getSellersForAdmin(adminIdFilter).filter((s) => s.verified && !s.deleted)

  // Passwords live in Firebase Auth and can't be read or set from here, so the seller is sent a
  // password reset email instead.
  const sendSellerPasswordReset = async (sellerId) => {
    const target = shopById(sellerId)
    if (!target?.email) return { success: false, error: 'This seller has no email address on file.' }
    const result = await sendPasswordResetTo(target.email)
    if (result.success) {
      pushAdminLog({ type: 'seller_password_reset', title: 'Password reset email sent', entity: target.fullName, sellerId, icon: 'key' })
    }
    return result
  }

  // Opens the storefront's seller portal as `sellerId`. The portal reads that seller's data with this
  // console's own Firebase identity, so the hand-off only names the seller and which identity to use.
  const impersonateSellerLogin = async (sellerId) => {
    const target = shopById(sellerId)
    if (!target) return { success: false, error: 'Seller not found' }
    const { db, actorId } = acting()
    // Awaited so the log lines are saved before the caller navigates away.
    await shopData.recordImpersonation(db, target, actorId)
    writeStored(SELLER_IMPERSONATION_KEY, { sellerId, via: identityApp, adminId: target.adminId, at: new Date().toISOString() })
    return { success: true, seller: target }
  }

  const sendSellerNotification = (sellerId, notification) =>
    withShop(sellerId, (db, target, actorId) => shopData.sendNotification(db, target, notification, actorId))

  const getSellerNotifications = (sellerId) => notificationsBySeller[sellerId] || EMPTY

  const getSellerLoginHistory = (sellerId) => (loginsBySeller[sellerId] || EMPTY).slice(0, 50)

  const getSellerLedger = (sellerId) => ledgerBySeller[sellerId] || EMPTY

  const adjustSellerBalance = (sellerId, amount, action) =>
    withShop(sellerId, (db, target, actorId) => shopData.adjustBalance(db, target, amount, action, actorId))

  const adjustSellerGuarantee = (sellerId, amount, action) =>
    withShop(sellerId, (db, target, actorId) => shopData.adjustGuarantee(db, target, amount, action, actorId))

  const adjustSellerRating = (sellerId, rating) => withShop(sellerId, (db, target, actorId) => shopData.setRating(db, target, rating, actorId))

  const adjustSellerProductLimit = (sellerId, limit) => withShop(sellerId, (db, target, actorId) => shopData.setProductLimit(db, target, limit, actorId))

  const suspendSellerAccount = (sellerId, suspended) => withShop(sellerId, (db, target, actorId) => shopData.setSuspended(db, target, suspended, actorId))

  const toggleSellerWithdrawals = (sellerId, blocked) => withShop(sellerId, (db, target, actorId) => shopData.setWithdrawalsBlocked(db, target, blocked, actorId))

  const toggleSellerProductRemoval = (sellerId, allowed) => withShop(sellerId, (db, target, actorId) => shopData.setProductRemoval(db, target, allowed, actorId))

  const toggleSellerDeleted = (sellerId, deleted) => withShop(sellerId, (db, target, actorId) => shopData.setDeleted(db, target, deleted, actorId))

  const getSellerActivityStats = (sellerId) => {
    const target = shopById(sellerId)
    const sellerOrders = ordersBySeller[sellerId] || EMPTY
    const sellerWithdrawals = withdrawalsBySeller[sellerId] || EMPTY
    const completedOrders = sellerOrders.filter((o) => o.status === 'Delivered')
    return {
      shopBalance: target?.balance || 0,
      guarantee: target?.guarantee || 0,
      totalViews: target?.views?.total || 0,
      todaysViews: target?.views?.today || 0,
      ordersTotal: sellerOrders.length,
      ordersCompleted: completedOrders.length,
      ordersCancelled: sellerOrders.filter((o) => o.status === 'Cancelled').length,
      revenue: completedOrders.reduce((sum, o) => sum + (o.total || 0), 0),
      profit: completedOrders.reduce((sum, o) => sum + (o.profit || 0), 0),
      withdrawn: sellerWithdrawals.filter((w) => w.status === 'Completed').reduce((sum, w) => sum + (w.amount || 0), 0),
      pendingWithdrawals: sellerWithdrawals.filter((w) => w.status === 'Pending').length,
    }
  }

  // ---- support chat ------------------------------------------------------------------------------------

  const getSupportConversations = (role, sellerId, adminIdFilter = admin.id) =>
    conversations
      .map((conversation) => ({
        ...conversation,
        seller: shopById(conversation.sellerId) || { fullName: 'Seller', shopName: 'Seller shop', email: '' },
      }))
      .filter((conversation) => (role === 'admin' ? conversation.adminId === adminIdFilter : conversation.sellerId === sellerId))
      .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))

  const sendSupportMessage = (conversationId, sender, text, sellerId) => {
    const target = shopById(sellerId || conversations.find((item) => item.id === conversationId)?.sellerId)
    if (!target) return Promise.resolve({ success: false, error: 'Seller not found' })
    return shopData.sendSupportMessage(acting().db, target, sender, text)
  }

  const markSupportRead = async (conversationId, role) => {
    const conversation = conversations.find((item) => item.id === conversationId)
    if (!conversation) return { success: true }
    const unread = role === 'admin' ? conversation.unreadForAdmin : conversation.unreadForSeller
    // The chat notes this conversation raised for the admin are read along with it.
    const noteIds = adminNotifications
      .filter((item) => item.sellerId === conversation.sellerId && item.type === 'chat' && !item.read)
      .map((item) => item.id)
    if (!unread && !noteIds.length) return { success: true }
    return shopData.markSupportRead(acting().db, conversationId, role, noteIds)
  }

  // The admin's own inbox: what sellers wrote in support chat.
  const getAdminNotifications = () => adminNotifications

  const markAdminNotificationsRead = (ids) => shopData.markNotificationsRead(acting().db, ids)

  const archiveSupportConversation = (conversationId) => shopData.archiveSupportConversation(acting().db, conversationId)

  // ---- withdrawals ----------------------------------------------------------------------------------------

  const getSellerWithdrawals = (sellerId) => withdrawalsBySeller[sellerId] || EMPTY

  const getAllWithdrawalsForAdmin = (adminIdFilter = admin.id) => {
    if (!adminIdFilter) return EMPTY
    return getSellersForAdmin(adminIdFilter).flatMap((s) =>
      (withdrawalsBySeller[s.id] || EMPTY).map((w) => ({ ...w, sellerId: s.id, sellerName: s.fullName, shopName: s.shopName }))
    )
  }

  const processWithdrawal = (sellerId, withdrawalId, approve) =>
    withShop(sellerId, (db, target, actorId) => shopData.processWithdrawal(db, target, withdrawalId, approve, actorId))

  // ---- shop catalog (the master catalog products a seller has added to their shop) ----------------------------

  const getMasterCatalog = () => masterCatalog

  const getSellerShopProductIds = (sellerId) => shopById(sellerId)?.productIds || EMPTY

  const getSellerShopProductsFull = (sellerId) =>
    getSellerShopProductIds(sellerId)
      .map((id) => masterCatalog.find((item) => item.id === id))
      .filter(Boolean)

  const getSellerSlotInfo = (sellerId) => {
    const limit = shopById(sellerId)?.productLimit ?? 50
    const used = getSellerShopProductIds(sellerId).length
    return { used, limit, remaining: Math.max(0, limit - used) }
  }

  // ---- orders (admin picks a verified seller + their shop products and gives them an order) ---------------------

  const getSellerOrders = (sellerId) => ordersBySeller[sellerId] || EMPTY

  const getAllSellerOrders = () => orders

  const createOrderForSeller = (sellerId, order) => withShop(sellerId, (db, target, actorId) => shopData.createOrder(db, target, order, actorId))

  const updateGivenOrderStatus = (sellerId, orderId, status) =>
    withShop(sellerId, (db, target, actorId) => shopData.setOrderStatus(db, target, orderId, status, actorId))

  // ---- views ------------------------------------------------------------------------------------------------------

  const getSellerCampaigns = (sellerId) => campaignsBySeller[sellerId] || EMPTY

  const getActiveViewsCampaign = (sellerId) => getSellerCampaigns(sellerId).find((c) => c.status === 'Running' || c.status === 'Paused') || null

  const startViewsCampaign = (sellerId, config) => withShop(sellerId, (db, target, actorId) => shopData.startViewsCampaign(db, target, config, actorId))

  // Pause and resume are the same toggle; the caller says what state it is looking at.
  const pauseViewsCampaign = (sellerId, campaignId, currentStatus) => {
    const status = currentStatus || getSellerCampaigns(sellerId).find((c) => c.id === campaignId)?.status
    return shopData.setCampaignStatus(acting().db, campaignId, status === 'Running' ? 'Paused' : 'Running')
  }

  const terminateViewsCampaign = (sellerId, campaignId) => shopData.setCampaignStatus(acting().db, campaignId, 'Terminated')

  const addInstantViews = (sellerId, count) => withShop(sellerId, (db, target, actorId) => shopData.addInstantViews(db, target, count, actorId))

  const getSellerViews = (sellerId) => shopById(sellerId)?.views || { total: 0, today: 0 }

  // ---- KYC ------------------------------------------------------------------------------------------------------------

  const approveKYC = (sellerId) => withShop(sellerId, (db, target, actorId) => shopData.reviewKyc(db, target, true, actorId))

  const rejectKYC = (sellerId) => withShop(sellerId, (db, target, actorId) => shopData.reviewKyc(db, target, false, actorId))

  const getKYCRecords = (adminIdFilter = admin.id) => {
    if (!adminIdFilter) return EMPTY
    return shops.filter((s) => s.adminId === adminIdFilter && (s.kyc || !s.verified))
  }

  // The identity images are not part of the live shop record (they are large): fetched on demand.
  const loadKycDocuments = (sellerId) => shopData.loadKycDocuments(acting().db, sellerId)

  const getSellerOrderAggregate = (sellerId) => shopById(sellerId)?.orderStats || NO_STATS

  const getAllOrderAggregates = () =>
    shops
      .filter((s) => !s.deleted)
      .map((s) => ({ id: s.id, shopName: s.shopName, ownerName: s.ownerName || s.fullName, email: s.email, orderStats: s.orderStats || NO_STATS, rating: s.rating || 5 }))

  return (
    <AuthContext.Provider
      value={{
        admin,
        loginAdmin,
        registerAdmin,
        logoutAdmin,
        isAdminLoggedIn: !!admin.id,
        impersonation: impersonatedNow ? impersonation : null,
        findSuperAdminByInviteCode,
        updateAdminInviteCode,
        regenerateAdminInviteCode,
        dataError,
        sellersRegistry,
        adminLogs,
        pushAdminLog,
        getSellersForAdmin,
        getAllSellersCount,
        getPendingKYCCount,
        sendSellerPasswordReset,
        impersonateSellerLogin,
        sendSellerNotification,
        getSellerNotifications,
        getAdminNotifications,
        markAdminNotificationsRead,
        getSupportConversations,
        sendSupportMessage,
        markSupportRead,
        archiveSupportConversation,
        getSellerLoginHistory,
        adjustSellerBalance,
        adjustSellerGuarantee,
        adjustSellerRating,
        adjustSellerProductLimit,
        startViewsCampaign,
        pauseViewsCampaign,
        terminateViewsCampaign,
        getActiveViewsCampaign,
        addInstantViews,
        getSellerViews,
        approveKYC,
        rejectKYC,
        getKYCRecords,
        loadKycDocuments,
        getSellerOrderAggregate,
        getAllOrderAggregates,
        getSellerActivityStats,
        getSellerLedger,
        getSellerOrders,
        getSellerWithdrawals,
        getSellerCampaigns,
        getAllWithdrawalsForAdmin,
        processWithdrawal,
        getAllSellerOrders,
        suspendSellerAccount,
        toggleSellerWithdrawals,
        toggleSellerProductRemoval,
        toggleSellerDeleted,
        getMasterCatalog,
        getSellerShopProductIds,
        getSellerShopProductsFull,
        getSellerSlotInfo,
        getVerifiedSellersForAdmin,
        createOrderForSeller,
        updateGivenOrderStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
