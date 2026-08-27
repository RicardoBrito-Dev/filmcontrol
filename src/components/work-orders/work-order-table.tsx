'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  ClipboardList,
  Eye,
  Car,
  MapPin,
  Camera,
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
import { formatCurrency, formatDate } from '@/lib/utils'
import type { WorkOrderWithRelations } from '@/services/work-order.service'

interface WorkOrderTableProps {
  orders: WorkOrderWithRelations[]
  onDelete: (id: string) => void
  onAddNew: () => void
  onUpdateStatus: (id: string, status: WorkOrderWithRelations['status']) => void
}

const statusConfig = {
  AGENDADO: { label: 'Agendado', variant: 'outline' as const },
  EM_INSTALACAO: { label: 'Em Instalação', variant: 'warning' as const },
  AGUARDANDO_PAGAMENTO: { label: 'Aguardando Pagamento', variant: 'info' as const },
  CONCLUIDO: { label: 'Concluído', variant: 'success' as const },
  CANCELADO: { label: 'Cancelado', variant: 'destructive' as const },
}

const paymentStatusConfig = {
  PAGO: { label: 'Pago', variant: 'success' as const },
  PARCIAL: { label: 'Parcial', variant: 'warning' as const },
  PENDENTE: { label: 'Pendente', variant: 'destructive' as const },
  ATRASADO: { label: 'Atrasado', variant: 'destructive' as const },
}

export function WorkOrderTable({
  orders,
  onDelete,
  onAddNew,
  onUpdateStatus,
}: WorkOrderTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')

  const filtered = orders.filter((o) => {
    const term = searchTerm.toLowerCase()
    const numMatch = o.number?.toLowerCase().includes(term)
    const custMatch = o.customer?.name?.toLowerCase().includes(term)
    const vehMatch = o.vehicle
      ? `${o.vehicle.brand} ${o.vehicle.model} ${o.vehicle.plate}`.toLowerCase().includes(term)
      : false
    const statusMatch =
      selectedStatus === 'ALL' || o.status === selectedStatus

    return (numMatch || custMatch || vehMatch) && statusMatch
  })

  return (
    <div className="space-y-4">
      {/* Filter Tabs & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'EM_INSTALACAO', 'AGUARDANDO_PAGAMENTO', 'CONCLUIDO', 'AGENDADO'].map((st) => (
            <Button
              key={st}
              variant={selectedStatus === st ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus(st)}
              className="text-xs"
            >
              {st === 'ALL'
                ? 'Todas as OS'
                : st === 'EM_INSTALACAO'
                ? 'Em Instalação'
                : st === 'AGUARDANDO_PAGAMENTO'
                ? 'Aguardando Pagamento'
                : st === 'CONCLUIDO'
                ? 'Concluídas'
                : 'Agendadas'}
            </Button>
          ))}
        </div>

        <Button size="sm" onClick={onAddNew} className="gap-1.5 text-xs">
          <Plus className="h-4 w-4" /> Nova Ordem de Serviço
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por número da OS, cliente ou veículo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border bg-background pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
            <ClipboardList className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold">Nenhuma ordem de serviço encontrada</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            {searchTerm
              ? 'Tente buscar com outros termos.'
              : 'Abra ordens de serviço para acompanhar a instalação e upload de fotos.'}
          </p>
          <Button onClick={onAddNew} size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Criar Ordem de Serviço
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Ordem de Serviço</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Veículo / Local</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Pagamento</th>
                  <th className="px-4 py-3 text-center">Fotos</th>
                  <th className="px-4 py-3 text-right">Valor Total</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((order) => {
                  const statusInfo =
                    statusConfig[order.status] || statusConfig.AGENDADO
                  const paymentInfo =
                    paymentStatusConfig[order.payment_status] || paymentStatusConfig.PENDENTE

                  return (
                    <tr
                      key={order.id}
                      className="group transition-colors hover:bg-muted/30"
                    >
                      {/* OS Number */}
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/ordens/${order.id}`}
                          className="font-mono font-bold text-foreground hover:text-primary transition-colors flex flex-col"
                        >
                          <span>{order.number}</span>
                          <span className="text-xs text-muted-foreground font-normal">
                            {formatDate(order.created_at)}
                          </span>
                        </Link>
                      </td>

                      {/* Cliente */}
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-foreground block">
                          {order.customer?.name || 'Cliente'}
                        </span>
                      </td>

                      {/* Veículo ou Residencial */}
                      <td className="px-4 py-3.5 max-w-[200px]">
                        {order.vehicle ? (
                          <div className="flex items-center gap-1.5 text-xs">
                            <Car className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="truncate">
                              {order.vehicle.brand} {order.vehicle.model}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="truncate">Aplicação no local</span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <Badge variant={statusInfo.variant} className="text-xs">
                          {statusInfo.label}
                        </Badge>
                      </td>

                      {/* Pagamento */}
                      <td className="px-4 py-3.5">
                        <Badge variant={paymentInfo.variant} className="text-xs">
                          {paymentInfo.label}
                        </Badge>
                      </td>

                      {/* Fotos */}
                      <td className="px-4 py-3.5 text-center">
                        <Badge variant="secondary" className="gap-1 font-mono text-xs">
                          <Camera className="h-3 w-3" />
                          {order.files?.length || 0}
                        </Badge>
                      </td>

                      {/* Valor Total */}
                      <td className="px-4 py-3.5 text-right font-bold text-foreground">
                        {formatCurrency(Number(order.total))}
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
                                href={`/ordens/${order.id}`}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <Eye className="h-4 w-4 text-blue-500" /> Ver Detalhes / Fotos
                              </Link>
                            </DropdownMenuItem>
                            {order.status !== 'CONCLUIDO' && (
                              <DropdownMenuItem
                                onClick={() => onUpdateStatus(order.id, 'CONCLUIDO')}
                                className="flex items-center gap-2 cursor-pointer text-emerald-600 focus:text-emerald-600"
                              >
                                <CheckCircle2 className="h-4 w-4" /> Marcar Concluída
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                if (confirm(`Deseja excluir a OS ${order.number}?`)) {
                                  onDelete(order.id)
                                }
                              }}
                              className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" /> Excluir OS
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
            Mostrando {filtered.length} de {orders.length} OS
          </div>
        </div>
      )}
    </div>
  )
}
