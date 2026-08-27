'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Printer,
  CheckCircle2,
  Car,
  MapPin,
  DollarSign,
  User,
  Clock,
  ClipboardList,
  Check,
  Play,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { WorkOrderWithRelations } from '@/services/work-order.service'
import { workOrderService } from '@/services/work-order.service'
import { BeforeAfterGallery } from '@/components/work-orders/before-after-gallery'
import { toast } from '@/hooks/use-toast'

interface WorkOrderDetailsProps {
  order: WorkOrderWithRelations
}

const statusOptions: { value: WorkOrderWithRelations['status']; label: string }[] = [
  { value: 'AGENDADO', label: 'Agendado' },
  { value: 'EM_INSTALACAO', label: 'Em Instalação' },
  { value: 'AGUARDANDO_PAGAMENTO', label: 'Aguardando Pagamento' },
  { value: 'CONCLUIDO', label: 'Concluído' },
  { value: 'CANCELADO', label: 'Cancelado' },
]

const paymentOptions: { value: WorkOrderWithRelations['payment_status']; label: string }[] = [
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'PARCIAL', label: 'Parcial' },
  { value: 'PAGO', label: 'Pago Integral' },
]

export function WorkOrderDetails({ order }: WorkOrderDetailsProps) {
  const [status, setStatus] = useState(order.status)
  const [paymentStatus, setPaymentStatus] = useState(order.payment_status)

  const handleStatusChange = async (newStatus: WorkOrderWithRelations['status']) => {
    try {
      await workOrderService.updateStatus(order.id, newStatus)
      setStatus(newStatus)
      if (newStatus === 'CONCLUIDO') {
        toast({
          title: 'Serviço Concluído!',
          description: 'Ordem de Serviço finalizada com sucesso.',
          variant: 'success' as 'default',
        })
      } else {
        toast({ title: `Status da OS atualizado para ${newStatus}` })
      }
    } catch {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' })
    }
  }

  const handlePaymentChange = async (newPayment: WorkOrderWithRelations['payment_status']) => {
    try {
      await workOrderService.updatePaymentStatus(order.id, newPayment)
      setPaymentStatus(newPayment)
      toast({ title: `Status de pagamento atualizado para ${newPayment}` })
    } catch {
      toast({ title: 'Erro ao atualizar pagamento', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon">
            <Link href="/ordens">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                Ordem de Serviço #{order.number}
              </h1>
              <Badge
                variant={
                  status === 'CONCLUIDO'
                    ? 'success'
                    : status === 'EM_INSTALACAO'
                    ? 'warning'
                    : 'outline'
                }
              >
                {status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Aberta em {formatDate(order.created_at)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Botão de Conclusão Rápida */}
          {status !== 'CONCLUIDO' ? (
            <Button
              onClick={() => handleStatusChange('CONCLUIDO')}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 font-bold text-white shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4" /> Finalizar / Concluir Serviço
            </Button>
          ) : (
            <Badge variant="success" className="gap-1.5 py-1.5 px-3 text-xs font-bold">
              <Check className="h-4 w-4" /> Serviço Concluído
            </Badge>
          )}

          {/* Status Changer */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">Status:</span>
            <select
              value={status}
              onChange={(e) =>
                handleStatusChange(e.target.value as WorkOrderWithRelations['status'])
              }
              className="rounded-lg border bg-background px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Changer */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">Pagamento:</span>
            <select
              value={paymentStatus}
              onChange={(e) =>
                handlePaymentChange(e.target.value as WorkOrderWithRelations['payment_status'])
              }
              className="rounded-lg border bg-background px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {paymentOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <Button variant="outline" onClick={() => window.print()} className="gap-1.5">
            <Printer className="h-4 w-4" /> Imprimir OS
          </Button>
        </div>
      </div>

      {/* Info Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Cliente & Destino */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-primary" /> Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="font-bold text-foreground">
              {order.customer?.name || 'Cliente'}
            </p>
            {order.customer?.whatsapp && (
              <p className="text-xs text-muted-foreground">
                WhatsApp: {order.customer.whatsapp}
              </p>
            )}
            {order.customer?.address && (
              <p className="text-xs text-muted-foreground">
                Endereço: {order.customer.address}, {order.customer.address_number || ''}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Veículo */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Car className="h-3.5 w-3.5 text-primary" /> Veículo / Local
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            {order.vehicle ? (
              <>
                <p className="font-bold text-foreground">
                  {order.vehicle.brand} {order.vehicle.model}
                </p>
                {order.vehicle.plate && (
                  <p className="text-xs text-muted-foreground font-mono">
                    Placa: {order.vehicle.plate} • {order.vehicle.type}
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Aplicação Residencial / Comercial
              </p>
            )}
          </CardContent>
        </Card>

        {/* Financeiro */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-emerald-500" /> Total da OS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(Number(order.total))}
            </p>
            <p className="text-xs text-muted-foreground">
              Pagamento: <strong>{paymentStatus}</strong>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Itens e Serviços */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" /> Serviços Executados nesta OS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b bg-muted/40 font-semibold text-muted-foreground uppercase text-[10px]">
                  <th className="py-2.5 px-3">Serviço / Produto</th>
                  <th className="py-2.5 px-3 text-center">Qtd</th>
                  <th className="py-2.5 px-3 text-right">Unitário</th>
                  <th className="py-2.5 px-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(order.items || []).map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="py-3 px-3 font-semibold text-foreground text-sm">
                      {item.description}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-medium">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-muted-foreground">
                      {formatCurrency(Number(item.unit_price))}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-foreground">
                      {formatCurrency(Number(item.subtotal))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {order.notes && (
            <div className="mt-4 pt-3 border-t text-xs text-muted-foreground">
              <strong>Observações:</strong> {order.notes}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Galeria Antes e Depois */}
      <BeforeAfterGallery orderId={order.id} initialFiles={order.files || []} />
    </div>
  )
}
