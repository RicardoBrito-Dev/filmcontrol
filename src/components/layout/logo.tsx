'use client'

import { Film } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LogoProps {
  collapsed?: boolean
  className?: string
}

export function Logo({ collapsed, className }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
        <Film className="h-4 w-4 text-primary-foreground" />
      </div>
      {!collapsed && (
        <div className="flex flex-col leading-none">
          <span className="text-base font-bold tracking-tight text-foreground">
            FILM
            <span className="text-primary">CONTROL</span>
          </span>
          <span className="text-[10px] text-muted-foreground tracking-widest uppercase">
            Gestão Profissional
          </span>
        </div>
      )}
    </div>
  )
}
