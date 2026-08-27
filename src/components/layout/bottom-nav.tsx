'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  FileText,
  ClipboardList,
  Menu,
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
]

export function BottomNav({ onOpenMenu }: BottomNavProps) {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t bg-card/95 backdrop-blur-md px-2 md:hidden shadow-lg safe-area-pb">
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
              'flex flex-col items-center justify-center gap-1 py-1 px-3 text-[11px] font-medium transition-all rounded-xl active:scale-95',
              isActive
                ? 'text-primary font-bold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
                isActive && 'bg-primary/15 text-primary'
              )}
            >
              <item.icon className="h-4 w-4" />
            </div>
            <span>{item.name}</span>
          </Link>
        )
      })}

      {/* Botão Menu / Mais */}
      <button
        type="button"
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center gap-1 py-1 px-3 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-all active:scale-95"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full">
          <Menu className="h-4 w-4" />
        </div>
        <span>Menu</span>
      </button>
    </div>
  )
}
