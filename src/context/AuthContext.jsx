import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { masterCatalog } from '../data/masterCatalog'
import {
  CUSTOMER_APP,
  SELLER_APP,
  changeSellerPassword,
  findAdminByInviteCode,
  isFirebaseConfigured,
  loadSellerProfile,
  requestSellerEmailChange,
  sendResetEmail,
  sendSellerEmailVerification,
  signInCustomerAccount,
  signInSellerAccount,
  signOutAccount,
  signUpCustomerAccount,
  signUpSellerAccount,
  subscribeAuth,
  updateSellerDisplayName,
  verifySellerPassword,
} from '../firebase/accounts'
import { describeError, fail, getServices } from '../firebase/core'
import * as shopData from '../firebase/shopData'

const AuthContext = createContext(null)

const CUSTOMER_KEY = 'uss_customer_auth'
// Written by the admin console's "log in as seller": which seller to open, and which of the admin's
// own Firebase sessions ('admin' or 'superadmin') carries the permission to see that seller's data.
const IMPERSONATION_KEY = 'uss_seller_impersonation'
const IMPERSONATOR_APPS = ['admin', 'superadmin']

const defaultSeller = {
  id: null,
  fullName: '',
  shopName: '',
  email: '',
  balance: 0.0,
  guarantee: 0.0,
  rating: 5.0,
  orderCount: 0,
  verified: false,
  status: 'Under review',
  memberSince: '',
  lastActive: 'Just now',
  inviteCode: '',
  adminId: null,
  deleted: false,
  suspended: false,
  withdrawalsBlocked: false,
  allowProductRemoval: true,
  productLimit: 50,
  viewsBoost: 0,
  kycAckSeen: false,
  productIds: [],
  views: { total: 0, today: 0 },
}

const defaultCustomer = null
const EMPTY = []

