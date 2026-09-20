import { useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const tabs = [['all', 'All'], ['login', 'Logins'], ['action', 'Actions'], ['balance', 'Balance']]
const kindFor = (log) => log.type?.includes('signin') || log.type?.includes('login') ? 'login' : log.type?.includes('balance') || log.type?.includes('guarantee') || log.type?.includes('withdrawal') ? 'balance' : 'action'
const timeLabel = (log) => log.time || 'Just now'

const AdminMyLogs = () => {
  const { adminLogs } = useAuth()
  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')
  const visible = useMemo(() => adminLogs.filter((log) => {
    const kind = kindFor(log)
    return (tab === 'all' || kind === tab) && `${log.title} ${log.entity} ${log.type}`.toLowerCase().includes(query.toLowerCase())
  }), [adminLogs, tab, query])
  const counts = { all: adminLogs.length, login: adminLogs.filter((log) => kindFor(log) === 'login').length, action: adminLogs.filter((log) => kindFor(log) === 'action').length, balance: adminLogs.filter((log) => kindFor(log) === 'balance').length }

  return <div className="mx-auto max-w-4xl space-y-5"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">Account activity</p><h1 className="mt-1 text-3xl font-black text-gray-900">My Logs</h1><p className="mt-1 text-gray-500">Your account activity — logins, actions, and balance adjustments.</p></div><div className="flex gap-2 overflow-x-auto rounded-2xl bg-gray-100 p-1">{tabs.map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`whitespace-nowrap rounded-xl px-5 py-3 font-bold ${tab === id ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600'}`}>{label} <span className="ml-1 text-xs opacity-70">{counts[id]}</span></button>)}</div><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search..." className="w-full rounded-2xl border-2 border-gray-100 bg-white px-5 py-4 text-lg shadow-sm focus:border-indigo-500 focus:outline-none" /><div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">{visible.map((log) => { const kind = kindFor(log); const isBalance = kind === 'balance'; return <article key={log.id} className="flex gap-4 border-b border-gray-100 p-5 last:border-0"><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl font-black ${kind === 'login' ? 'bg-indigo-100 text-indigo-700' : isBalance ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-100 text-violet-700'}`}>{kind === 'login' ? '⚿' : isBalance ? '↗' : '~'}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="font-black text-gray-900">{log.title || 'Activity'}</h2>{isBalance && <span className="mt-2 inline-block rounded-full bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-700">{log.amount ? `+$${Number(log.amount).toFixed(2)}` : '+$0.00'}</span>}<p className="mt-1 text-sm text-gray-600">{log.entity}{isBalance ? ' — Admin adjustment' : ''}</p><p className="mt-1 text-xs font-mono text-gray-400">{log.type || 'activity'} · {log.id}</p></div><time className="shrink-0 text-sm font-semibold text-gray-400">{timeLabel(log)}</time></div></div></article>})}{!visible.length && <div className="p-16 text-center font-bold text-gray-500">No logs match your filters.</div>}</div></div>
}
export default AdminMyLogs
