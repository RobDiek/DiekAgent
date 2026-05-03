import { cn } from '../lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  hover?: boolean
}

export function Card({ children, className, onClick, hover = false }: CardProps) {
  return (
    <div
      className={cn(
        'glass-card p-4',
        hover && 'cursor-pointer hover:border-brand-blue/30 hover:shadow-glow-blue transition-all duration-200',
        className,
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: { value: number; positive: boolean }
  gradient?: boolean
}

export function StatCard({ title, value, subtitle, icon, gradient }: StatCardProps) {
  return (
    <div className={cn(
      'glass-card p-5 flex items-start gap-4',
      gradient && 'border-brand-blue/30',
    )}>
      <div className={cn(
        'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center',
        gradient ? 'bg-brand-gradient' : 'bg-dark-700',
      )}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-slate-400 text-sm">{title}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
        {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}
