import { useMemo, useState } from 'react'
import { useSuperAuth } from '../../context/AuthContext'
import { Icon, timeAgo } from '../../components/ui'

const iconFor = (icon) =>
  ({ signin: 'login', signup: 'user-plus', key: 'key', trash: 'trash', shield: 'shield', users: 'users', crown: 'crown' })[icon] || 'activity'

const tabs = [
  ['super', 'Super admin actions'],
  ['network', 'Network activity'],
]

const SuperActivity = () => {
  const { superLogs, networkLogs, superAdmin } = useSuperAuth()
  const [tab, setTab] = useState('super')
  const [onlyMine, setOnlyMine] = useState(false)
  const [query, setQuery] = useState('')

  const rows = useMemo(() => {
    const source =
      tab === 'super'
        ? superLogs
            .filter((log) => !onlyMine || log.superAdminId === superAdmin.id)
            .map((log) => ({ id: log.id, icon: log.icon, title: log.title, entity: log.entity, by: log.actorName, time: timeAgo(log.at), type: log.type }))
        : networkLogs.map((log) => ({ id: log.id, icon: log.icon, title: log.title, entity: log.entity, by: '', time: log.time || 'Just now', type: log.type }))
    const q = query.toLowerCase().trim()
    return q ? source.filter((row) => `${row.title} ${row.entity} ${row.by} ${row.type}`.toLowerCase().includes(q)) : source
  }, [tab, onlyMine, query, superLogs, networkLogs, superAdmin.id])

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">Activity</p>
        <h1 className="mt-1 text-3xl font-black text-gray-900">Activity Logs</h1>
        <p className="mt-1 text-gray-500">What super admins have done, plus the live seller activity coming through the admin consoles.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto rounded-2xl bg-gray-100 p-1">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 whitespace-nowrap rounded-xl px-5 py-3 font-bold ${tab === id ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600'}`}
          >
            {label} <span className="ml-1 text-xs opacity-70">{id === 'super' ? superLogs.length : networkLogs.length}</span>
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
        {tab === 'super' && (
          <label className="inline-flex items-center gap-3 rounded-2xl border-2 border-gray-100 bg-white px-5 py-4 font-bold text-gray-700 shadow-sm cursor-pointer">
            <input type="checkbox" checked={onlyMine} onChange={(event) => setOnlyMine(event.target.checked)} className="w-5 h-5 accent-indigo-600" />
            Only my actions
          </label>
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
