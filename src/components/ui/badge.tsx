import * as React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-indigo-500/25 text-indigo-300 border-indigo-500/40',
    secondary: 'bg-white/10 text-white/80 border-white/20',
    destructive: 'bg-red-500/25 text-red-300 border-red-500/40',
    outline: 'bg-transparent text-white/80 border-white/20',
    success: 'bg-green-500/25 text-green-300 border-green-500/40',
    warning: 'bg-yellow-500/25 text-yellow-300 border-yellow-500/40',
  }

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
