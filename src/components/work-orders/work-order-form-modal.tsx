'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2, ClipboardList, User, Car, Calendar, DollarSign } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { workOrderService, type WorkOrderWithRelations } from '@/services/work-order.service'
import { customerService, type CustomerWithRelations } from '@/services/customer.service'
import { serviceService } from '@/services/service.service'
import type { ServiceCatalog } from '@/types/database.types'
import type { WorkOrderFormData, WorkOrderItemFormData } from '@/schemas/work-order.schema'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

interface WorkOrderFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (order: WorkOrderWithRelations) => void
}

export function WorkOrderFormModal({
  open,
  onOpenChange,
  onSuccess,
}: WorkOrderFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<CustomerWithRelations[]>([])
  const [services, setServices] = useState<ServiceCatalog[]>([])

  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [selectedVehicleId, setSelectedVehicleId] = useState('')
  const [status, setStatus] = useState<WorkOrderFormData['status']>('AGENDADO')
  const [paymentStatus, setPaymentStatus] = useState<WorkOrderFormData['payment_status']>('PENDENTE')
  const [scheduledAt, setScheduledAt] = useState(new Date().toISOString().slice(0, 16))
  const [notes, setNotes] = useState('')

  const [items, setItems] = useState<WorkOrderItemFormData[]>([
    {
      description: 'Película G5 Completa',
      quantity: 1,
      unit_price: 350.0,
      subtotal: 350.0,
    },
  ])

  useEffect(() => {
    async function loadData() {
      const [c, s] = await Promise.all([customerService.list(), serviceService.list()])
      setCustomers(c)
      setServices(s)
    }
    if (open) {
      loadData()
    }
  }, [open])

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId)
  const customerVehicles = selectedCustomer?.vehicles || []

  const total = items.reduce((acc, item) => acc + (item.subtotal || 0), 0)

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        description: '',
        quantity: 1,
        unit_price: 0,
        subtotal: 0,
      },
    ])
  }

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleItemChange = (
    index: number,
    field: keyof WorkOrderItemFormData,
    value: unknown
  ) => {
    setItems((prev) => {
      const updated = [...prev]
      const current = { ...updated[index], [field]: value }

      if (field === 'unit_price' || field === 'quantity') {
        const p = field === 'unit_price' ? Number(value) : Number(current.unit_price || 0)
        const q = field === 'quantity' ? Number(value) : Number(current.quantity || 1)
        current.subtotal = Number((p * q).toFixed(2))
      }

      updated[index] = current
      return updated
    })
  }

  const handleSelectService = (index: number, serviceId: string) => {
    const s = services.find((srv) => srv.id === serviceId)
    if (s) {
      setItems((prev) => {
        const updated = [...prev]
        updated[index] = {
          ...updated[index],
          service_id: s.id,
          description: s.name,
          unit_price: Number(s.default_price),
          subtotal: Number(s.default_price) * (updated[index].quantity || 1),
        }
        return updated
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedCustomerId) {
      toast({ title: 'Selecione um cliente', variant: 'destructive' })
      return
    }

    if (items.length === 0) {
      toast({ title: 'Adicione pelo menos um item', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const payload: WorkOrderFormData = {
        customer_id: selectedCustomerId,
        vehicle_id: selectedVehicleId || null,
        quote_id: null,
        installer_id: null,
        status,
        payment_status: paymentStatus,
        total,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        notes: notes || null,
        items,
      }

      const vehicle = customerVehicles.find((v) => v.id === selectedVehicleId) || null
      const created = await workOrderService.create(payload, selectedCustomer, vehicle)

      toast({
        title: 'Ordem de Serviço criada!',
        description: `OS #${created.number} registrada com sucesso.`,
        variant: 'success' as 'default',
      })

      onSuccess(created)
      onOpenChange(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar OS'
      toast({ title: 'Erro ao criar OS', description: message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" /> Nova Ordem de Serviço
          </DialogTitle>
          <DialogDescription>
            Abra uma nova OS para instalação de películas com status e controle financeiro.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="wo-cust">Cliente *</Label>
              <select
                id="wo-cust"
                value={selectedCustomerId}
                onChange={(e) => {
                  setSelectedCustomerId(e.target.value)
                  setSelectedVehicleId('')
                }}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                <option value="">Selecione um cliente...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wo-veh">Veículo / Local</Label>
              <select
                id="wo-veh"
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">
                  {selectedCustomer?.address
                    ? `Residencial: ${selectedCustomer.address}`
                    : 'Atendimento na Loja'}
                </option>
                {customerVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    🚗 {v.brand} {v.model} ({v.plate || 'S/ placa'})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wo-status">Status da Instalação</Label>
              <select
                id="wo-status"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as WorkOrderFormData['status'])
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="AGENDADO">Agendado</option>
                <option value="EM_INSTALACAO">Em Instalação</option>
                <option value="AGUARDANDO_PAGAMENTO">Aguardando Pagamento</option>
                <option value="CONCLUIDO">Concluído</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wo-pay">Status do Pagamento</Label>
              <select
                id="wo-pay"
                value={paymentStatus}
                onChange={(e) =>
                  setPaymentStatus(e.target.value as WorkOrderFormData['payment_status'])
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="PENDENTE">Pendente</option>
                <option value="PARCIAL">Parcial (Entrada paga)</option>
                <option value="PAGO">Pago Integral</option>
              </select>
            </div>
          </div>

          {/* Itens */}
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Serviços / Películas
              </h4>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddItem}
                className="text-xs gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Adicionar Item
              </Button>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-6">
                    <Input
                      value={item.description}
                      onChange={(e) =>
                        handleItemChange(index, 'description', e.target.value)
                      }
                      placeholder="Descrição do serviço"
                      className="text-xs"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(index, 'quantity', e.target.value)
                      }
                      className="text-xs text-center"
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) =>
                        handleItemChange(index, 'unit_price', e.target.value)
                      }
                      className="text-xs font-mono"
                    />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(index)}
                        className="h-7 w-7 text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t flex justify-between items-center text-sm">
              <span className="font-bold">Total da OS:</span>
              <span className="text-lg font-bold text-primary">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wo-notes">Observações</Label>
            <textarea
              id="wo-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instruções de instalação, detalhes dos vidros..."
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Ordem de Serviço'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
