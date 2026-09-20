import { useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { openSupportChat } from '../../components/SupportChatWidget'

const SellerNotifications = () => {
  const { seller, getSellerNotifications, markNotificationRead, markAllNotificationsRead } = useAuth()
  const [activeTab, setActiveTab] = useState('all')

  const notifications = getSellerNotifications(seller.id)

  const counts = useMemo(() => ({
    all: notifications.length,
    unread: notifications.filter((item) => !item.read).length,
    read: notifications.filter((item) => item.read).length,
  }), [notifications])

  const visible = notifications.filter((item) => activeTab === 'all' || (activeTab === 'unread' ? !item.read : item.read))

  const tabs = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'unread', label: 'Unread', count: counts.unread },
    { id: 'read', label: 'Read', count: counts.read },
  ]

  return (
    <div className="space-y-6">
      {counts.unread > 0 && (
        <div className="flex justify-end">
          <button onClick={() => markAllNotificationsRead(seller.id)} className="text-sm font-bold text-indigo-600 hover:text-indigo-700">
            Mark all as read
          </button>
        </div>
      )}
      <div className="bg-gray-50 rounded-2xl p-1.5">
        <div className="grid grid-cols-3 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                activeTab === tab.id ? 'bg-gray-100 text-gray-600' : 'bg-gray-200/50 text-gray-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 lg:p-16 min-h-[400px]">
        {visible.length > 0 ? (
          <div className="space-y-3">
            {visible.map((notification) => (
              <button
                key={notification.id}
                onClick={() => {
                  // A chat note opens the chat popup, which reads the whole conversation.
                  if (notification.type === 'chat') openSupportChat()
                  else if (!notification.read) markNotificationRead(seller.id, notification.id)
                }}
                className={`w-full rounded-2xl border p-4 text-left transition-colors ${notification.read ? 'border-gray-100 bg-gray-50' : 'border-indigo-100 bg-indigo-50/40 hover:bg-indigo-50'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div><h3 className="font-bold text-gray-900">{notification.title}</h3><p className="mt-1 text-sm text-gray-600">{notification.message}</p></div>
                  {!notification.read && <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-1 text-xs font-bold text-indigo-700">New</span>}
                </div>
                <p className="mt-2 text-xs font-semibold text-gray-400">{notification.time}</p>
              </button>
            ))}
          </div>
        ) : (
        <div className="text-center py-8">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-gray-50">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3">
            Your inbox is quiet — for now ✨
          </h3>
          <p className="text-gray-500 max-w-md mx-auto text-base">
            We'll notify you the moment you get an order or payout.
          </p>
        </div>
        )}
      </div>
    </div>
  )
}

export default SellerNotifications
