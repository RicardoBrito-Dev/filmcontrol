'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  FileText,
  ClipboardList,
  Users,
  MoreHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomNavProps {
  onOpenMenu: () => void
}

const bottomNavItems = [
  { name: 'Início', href: '/', icon: LayoutDashboard },
  { name: 'Agenda', href: '/agenda', icon: Calendar },
  { name: 'Orçamentos', href: '/orcamentos', icon: FileText },
  { name: 'Ordens', href: '/ordens', icon: ClipboardList },
  { name: 'Clientes', href: '/clientes', icon: Users },
]

export function BottomNav({ onOpenMenu }: BottomNavProps) {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch justify-around border-t bg-card/98 backdrop-blur-md md:hidden shadow-[0_-1px_12px_rgba(0,0,0,0.08)]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', height: 'calc(56px + env(safe-area-inset-bottom, 0px))' }}>
      {bottomNavItems.map((item) => {
        const isActive =
          item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 pt-2 text-[10px] font-medium transition-all active:scale-90 select-none',
              isActive
                ? 'text-primary'
                : 'text-muted-foreground'
            )}
          >
            <div
              className={cn(
                'flex h-7 w-12 items-center justify-center rounded-full transition-all duration-200',
                isActive && 'bg-primary/12'
              )}
            >
              <item.icon className={cn('h-[18px] w-[18px] transition-all', isActive && 'scale-110')} />
            </div>
            <span className={cn('text-[9.5px] tracking-tight leading-tight', isActive && 'font-bold')}>{item.name}</span>
          </Link>
        )
      })}

      {/* Botão Mais */}
      <button
        type="button"
        onClick={onOpenMenu}
        className="flex flex-1 flex-col items-center justify-center gap-0.5 pt-2 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-all active:scale-90 select-none"
      >
        <div className="flex h-7 w-12 items-center justify-center rounded-full">
          <MoreHorizontal className="h-[18px] w-[18px]" />
        </div>
        <span className="text-[9.5px] tracking-tight leading-tight">Mais</span>
      </button>
    </div>
  )
}
