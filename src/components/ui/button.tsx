'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-300 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50'
    const variants = {
      default: 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5',
      destructive: 'bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600 hover:shadow-lg hover:shadow-red-500/25 hover:-translate-y-0.5',
      outline: 'border border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/30',
      secondary: 'bg-white/10 text-white hover:bg-white/15',
      ghost: 'text-white/70 hover:bg-white/10 hover:text-white',
      link: 'text-indigo-400 underline-offset-4 hover:underline',
    }
    const sizes = {
      default: 'h-10 px-5 py-2',
      sm: 'h-9 rounded-lg px-4',
      lg: 'h-12 px-8 text-base',
      icon: 'h-10 w-10',
    }

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }
