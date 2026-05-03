import { Bell, User } from 'lucide-react'

interface TopBarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  return (
    <header className="sticky top-0 z-10 bg-dark-900/80 backdrop-blur-md border-b border-dark-600/50 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          {actions}
          <button className="btn-ghost p-2">
            <Bell size={18} />
          </button>
          <button className="btn-ghost p-2">
            <div className="w-7 h-7 rounded-lg bg-brand-gradient flex items-center justify-center">
              <User size={14} className="text-white" />
            </div>
          </button>
        </div>
      </div>
    </header>
  )
}
