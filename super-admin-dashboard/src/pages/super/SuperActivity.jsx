import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSuperAuth } from '../../context/AuthContext'
import { Icon, timeAgo } from '../../components/ui'

const iconFor = (icon) =>
  ({ signin: 'login', signup: 'user-plus', key: 'key', trash: 'trash', shield: 'shield', users: 'users', crown: 'crown' })[icon] || 'activity'

const tabs = [
  ['super', 'Super admin actions'],
  ['network', 'Network activity'],
]

const SuperActivity = () => {
  const { superLogs, networkLogs, superAdmin, isOwner, superAdmins, removedSuperAdmins, admins } = useSuperAuth()
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState('super')
  // The owner can look at any one super admin's branch: what they did, and what their admins' networks did.
  const [who, setWho] = useState(searchParams.get('by') || 'all')
  const [query, setQuery] = useState('')

  const people = useMemo(
    () => [
      ...superAdmins.map((s) => ({ id: s.id, name: s.id === superAdmin.id ? `${s.fullName} (you)` : s.fullName })),
      ...removedSuperAdmins.map((s) => ({ id: s.id, name: `${s.fullName} (removed)` })),
    ],
    [superAdmins, removedSuperAdmins, superAdmin.id]
  )
  const selected = isOwner ? who : 'all'
  const adminIdsOfSelected = useMemo(
    () => new Set(admins.filter((a) => a.superAdminId === selected).map((a) => a.id)),
    [admins, selected]
  )
  const shownSuper = useMemo(() => (selected === 'all' ? superLogs : superLogs.filter((log) => log.superAdminId === selected)), [superLogs, selected])
  const shownNetwork = useMemo(
    () => (selected === 'all' ? networkLogs : networkLogs.filter((log) => adminIdsOfSelected.has(log.adminId))),
    [networkLogs, selected, adminIdsOfSelected]
  )

  const rows = useMemo(() => {
    const source =
      tab === 'super'
        ? shownSuper.map((log) => ({ id: log.id, icon: log.icon, title: log.title, entity: log.entity, by: log.actorName, time: timeAgo(log.at), type: log.type }))
        : shownNetwork.map((log) => ({ id: log.id, icon: log.icon, title: log.title, entity: log.entity, by: '', time: log.time || 'Just now', type: log.type }))
    const q = query.toLowerCase().trim()
    return q ? source.filter((row) => `${row.title} ${row.entity} ${row.by} ${row.type}`.toLowerCase().includes(q)) : source
  }, [tab, query, shownSuper, shownNetwork])

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">Activity</p>
        <h1 className="mt-1 text-3xl font-black text-gray-900">Activity Logs</h1>
        <p className="mt-1 text-gray-500">
          {isOwner
            ? 'What every super admin has done, plus the live seller activity coming through the admin consoles.'
            : 'What you have done, plus the live seller activity coming through your admins.'}
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto rounded-2xl bg-gray-100 p-1">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 whitespace-nowrap rounded-xl px-5 py-3 font-bold ${tab === id ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600'}`}
          >
            {label} <span className="ml-1 text-xs opacity-70">{id === 'super' ? shownSuper.length : shownNetwork.length}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search..."
          className="flex-1 rounded-2xl border-2 border-gray-100 bg-white px-5 py-4 text-lg shadow-sm focus:border-indigo-500 focus:outline-none"
        />
        {isOwner && (
          <select
            value={selected}
            onChange={(event) => setWho(event.target.value)}
            aria-label="Whose activity"
            className="rounded-2xl border-2 border-gray-100 bg-white px-5 py-4 font-bold text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">Everyone</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        {rows.map((row) => (
          <article key={row.id} className="flex gap-4 border-b border-gray-100 p-5 last:border-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
              <Icon name={iconFor(row.icon)} className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="font-black text-gray-900">{row.title || 'Activity'}</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    {row.entity}
                    {row.by ? ` · by ${row.by}` : ''}
                  </p>
                  <p className="mt-1 text-xs font-mono text-gray-400">{row.type || 'activity'}</p>
                </div>
                <time className="shrink-0 text-sm font-semibold text-gray-400">{row.time}</time>
              </div>
            </div>
          </article>
        ))}
        {!rows.length && <div className="p-16 text-center font-bold text-gray-500">Nothing to show yet.</div>}
      </div>
    </div>
  )
}

export default SuperActivity
