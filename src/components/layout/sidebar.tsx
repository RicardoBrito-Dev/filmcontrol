'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  FileText,
  ClipboardList,
  Users,
  Car,
  Package,
  Archive,
  DollarSign,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Scissors,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from './logo'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'Agenda',
    href: '/agenda',
    icon: Calendar,
  },
  {
    name: 'Orçamentos',
    href: '/orcamentos',
    icon: FileText,
  },
  {
    name: 'Ordens de Serviço',
    href: '/ordens',
    icon: ClipboardList,
  },
  {
    name: 'Clientes',
    href: '/clientes',
    icon: Users,
  },
  {
    name: 'Veículos',
    href: '/veiculos',
    icon: Car,
  },
  {
    name: 'Serviços',
    href: '/servicos',
    icon: Package,
  },
  {
    name: 'Estoque',
    href: '/estoque',
    icon: Archive,
  },
  {
    name: 'Corte de Bobinas',
    href: '/otimizador-corte',
    icon: Scissors,
  },
  {
    name: 'Financeiro',
    href: '/financeiro',
    icon: DollarSign,
  },
  {
    name: 'Relatórios',
    href: '/relatorios',
    icon: BarChart3,
  },
  {
    name: 'Configurações',
    href: '/configuracoes',
    icon: Settings,
  },
]

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'relative flex flex-col border-r bg-card transition-all duration-300 ease-in-out',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-4">
          <Logo collapsed={collapsed} />
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2 py-4">
          {navigation.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href)

            const link = (
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground',
                  collapsed && 'justify-center px-2'
                )}
              >
                <item.icon
                  className={cn(
                    'shrink-0',
                    isActive ? 'text-primary' : 'text-muted-foreground',
                    collapsed ? 'h-5 w-5' : 'h-4 w-4'
                  )}
                />
                {!collapsed && <span>{item.name}</span>}
                {!collapsed && isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </Link>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">{item.name}</TooltipContent>
                </Tooltip>
              )
            }

            return <div key={item.href}>{link}</div>
          })}
        </nav>

        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="absolute -right-3.5 top-20 z-10 h-7 w-7 rounded-full border bg-background shadow-md hover:bg-accent"
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </Button>
      </aside>
    </TooltipProvider>
  )
}
