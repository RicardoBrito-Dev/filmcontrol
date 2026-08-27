'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  FileText,
  Eye,
  MessageCircle,
  Car,
  MapPin,
  Calculator,
  CheckCircle2,
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
import { formatCurrency, formatDate, formatPhone } from '@/lib/utils'
import type { QuoteWithRelations } from '@/services/quote.service'

interface QuoteTableProps {
  quotes: QuoteWithRelations[]
  onDelete: (id: string) => void
  onAddNew: () => void
  onOpenCalculator: () => void
  onUpdateStatus: (id: string, status: QuoteWithRelations['status']) => void
}

const statusBadgeConfig = {
  RASCUNHO: { label: 'Rascunho', variant: 'outline' as const },
  ENVIADO: { label: 'Enviado', variant: 'info' as const },
  AGUARDANDO_APROVACAO: { label: 'Aguardando Aprovação', variant: 'warning' as const },
  APROVADO: { label: 'Aprovado', variant: 'success' as const },
  RECUSADO: { label: 'Recusado', variant: 'destructive' as const },
  EXPIRADO: { label: 'Expirado', variant: 'secondary' as const },
}

export function QuoteTable({
  quotes,
  onDelete,
  onAddNew,
  onOpenCalculator,
  onUpdateStatus,
}: QuoteTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')

  const filtered = quotes.filter((q) => {
    const term = searchTerm.toLowerCase()
    const numMatch = q.number?.toLowerCase().includes(term)
    const clientMatch = q.customer?.name?.toLowerCase().includes(term)
    const vehicleMatch = q.vehicle
      ? `${q.vehicle.brand} ${q.vehicle.model} ${q.vehicle.plate}`.toLowerCase().includes(term)
      : false
    const statusMatch =
      selectedStatus === 'ALL' || q.status === selectedStatus

    return (numMatch || clientMatch || vehicleMatch) && statusMatch
  })

  return (
    <div className="space-y-4">
      {/* Filters Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'AGUARDANDO_APROVACAO', 'APROVADO', 'ENVIADO', 'RASCUNHO'].map((st) => (
            <Button
              key={st}
              variant={selectedStatus === st ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus(st)}
              className="text-xs"
            >
              {st === 'ALL'
                ? 'Todos'
                : st === 'AGUARDANDO_APROVACAO'
                ? 'Aguardando'
                : st === 'APROVADO'
                ? 'Aprovados'
                : st === 'ENVIADO'
                ? 'Enviados'
                : 'Rascunhos'}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCalculator}
            className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10 text-xs"
          >
            <Calculator className="h-4 w-4" /> Calculadora de Vidros
          </Button>
          <Button size="sm" onClick={onAddNew} className="gap-1.5 text-xs">
            <Plus className="h-4 w-4" /> Novo Orçamento
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por número, cliente ou veículo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border bg-background pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold">Nenhum orçamento encontrado</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            {searchTerm
              ? 'Tente buscar com outros termos.'
              : 'Gere orçamentos rápidos para seus clientes com cálculo de m².'}
          </p>
          <Button onClick={onAddNew} size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Criar Orçamento
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
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
                  const statusInfo =
                    statusBadgeConfig[quote.status] || statusBadgeConfig.AGUARDANDO_APROVACAO
                  const cleanPhone = (quote.customer?.whatsapp || quote.customer?.phone || '').replace(
                    /\D/g,
                    ''
                  )

                  return (
                    <tr
                      key={quote.id}
                      className="group transition-colors hover:bg-muted/30"
                    >
                      {/* Número & Itens */}
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/orcamentos/${quote.id}`}
                          className="font-mono font-bold text-foreground hover:text-primary transition-colors flex flex-col"
                        >
                          <span>{quote.number}</span>
                          <span className="text-xs text-muted-foreground font-normal">
                            {quote.items?.length || 0} item(s) incluído(s)
                          </span>
                        </Link>
                      </td>

                      {/* Cliente */}
                      <td className="px-4 py-3.5">
                        {quote.customer ? (
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground">
                              {quote.customer.name}
                            </span>
                            {quote.customer.whatsapp && (
                              <span className="text-xs text-muted-foreground">
                                {formatPhone(quote.customer.whatsapp)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>

                      {/* Veículo ou Residencial */}
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
                            Atendimento Loja
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <Badge variant={statusInfo.variant} className="text-xs">
                          {statusInfo.label}
                        </Badge>
                      </td>

                      {/* Validade */}
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        {quote.valid_until ? formatDate(quote.valid_until) : '-'}
                      </td>

                      {/* Valor Total */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="font-bold text-base text-foreground">
                          {formatCurrency(Number(quote.total))}
                        </div>
                        {quote.discount > 0 && (
                          <div className="text-[10px] text-rose-600 font-medium">
                            Desc: -{formatCurrency(Number(quote.discount))}
                          </div>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3.5 text-right">
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
                            {quote.status !== 'APROVADO' && (
                              <DropdownMenuItem
                                onClick={() => onUpdateStatus(quote.id, 'APROVADO')}
                                className="flex items-center gap-2 cursor-pointer text-emerald-600 focus:text-emerald-600"
                              >
                                <CheckCircle2 className="h-4 w-4" /> Marcar Aprovado
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                if (
                                  confirm(
                                    `Excluir o orçamento ${quote.number}?`
                                  )
                                ) {
                                  onDelete(quote.id)
                                }
                              }}
                              className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
      )}
    </div>
  )
}
