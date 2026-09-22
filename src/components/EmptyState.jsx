import { Link } from 'react-router-dom'

const EmptyState = ({ icon, title, text, actionLabel, to, onAction }) => (
  <div className="flex flex-col items-center justify-center text-center py-16 sm:py-24 px-4">
    <div className="w-20 h-20 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 mb-6">
      {icon}
    </div>
    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{title}</h2>
    {text && <p className="text-gray-500 max-w-md mb-6">{text}</p>}
    {actionLabel &&
      (to ? (
        <Link to={to} className="inline-flex items-center px-7 py-3.5 bg-[#0a3d62] hover:bg-[#0f4c81] text-white font-semibold rounded-xl shadow-sm transition-colors">
          {actionLabel}
        </Link>
      ) : (
        <button type="button" onClick={onAction} className="inline-flex items-center px-7 py-3.5 bg-[#0a3d62] hover:bg-[#0f4c81] text-white font-semibold rounded-xl shadow-sm transition-colors">
          {actionLabel}
        </button>
      ))}
  </div>
)

export default EmptyState
