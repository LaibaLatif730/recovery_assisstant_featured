'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          className={cn(
            'flex h-12 w-full rounded-xl border border-white/15 bg-white/5 backdrop-blur-sm px-4 py-3 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50 hover:border-white/25 hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 cursor-pointer appearance-none pr-10',
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    )
  }
)
Select.displayName = 'Select'

export { Select }
