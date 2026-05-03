import { cn } from '../lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3',
  }
  return (
    <div
      className={cn(
        'rounded-full border-transparent border-t-brand-blue animate-spin',
        sizes[size],
        className,
      )}
    />
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-slate-400 text-sm">Loading...</p>
      </div>
    </div>
  )
}
