import { cn } from '../lib/utils'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className="w-16 h-16 rounded-2xl bg-dark-700 flex items-center justify-center text-slate-500 mb-4">
        {icon}
      </div>
      <h3 className="text-slate-300 font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-slate-500 text-sm max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
