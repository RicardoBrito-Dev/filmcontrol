'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Search,
  MoreVertical,
  Trash2,
  FileText,
  Eye,
  Car,
  MapPin,
  CheckCircle2,
  Calendar,
  XCircle,
  Plus,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { QuoteWithRelations } from '@/services/quote.service'

interface QuoteTableProps {
  quotes: QuoteWithRelations[]
  onDelete: (id: string) => void
  onAddNew: () => void
  onOpenCalculator?: () => void
  onUpdateStatus: (id: string, status: QuoteWithRelations['status']) => void
}

const statusConfig = {
  RASCUNHO: { label: 'Rascunho', variant: 'outline' as const },
  ENVIADO: { label: 'Enviado', variant: 'info' as const },
  AGUARDANDO_APROVACAO: { label: 'Aguardando', variant: 'warning' as const },
  APROVADO: { label: 'Aprovado', variant: 'success' as const },
  RECUSADO: { label: 'Recusado', variant: 'destructive' as const },
  EXPIRADO: { label: 'Expirado', variant: 'secondary' as const },
}

export function QuoteTable({
  quotes,
  onDelete,
  onAddNew,
  onUpdateStatus,
}: QuoteTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')

  const filtered = quotes.filter((q) => {
    const term = searchTerm.toLowerCase()
    const numMatch = q.number?.toLowerCase().includes(term)
    const custMatch = q.customer?.name?.toLowerCase().includes(term)
    const vehMatch = q.vehicle
      ? `${q.vehicle.brand} ${q.vehicle.model} ${q.vehicle.plate}`.toLowerCase().includes(term)
      : false
    const statusMatch =
      selectedStatus === 'ALL' || q.status === selectedStatus

    return (numMatch || custMatch || vehMatch) && statusMatch
  })

  return (
    <div className="space-y-4">
      {/* Top Filter Buttons & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {[
            { key: 'ALL', label: 'Todos' },
            { key: 'AGUARDANDO_APROVACAO', label: 'Aguardando' },
            { key: 'APROVADO', label: 'Aprovados' },
            { key: 'ENVIADO', label: 'Enviados' },
          ].map(({ key, label }) => (
            <Button
              key={key}
              variant={selectedStatus === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus(key)}
              className="text-xs h-8 px-3 shrink-0 font-medium"
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por número, cliente ou veículo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border bg-background pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground transition-all"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-10 sm:p-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold">Nenhum orçamento encontrado</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 mb-4">
            {searchTerm ? 'Tente buscar com outros termos.' : 'Crie seu primeiro orçamento comercial.'}
          </p>
          <Button onClick={onAddNew} size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Criar Orçamento
          </Button>
        </div>
      ) : (
        <>
          {/* MOBILE VIEW: Cards */}
          <div className="grid gap-3 sm:hidden">
            {filtered.map((quote) => {
              const statusInfo = statusConfig[quote.status] || statusConfig.AGUARDANDO_APROVACAO

              return (
                <div
                  key={quote.id}
                  className="rounded-xl border bg-card p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/orcamentos/${quote.id}`}
                        className="font-mono font-bold text-base text-primary hover:underline"
                      >
                        #{quote.number}
                      </Link>
                      <h4 className="font-semibold text-foreground text-sm mt-0.5">
                        {quote.customer?.name || 'Cliente'}
                      </h4>
                    </div>
                    <Badge variant={statusInfo.variant} className="text-[11px]">
                      {statusInfo.label}
                    </Badge>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    {quote.vehicle ? (
                      <div className="flex items-center gap-1.5 text-foreground">
                        <Car className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{quote.vehicle.brand} {quote.vehicle.model} ({quote.vehicle.plate || 'S/ placa'})</span>
                      </div>
                    ) : quote.customer?.address ? (
                      <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{quote.customer.address}</span>
                      </div>
                    ) : null}

                    <div className="flex justify-between items-baseline pt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(quote.created_at)}
                      </span>
                      <span className="text-lg font-bold text-foreground">
                        {formatCurrency(Number(quote.total))}
                      </span>
                    </div>
                  </div>

                  {/* Mobile Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                    <Button asChild size="sm" variant="outline" className="text-xs gap-1 h-8">
                      <Link href={`/orcamentos/${quote.id}`}>
                        <Eye className="h-3.5 w-3.5 text-blue-500" /> Ver Proposta
                      </Link>
                    </Button>

                    {quote.status !== 'APROVADO' ? (
                      <Button
                        size="sm"
                        onClick={() => onUpdateStatus(quote.id, 'APROVADO')}
                        className="text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 font-semibold h-8"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Aprovar
                      </Button>
                    ) : (
                      <Button asChild size="sm" variant="secondary" className="text-xs gap-1 h-8 font-semibold">
                        <Link href="/agenda">
                          <Calendar className="h-3.5 w-3.5 text-primary" /> Na Agenda
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* DESKTOP VIEW: Table */}
          <div className="hidden sm:block overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Orçamento</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Veículo / Local</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Validade</th>
                    <th className="px-4 py-3 text-right">Valor Total</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((quote) => {
                    const statusInfo = statusConfig[quote.status] || statusConfig.AGUARDANDO_APROVACAO

                    return (
                      <tr
                        key={quote.id}
                        className="group transition-colors hover:bg-muted/30"
                      >
                        <td className="px-4 py-3.5">
                          <Link
                            href={`/orcamentos/${quote.id}`}
                            className="font-mono font-bold text-foreground hover:text-primary transition-colors flex flex-col"
                          >
                            <span>#{quote.number}</span>
                            <span className="text-xs text-muted-foreground font-normal">
                              {formatDate(quote.created_at)}
                            </span>
                          </Link>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="font-semibold text-foreground block">
                            {quote.customer?.name || 'Cliente'}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 max-w-[200px]">
                          {quote.vehicle ? (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Car className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span className="truncate">
                                {quote.vehicle.brand} {quote.vehicle.model}
                              </span>
                            </div>
                          ) : quote.customer?.address ? (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span className="truncate">{quote.customer.address}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              Na Loja
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <Badge variant={statusInfo.variant} className="text-xs">
                            {statusInfo.label}
                          </Badge>
                        </td>

                        <td className="px-4 py-3.5 text-xs text-muted-foreground">
                          {quote.valid_until ? formatDate(quote.valid_until) : '-'}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="font-bold text-base text-foreground">
                            {formatCurrency(Number(quote.total))}
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {quote.status !== 'APROVADO' ? (
                              <Button
                                size="sm"
                                onClick={() => onUpdateStatus(quote.id, 'APROVADO')}
                                className="h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 font-semibold"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" /> Aprovar
                              </Button>
                            ) : (
                              <Button asChild size="sm" variant="outline" className="h-8 text-xs gap-1">
                                <Link href="/agenda">
                                  <Calendar className="h-3.5 w-3.5 text-primary" /> Agenda
                                </Link>
                              </Button>
                            )}

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/orcamentos/${quote.id}`}
                                    className="flex items-center gap-2 cursor-pointer"
                                  >
                                    <Eye className="h-4 w-4 text-blue-500" /> Ver / Imprimir PDF
                                  </Link>
                                </DropdownMenuItem>

                                {quote.status !== 'RECUSADO' && (
                                  <DropdownMenuItem
                                    onClick={() => onUpdateStatus(quote.id, 'RECUSADO')}
                                    className="flex items-center gap-2 cursor-pointer text-rose-600 focus:text-rose-600"
                                  >
                                    <XCircle className="h-4 w-4" /> Marcar Recusado
                                  </DropdownMenuItem>
                                )}

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  onClick={() => {
                                    if (confirm(`Excluir o orçamento ${quote.number}?`)) {
                                      onDelete(quote.id)
                                    }
                                  }}
                                  className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4" /> Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="border-t bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
              Mostrando {filtered.length} de {quotes.length} orçamento(s)
            </div>
          </div>
        </>
      )}
    </div>
  )
}
