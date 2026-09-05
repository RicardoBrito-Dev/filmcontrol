'use client'

import { useState, useEffect } from 'react'
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
  X,
  Film,
  ChevronRight,
  Scissors,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface MobileNavProps {
  open: boolean
  onClose: () => void
}

const navGroups = [
  {
    label: 'Principal',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Agenda', href: '/agenda', icon: Calendar },
      { name: 'Orçamentos', href: '/orcamentos', icon: FileText },
      { name: 'Ordens de Serviço', href: '/ordens', icon: ClipboardList },
    ],
  },
  {
    label: 'Cadastros',
    items: [
      { name: 'Clientes', href: '/clientes', icon: Users },
      { name: 'Veículos', href: '/veiculos', icon: Car },
      { name: 'Catálogo de Serviços', href: '/servicos', icon: Package },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { name: 'Estoque', href: '/estoque', icon: Archive },
      { name: 'Corte de Bobinas', href: '/otimizador-corte', icon: Scissors },
      { name: 'Financeiro', href: '/financeiro', icon: DollarSign },
      { name: 'Relatórios', href: '/relatorios', icon: BarChart3 },
      { name: 'Configurações', href: '/configuracoes', icon: Settings },
    ],
  },
]

export function MobileNav({ open, onClose }: MobileNavProps) {
  const pathname = usePathname()

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Close on route change
  useEffect(() => {
    onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer — full height, left side */}
      <div className="absolute left-0 top-0 h-full w-[76vw] max-w-[300px] bg-card border-r flex flex-col animate-in slide-in-from-left duration-250 shadow-2xl">
        {/* Logo Header */}
        <div className="flex h-16 items-center justify-between border-b px-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
              <Film className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-base font-bold tracking-tight">
                FILM<span className="text-primary">CONTROL</span>
              </span>
              <span className="text-[10px] text-muted-foreground tracking-wide">Instalação de Películas</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Nav groups */}
        <nav className="flex flex-1 flex-col overflow-y-auto py-3 px-2">
          {navGroups.map((group, gi) => (
            <div key={gi} className="mb-1">
              <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                {group.label}
              </p>
              {group.items.map((item) => {
                const isActive =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(item.href)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all active:scale-98',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'h-4 w-4 shrink-0',
                        isActive ? 'text-primary' : 'text-muted-foreground'
                      )}
                    />
                    <span className="flex-1">{item.name}</span>
                    {isActive && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t p-3 shrink-0" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
          <p className="text-center text-[10px] text-muted-foreground">
            FILMCONTROL v1.0 • Gestão de Películas
          </p>
        </div>
      </div>
    </div>
  )
}