const readImpersonation = () => {
  try {
    const raw = localStorage.getItem(IMPERSONATION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.sellerId && IMPERSONATOR_APPS.includes(parsed.via) ? parsed : null
  } catch (_) {
    return null
  }
}

const clearStoredImpersonation = () => {
  try {
    localStorage.removeItem(IMPERSONATION_KEY)
  } catch (_) {}
}

// The storefront's copy of the auth/data layer: the customer session, and the signed-in seller's
// shop — live from Firestore (shop record, orders, withdrawals, notifications, payout methods,
// support chat). Admin-only actions (KYC review, balance edits, order assignment, ...) live in the
// admin console; whatever they write shows up here the moment it is saved.
export function AuthProvider({ children }) {
  const [customer, setCustomer] = useState(() => {
    try {
      const raw = localStorage.getItem(CUSTOMER_KEY)
      if (raw) return JSON.parse(raw)
    } catch (_) {}
    return defaultCustomer
  })

  useEffect(() => {
    try {
      if (customer) localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer))
      else localStorage.removeItem(CUSTOMER_KEY)
    } catch (_) {}
  }, [customer])

  // ---- sessions ------------------------------------------------------------------------------
  // While a sign-in / sign-up is in flight it sets the session itself; the auth listeners below
  // must not race it (Firebase fires state changes mid-way through creating an account).
  const busyRef = useRef(0)
  const runExclusive = async (task) => {
    busyRef.current += 1
    try {
      return await task()
    } finally {
      busyRef.current -= 1
    }
  }

  // Keep the customer session in step with Firebase (e.g. it expires, or another tab signs out).
  useEffect(
    () =>
      subscribeAuth(CUSTOMER_APP, (user) => {
        if (busyRef.current) return
        setCustomer((prev) => {
          if (!user) return prev ? defaultCustomer : prev
          if (prev?.uid === user.uid) return prev
          return { uid: user.uid, email: user.email || '', fullName: user.displayName || '' }
        })
      }),
    []
  )

  // The seller's Firebase session; `email` / `emailVerified` are what Firebase Auth holds (the sign-in email).
  const authState = (user) => ({ resolved: true, uid: user ? user.uid : null, email: user?.email || '', emailVerified: !!user?.emailVerified })
  const [sellerAuth, setSellerAuth] = useState({ resolved: !isFirebaseConfigured, uid: null, email: '', emailVerified: false })
  useEffect(
    () =>
      subscribeAuth(SELLER_APP, (user) => {
        if (busyRef.current) return
        setSellerAuth(authState(user))
      }),
    []
  )

  // A session an admin (or super admin) opened via "log in as seller" has no Firebase seller user
  // behind it: it reads and writes with the admin's own identity, which the rules allow for the
  // sellers that admin manages.
  const [impersonation, setImpersonation] = useState(readImpersonation)
  const [impersonatorUid, setImpersonatorUid] = useState(null)

  const endImpersonation = () => {
    clearStoredImpersonation()
    setImpersonation(null)
    setImpersonatorUid(null)
  }

  // Signing out of an impersonation in another tab ends it here too. (Starting one elsewhere must not
  // take over this tab: a seller's own open tab should never turn into an admin's view.)
  useEffect(() => {
    const onStorage = (event) => {
      const cleared = event.key === null || (event.key === IMPERSONATION_KEY && !event.newValue)
      if (cleared) setImpersonation(null)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const impersonatorApp = impersonation?.via || null
  useEffect(() => {
    if (!impersonatorApp) {
      setImpersonatorUid(null)
      return undefined
    }
    return subscribeAuth(impersonatorApp, (user) => {
      // The admin's Firebase session is gone (signed out / expired): the impersonation is void.
      if (!user) endImpersonation()
      else setImpersonatorUid(user.uid)
    })
  }, [impersonatorApp, impersonation?.sellerId])

  const sellerId = impersonation ? impersonation.sellerId : sellerAuth.uid
  const dataApp = impersonation ? impersonation.via : SELLER_APP
  const identityReady = impersonation ? !!impersonatorUid : sellerAuth.resolved && !!sellerAuth.uid
  const sessionResolved = impersonation ? !!impersonatorUid : sellerAuth.resolved

  // ---- live shop data ----------------------------------------------------------------------------
  const [shopState, setShopState] = useState({ id: null, shop: null, loaded: false })
  const [dataError, setDataError] = useState('')
  const [orders, setOrders] = useState(EMPTY)
  const [withdrawals, setWithdrawals] = useState(EMPTY)
  const [notifications, setNotifications] = useState(EMPTY)
  const [payoutMethods, setPayoutMethods] = useState(EMPTY)
  const [conversations, setConversations] = useState(EMPTY)
  const [conversationsLoaded, setConversationsLoaded] = useState(false)
  const ensuringRef = useRef(false)
  const welcomedRef = useRef(null)

  useEffect(() => {
    if (!sellerId || !identityReady) {
      setShopState({ id: null, shop: null, loaded: false })
      setOrders(EMPTY)
      setWithdrawals(EMPTY)
      setNotifications(EMPTY)
      setPayoutMethods(EMPTY)
      setConversations(EMPTY)
      setConversationsLoaded(false)
      return undefined
    }
    const { db } = getServices(dataApp)
    setDataError('')
    setShopState((prev) => (prev.id === sellerId ? prev : { id: sellerId, shop: null, loaded: false }))
    const onError = (error, name) => {
      // eslint-disable-next-line no-console
      console.error(`[shop data] ${name}:`, error)
      setDataError(describeError(error))
      setShopState((prev) => ({ ...prev, id: sellerId, loaded: true }))
    }
    // Firestore only allows a list query when the query's own filters prove the security rule. A seller's
    // rule is "sellerId is me"; an admin's "log in as seller" session is allowed by "adminId is me", so it
    // must say which admin it is (a super admin passes either way).
    const scope = impersonation
      ? [shopData.where('sellerId', '==', sellerId), shopData.where('adminId', '==', impersonation.adminId)]
      : [shopData.where('sellerId', '==', sellerId)]
    const where = () => scope
    const unsubscribers = [
      shopData.watchShop(
        db,
        sellerId,
        (shop) => {
          setShopState({ id: sellerId, shop, loaded: true })
          // A seller whose account predates shop data gets an empty shop the first time they open the portal.
          if (!shop && !impersonation && !ensuringRef.current) {
            ensuringRef.current = true
            loadSellerProfile(sellerId)
              .then((profile) => (profile && profile.role === 'seller' ? shopData.ensureShop(db, sellerId, profile) : null))
              .finally(() => {
                ensuringRef.current = false
              })
          }
        },
        onError
      ),
      shopData.watchList(db, shopData.COL.orders, where('sellerId'), (rows) => setOrders(rows.filter((order) => Array.isArray(order.items))), onError),
      shopData.watchList(db, shopData.COL.withdrawals, where('sellerId'), setWithdrawals, onError),
      // The collection also holds the notes this seller raised for their admin (`recipient: 'admin'`).
      shopData.watchList(
        db,
        shopData.COL.notifications,
        where('sellerId'),
        (rows) => setNotifications(rows.filter((row) => row.recipient !== 'admin')),
        onError,
        shopData.mapNotification
      ),
      shopData.watchList(db, shopData.COL.payoutMethods, where('sellerId'), setPayoutMethods, onError),
      shopData.watchList(
        db,
        shopData.COL.support,
        where('sellerId'),
        (rows) => {
          setConversations(rows)
          setConversationsLoaded(true)
        },
        onError,
        shopData.mapConversation
      ),
    ]
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe())
  }, [sellerId, dataApp, identityReady, impersonation?.adminId])

  const shop = shopState.id === sellerId ? shopState.shop : null

  // Support opens with the admin's welcome. New sellers get it at sign-up; this covers sellers who
  // registered before support chat existed (or whose sign-up-time attempt failed). It only runs once
  // the inbox has loaded empty, and never for an admin looking in through "log in as seller".
  useEffect(() => {
    if (impersonation || !conversationsLoaded || conversations.length || !shop?.id || !shop.adminId) return
    if (shop.deleted || shop.suspended || welcomedRef.current === shop.id) return
    welcomedRef.current = shop.id
    shopData.createWelcomeConversation(getServices(dataApp).db, shop)
  }, [impersonation, conversationsLoaded, conversations.length, shop?.id, shop?.adminId, shop?.deleted, shop?.suspended, dataApp])

  // Whether the seller has set a transaction password (its hash sits in a document only they can read,
  // so an admin's "log in as seller" session never sees it and is never asked for it).
  const [txnState, setTxnState] = useState({ loaded: false, set: false, error: false })
  useEffect(() => {
    if (!sellerId || !identityReady || impersonation) {
      setTxnState({ loaded: false, set: false, error: false })
      return undefined
    }
    return shopData.watchSecurity(
      getServices(SELLER_APP).db,
      sellerId,
      (record) => setTxnState({ loaded: true, set: !!record?.hash, error: false }),
      () => setTxnState({ loaded: true, set: false, error: true })
    )
  }, [sellerId, identityReady, !!impersonation])

  // The sign-in email lives in Firebase Auth. After the seller confirms a new address (and signs in
  // again) the copies on the shop and the profile are brought in step with it, once.
  const emailSyncedRef = useRef('')
  useEffect(() => {
    if (impersonation || !shop?.id || !sellerAuth.email || shop.id !== sellerAuth.uid) return
    if (shop.email === sellerAuth.email || emailSyncedRef.current === sellerAuth.email) return
    emailSyncedRef.current = sellerAuth.email
    shopData.syncAccountEmail(getServices(SELLER_APP).db, shop.id, sellerAuth.email)
  }, [impersonation, shop?.id, shop?.email, sellerAuth.email, sellerAuth.uid])

  // While the storefront is open the seller counts as online in the admin console: a light heartbeat
  // keeps their last-active time fresh (skipped for an admin looking in through "log in as seller").
  useEffect(() => {
    if (!sellerId || !identityReady || impersonation || !shop?.id || shop.id !== sellerId) return undefined
    const { db } = getServices(SELLER_APP)
    const beat = () => {
      if (document.visibilityState === 'visible') shopData.touchLastActive(db, sellerId)
    }
    beat()
    const timer = setInterval(beat, 2 * 60 * 1000)
    document.addEventListener('visibilitychange', beat)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', beat)
    }
  }, [sellerId, identityReady, !!impersonation, shop?.id])

  const seller = useMemo(() => (shop ? { ...defaultSeller, ...shop, impersonated: !!impersonation } : defaultSeller), [shop, impersonation])
  const sellerRef = useRef(seller)
  sellerRef.current = seller

  // False until we know who is signed in and, for a signed-in seller, have their shop.
  const sellerReady = sessionResolved && (!sellerId || (shopState.id === sellerId && shopState.loaded))

  const sortedOrders = useMemo(() => shopData.sortNewest(orders, 'createdAt'), [orders])
  const sortedWithdrawals = useMemo(() => shopData.sortNewest(withdrawals, 'createdAt'), [withdrawals])
  const sortedNotifications = useMemo(() => shopData.sortNewest(notifications, 'createdAt'), [notifications])
  const sortedMethods = useMemo(() => [...payoutMethods].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt))), [payoutMethods])

  // The Firestore instance of whoever is acting (the seller, or the admin behind a "log in as" session).
  const acting = () => {
    const { db, auth } = getServices(dataApp)
    return { db, actorId: auth.currentUser?.uid || sellerId }
  }
  const needSeller = () => (sellerRef.current.id ? null : { success: false, error: 'You are not signed in.' })

  // ---- customer ------------------------------------------------------------------------------------

  const signInCustomer = ({ email, password, remember }) =>
    runExclusive(async () => {
      const result = await signInCustomerAccount({ email, password, remember })
      if (!result.success) return result
      setCustomer({ uid: result.user.uid, email: result.user.email || '', fullName: result.profile.fullName || '' })
      return { success: true }
    })

  const signUpCustomer = ({ fullName, email, password }) =>
    runExclusive(async () => {
      const result = await signUpCustomerAccount({ fullName, email, password })
      if (!result.success) return result
      setCustomer({ uid: result.user.uid, email: result.user.email || '', fullName: result.profile.fullName || '' })
      return { success: true }
    })

  const logoutCustomer = () => {
    try {
      localStorage.removeItem(CUSTOMER_KEY)
    } catch (_) {}
    setCustomer(defaultCustomer)
    signOutAccount(CUSTOMER_APP)
  }

  // ---- seller session --------------------------------------------------------------------------------

  const signInSeller = ({ email, password }) =>
    runExclusive(async () => {
      const result = await signInSellerAccount({ email, password })
      if (!result.success) return result
      const { db } = getServices(SELLER_APP)
      const record = await shopData.ensureShop(db, result.user.uid, result.profile)
      const refused = !record
        ? 'Your shop could not be loaded. Check your connection and try again.'
        : record.deleted
          ? 'This store has been deleted. Contact support for help.'
          : record.suspended
            ? 'Your account has been suspended. Contact support for help.'
            : ''
      if (refused) {
        await signOutAccount(SELLER_APP)
        return fail(refused)
      }
      endImpersonation()
      setSellerAuth(authState(result.user))
      shopData.recordSellerLogin(db, record)
      return { success: true, seller: record }
    })

  // Creates the Firebase account, profile, shop and KYC documents in one go (pinning the seller to
  // the admin who owns the invite code); the admin console then reviews the KYC.
  const registerSeller = ({ documents, ...fields }) =>
    runExclusive(async () => {
      const result = await signUpSellerAccount({ ...fields, documents })
      if (!result.success) return result
      endImpersonation()
      setSellerAuth(authState(result.user))
      // Signing up signs the seller in: it shows in the admin's login history with the place it came from.
      shopData.recordSellerLogin(getServices(SELLER_APP).db, result.shop)
      return { success: true, seller: result.shop }
    })

  const logoutSeller = () => {
    const wasImpersonating = !!impersonation
    endImpersonation()
    // An admin's "log in as seller" session must never sign the admin themself out.
    if (!wasImpersonating) {
      setSellerAuth(authState(null))
      signOutAccount(SELLER_APP)
    }
  }

  const sendPasswordReset = (role, email) => sendResetEmail(role === 'seller' ? SELLER_APP : CUSTOMER_APP, email)

  // ---- seller: what the pages read -----------------------------------------------------------------

  const getSellerNotifications = () => sortedNotifications

  const getSupportConversations = () => conversations.map((conversation) => ({ ...conversation, seller }))

  const getSellerOrders = () => sortedOrders
  const getSellerWithdrawals = () => sortedWithdrawals
  const getSellerPayoutMethods = () => sortedMethods

  const getSellerActivityStats = () => {
    const completedOrders = orders.filter((order) => order.status === 'Delivered')
    return {
      shopBalance: seller.balance || 0,
      guarantee: seller.guarantee || 0,
      totalViews: seller.views?.total || 0,
      todaysViews: seller.views?.today || 0,
      ordersTotal: orders.length,
      ordersCompleted: completedOrders.length,
      ordersCancelled: orders.filter((order) => order.status === 'Cancelled').length,
      revenue: completedOrders.reduce((sum, order) => sum + (order.total || 0), 0),
      profit: completedOrders.reduce((sum, order) => sum + (order.profit || 0), 0),
      withdrawn: withdrawals.filter((w) => w.status === 'Completed').reduce((sum, w) => sum + (w.amount || 0), 0),
      pendingWithdrawals: withdrawals.filter((w) => w.status === 'Pending').length,
    }
  }

  // ---- seller: actions ---------------------------------------------------------------------------------

  // An admin's "log in as seller" session reads the shop with the admin's identity; it may look but
  // must not edit the seller's own details.
  const ownDetailsOnly = () =>
    needSeller() || (impersonation ? { success: false, error: "You're viewing this shop as an admin, so the seller's own details can't be changed here." } : null)

  const saveShopSettings = async (settings) => {
    const problem = ownDetailsOnly()
    if (problem) return problem
    return shopData.saveShopSettings(acting().db, sellerRef.current.id, settings)
  }

  const saveAccountName = async (fullName) => {
    const problem = ownDetailsOnly()
    if (problem) return problem
    const result = await shopData.saveSellerName(acting().db, sellerRef.current.id, fullName)
    if (result.success) await updateSellerDisplayName(result.fullName)
    return result
  }

  const saveAvatar = async (avatar) => {
    const problem = ownDetailsOnly()
    if (problem) return problem
    return shopData.saveSellerAvatar(acting().db, sellerRef.current.id, avatar)
  }

  const changeAccountEmail = async (newEmail) => ownDetailsOnly() || requestSellerEmailChange(newEmail)

  const sendEmailVerification = async () => ownDetailsOnly() || sendSellerEmailVerification()

  const changeSignInPassword = async (currentPassword, newPassword) => ownDetailsOnly() || changeSellerPassword(currentPassword, newPassword)

  // First-time setup needs nothing else; changing an existing one needs proof — the current transaction
  // password, or (if it is forgotten) the sign-in password.
  const saveTransactionPassword = async ({ newPassword, currentPassword, accountPassword }) => {
    const problem = ownDetailsOnly()
    if (problem) return problem
    const { db } = acting()
    const id = sellerRef.current.id
    if (txnState.set) {
      const proof = accountPassword ? await verifySellerPassword(accountPassword) : await shopData.verifyTransactionPassword(db, id, currentPassword)
      if (!proof.success) return proof
    }
    return shopData.saveTransactionPassword(db, id, newPassword)
  }

  const verifyTransactionPassword = async (password) => {
    const problem = needSeller()
    if (problem) return problem
    return shopData.verifyTransactionPassword(acting().db, sellerRef.current.id, password)
  }

  const submitKycDocuments = async (submission) => {
    const problem = ownDetailsOnly()
    if (problem) return problem
    return shopData.submitKyc(acting().db, sellerRef.current, submission)
  }

  const acknowledgeKyc = async () => {
    const problem = needSeller()
    if (problem) return problem
    return shopData.acknowledgeKyc(acting().db, sellerRef.current.id)
  }

  const markNotificationRead = async (_sellerId, notificationId) => shopData.markNotificationsRead(acting().db, [notificationId])

  const markAllNotificationsRead = async () =>
    shopData.markNotificationsRead(
      acting().db,
      notifications.filter((item) => !item.read).map((item) => item.id)
    )

  const sendSupportMessage = async (_conversationId, sender, text) => {
    const problem = needSeller()
    if (problem) return problem
    return shopData.sendSupportMessage(acting().db, sellerRef.current, sender, text)
  }

  const markSupportRead = async (conversationId, role) => {
    const conversation = conversations.find((item) => item.id === conversationId)
    if (!conversation) return { success: true }
    const unread = role === 'admin' ? conversation.unreadForAdmin : conversation.unreadForSeller
    // The chat notifications the conversation raised are read along with it.
    const noteIds = notifications.filter((item) => item.type === 'chat' && !item.read).map((item) => item.id)
    if (!unread && !noteIds.length) return { success: true }
    return shopData.markSupportRead(acting().db, conversationId, role, noteIds)
  }

  const saveSellerPayoutMethod = async (_sellerId, method) => {
    const problem = needSeller()
    if (problem) return problem
    const replaceIds = method.isDefault ? payoutMethods.filter((item) => item.isDefault).map((item) => item.id) : []
    const { db, actorId } = acting()
    return shopData.savePayoutMethod(db, sellerRef.current, method, replaceIds, actorId)
  }

  const removeSellerPayoutMethod = async (_sellerId, methodId) => shopData.removePayoutMethod(acting().db, methodId)

  const requestSellerWithdrawal = async (_sellerId, amount, method) => {
    const problem = needSeller()
    if (problem) return problem
    const { db, actorId } = acting()
    return shopData.requestWithdrawal(db, sellerRef.current.id, amount, method, actorId)
  }

  const paySellerOrder = async (_sellerId, orderId) => {
    const problem = needSeller()
    if (problem) return problem
    const { db, actorId } = acting()
    return shopData.payOrder(db, sellerRef.current.id, orderId, actorId)
  }

  // ---- seller shop catalog (the master catalog products a seller has added to their shop) ----------

  const getMasterCatalog = () => masterCatalog

  const getSellerShopProductIds = () => seller.productIds || EMPTY

  const getSellerShopProductsFull = () =>
    (seller.productIds || EMPTY).map((id) => masterCatalog.find((item) => item.id === id)).filter(Boolean)

  const getSellerSlotInfo = () => {
    const limit = seller.productLimit ?? 50
    const used = (seller.productIds || EMPTY).length
    return { used, limit, remaining: Math.max(0, limit - used) }
  }

  // What the admin's activity feed shows for each product: its name, picture and the price it sells at.
  const productDetails = (ids) =>
    Object.fromEntries(
      ids
        .map((id) => masterCatalog.find((item) => item.id === id))
        .filter(Boolean)
        .map((item) => [item.id, { name: item.name, image: item.image, price: item.sell }])
    )

  const addProductsToShop = async (_sellerId, catalogIds) => {
    const problem = needSeller()
    if (problem) return problem
    const { db, actorId } = acting()
    return shopData.addProductsToShop(db, sellerRef.current.id, catalogIds, actorId, productDetails(catalogIds))
  }

  const quickAddRandomToShop = async (_sellerId, count = 50) => {
    const problem = needSeller()
    if (problem) return problem
    if (!seller.verified) return { success: false, error: 'Your store is not verified yet' }
    const existing = new Set(seller.productIds || EMPTY)
    const pool = masterCatalog.filter((item) => !existing.has(item.id))
    const remaining = Math.max(0, (seller.productLimit ?? 50) - existing.size)
    const picks = [...pool]
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(count, remaining))
      .map((item) => item.id)
    if (!picks.length) return { success: false, error: 'No slots remaining' }
    return addProductsToShop(seller.id, picks)
  }

  const removeProductFromShop = async (_sellerId, catalogId) => {
    const problem = needSeller()
    if (problem) return problem
    const { db, actorId } = acting()
    return shopData.removeProductFromShop(db, sellerRef.current.id, catalogId, actorId, productDetails([catalogId]))
  }

  return (
    <AuthContext.Provider
      value={{
        seller,
        sellerReady,
        sellerError: dataError,
        accountEmail: impersonation ? seller.email : sellerAuth.email || seller.email,
        accountEmailVerified: impersonation ? true : sellerAuth.emailVerified,
        hasTransactionPassword: txnState.set,
        transactionPasswordError: txnState.error,
        saveShopSettings,
        saveAccountName,
        saveAvatar,
        changeAccountEmail,
        sendEmailVerification,
        changeSignInPassword,
        saveTransactionPassword,
        verifyTransactionPassword,
        submitKycDocuments,
        signInSeller,
        registerSeller,
        logoutSeller,
        customer,
        signInCustomer,
        signUpCustomer,
        logoutCustomer,
        isCustomerLoggedIn: !!customer,
        sendPasswordReset,
        findAdminByInviteCode,
        acknowledgeKyc,
        getSellerNotifications,
        markNotificationRead,
        markAllNotificationsRead,
        getSupportConversations,
        sendSupportMessage,
        markSupportRead,
        getSellerActivityStats,
        getSellerOrders,
        getSellerWithdrawals,
        getSellerPayoutMethods,
        saveSellerPayoutMethod,
        removeSellerPayoutMethod,
        requestSellerWithdrawal,
        getMasterCatalog,
        getSellerShopProductIds,
        getSellerShopProductsFull,
        getSellerSlotInfo,
        addProductsToShop,
        quickAddRandomToShop,
        removeProductFromShop,
        paySellerOrder,
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
