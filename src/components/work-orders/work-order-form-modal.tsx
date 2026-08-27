'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2, ClipboardList, User, Car, Calendar, DollarSign, Building2 } from 'lucide-react'
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
import { customerService, type CustomerWithRelations, type QuickVehicleInput } from '@/services/customer.service'
import { serviceService } from '@/services/service.service'
import type { ServiceCatalog, VehicleType } from '@/types/database.types'
import type { WorkOrderFormData, WorkOrderItemFormData } from '@/schemas/work-order.schema'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

interface WorkOrderFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (order: WorkOrderWithRelations) => void
}

const commonBrands = [
  'Chevrolet',
  'Volkswagen',
  'Fiat',
  'Toyota',
  'Honda',
  'Hyundai',
  'Jeep',
  'Ford',
  'Renault',
  'Nissan',
  'BMW',
  'Mercedes-Benz',
  'Audi',
  'BYD',
  'GWM',
  'Outra',
]

export function WorkOrderFormModal({
  open,
  onOpenChange,
  onSuccess,
}: WorkOrderFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<CustomerWithRelations[]>([])
  const [services, setServices] = useState<ServiceCatalog[]>([])

  // Modo de Cliente: 'EXISTING' | 'NEW'
  const [clientMode, setClientMode] = useState<'EXISTING' | 'NEW'>('NEW')

  // Cliente Existente
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [selectedVehicleId, setSelectedVehicleId] = useState('')

  // Novo Cliente Rápido
  const [newCustName, setNewCustName] = useState('')
  const [newCustPhone, setNewCustPhone] = useState('')
  const [newCustType, setNewCustType] = useState<'AUTOMOTIVO' | 'RESIDENCIAL'>('AUTOMOTIVO')
  const [newVBrand, setNewVBrand] = useState('')
  const [newVModel, setNewVModel] = useState('')
  const [newVPlate, setNewVPlate] = useState('')
  const [newCustAddress, setNewCustAddress] = useState('')

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
      if (c.length > 0) {
        setClientMode('EXISTING')
      } else {
        setClientMode('NEW')
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (items.length === 0) {
      toast({ title: 'Adicione pelo menos um item', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      let activeCustomer: CustomerWithRelations | null = null
      let activeVehicle = null

      if (clientMode === 'NEW') {
        if (!newCustName.trim()) {
          toast({ title: 'Informe o nome do cliente', variant: 'destructive' })
          setLoading(false)
          return
        }

        const vehiclePayload: QuickVehicleInput | null =
          newCustType === 'AUTOMOTIVO' && newVBrand.trim() && newVModel.trim()
            ? {
                brand: newVBrand.trim(),
                model: newVModel.trim(),
                plate: newVPlate.trim() ? newVPlate.trim().toUpperCase() : null,
                type: 'CARRO',
              }
            : null

        const createdCust = await customerService.create(
          {
            name: newCustName.trim(),
            whatsapp: newCustPhone.trim() || '(11) 99999-9999',
            phone: newCustPhone.trim() || undefined,
            address: newCustAddress.trim() || undefined,
          },
          vehiclePayload
        )

        activeCustomer = createdCust
        activeVehicle = createdCust.vehicles?.[0] || null
      } else {
        if (!selectedCustomerId) {
          toast({ title: 'Selecione um cliente', variant: 'destructive' })
          setLoading(false)
          return
        }
        activeCustomer = selectedCustomer || null
        activeVehicle = customerVehicles.find((v) => v.id === selectedVehicleId) || null
      }

      if (!activeCustomer) {
        throw new Error('Falha ao identificar cliente')
      }

      const payload: WorkOrderFormData = {
        customer_id: activeCustomer.id,
        vehicle_id: activeVehicle?.id || null,
        quote_id: null,
        installer_id: null,
        status,
        payment_status: paymentStatus,
        total,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        notes: notes || null,
        items,
      }

      const created = await workOrderService.create(payload, activeCustomer, activeVehicle)

      toast({
        title: 'Ordem de Serviço criada!',
        description: `OS #${created.number} aberta para ${activeCustomer.name}.`,
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
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ClipboardList className="h-5 w-5 text-primary" /> Nova Ordem de Serviço
          </DialogTitle>
          <DialogDescription>
            Abra uma nova OS para clientes novos ou existentes de forma rápida e prática.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seção 1: Cliente & Veículo */}
          <div className="rounded-xl border bg-card p-3.5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-primary" /> 1. Cliente & Destino
              </span>

              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setClientMode('NEW')}
                  className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-all ${
                    clientMode === 'NEW'
                      ? 'bg-card text-primary shadow-sm font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  ✨ Novo Cliente
                </button>

                <button
                  type="button"
                  onClick={() => setClientMode('EXISTING')}
                  className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-all ${
                    clientMode === 'EXISTING'
                      ? 'bg-card text-primary shadow-sm font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  👤 Cadastrado ({customers.length})
                </button>
              </div>
            </div>

            {clientMode === 'NEW' ? (
              <div className="space-y-3 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs font-semibold">Nome Completo *</Label>
                    <Input
                      placeholder="Ex: Carlos Oliveira"
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      className="h-9 text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">WhatsApp</Label>
                    <Input
                      placeholder="(11) 99999-9999"
                      value={newCustPhone}
                      onChange={(e) => setNewCustPhone(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Tipo</Label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setNewCustType('AUTOMOTIVO')}
                        className={`py-1 px-2 rounded-lg text-xs font-semibold border text-center transition-all ${
                          newCustType === 'AUTOMOTIVO'
                            ? 'border-primary bg-primary/10 text-primary font-bold'
                            : 'border-muted bg-background text-muted-foreground'
                        }`}
                      >
                        🚗 Automotivo
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewCustType('RESIDENCIAL')}
                        className={`py-1 px-2 rounded-lg text-xs font-semibold border text-center transition-all ${
                          newCustType === 'RESIDENCIAL'
                            ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold'
                            : 'border-muted bg-background text-muted-foreground'
                        }`}
                      >
                        🏠 Residencial
                      </button>
                    </div>
                  </div>
                </div>

                {newCustType === 'AUTOMOTIVO' ? (
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 pt-1 border-t">
                    <div className="space-y-1">
                      <Label className="text-xs">Marca</Label>
                      <Input
                        list="wo-brand-list"
                        placeholder="Ex: Toyota"
                        value={newVBrand}
                        onChange={(e) => setNewVBrand(e.target.value)}
                        className="h-9 text-sm"
                      />
                      <datalist id="wo-brand-list">
                        {commonBrands.map((b) => (
                          <option key={b} value={b} />
                        ))}
                      </datalist>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Modelo</Label>
                      <Input
                        placeholder="Ex: Corolla"
                        value={newVModel}
                        onChange={(e) => setNewVModel(e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Placa</Label>
                      <Input
                        placeholder="Ex: BRA-2E19"
                        value={newVPlate}
                        onChange={(e) => setNewVPlate(e.target.value.toUpperCase())}
                        className="h-9 text-sm font-mono uppercase"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 pt-1 border-t">
                    <Label className="text-xs">Endereço da Instalação</Label>
                    <Input
                      placeholder="Ex: Alameda Lorena, 550"
                      value={newCustAddress}
                      onChange={(e) => setNewCustAddress(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <Label htmlFor="wo-cust" className="text-xs font-semibold">Cliente *</Label>
                  <select
                    id="wo-cust"
                    value={selectedCustomerId}
                    onChange={(e) => {
                      setSelectedCustomerId(e.target.value)
                      setSelectedVehicleId('')
                    }}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring h-9"
                    required
                  >
                    <option value="">Selecione um cliente...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.whatsapp ? `(${c.whatsapp})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="wo-veh" className="text-xs font-semibold">Veículo / Local</Label>
                  <select
                    id="wo-veh"
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring h-9"
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
              </div>
            )}
          </div>

          {/* Status & Pagamento */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
            <div className="space-y-1">
              <Label htmlFor="wo-status" className="text-xs font-semibold">Status da OS</Label>
              <select
                id="wo-status"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as WorkOrderFormData['status'])
                }
                className="w-full rounded-lg border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring h-8"
              >
                <option value="AGENDADO">Agendado</option>
                <option value="EM_INSTALACAO">Em Instalação</option>
                <option value="AGUARDANDO_PAGAMENTO">Aguardando Pagamento</option>
                <option value="CONCLUIDO">Concluído</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="wo-pay" className="text-xs font-semibold">Status do Pagamento</Label>
              <select
                id="wo-pay"
                value={paymentStatus}
                onChange={(e) =>
                  setPaymentStatus(e.target.value as WorkOrderFormData['payment_status'])
                }
                className="w-full rounded-lg border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring h-8"
              >
                <option value="PENDENTE">Pendente</option>
                <option value="PARCIAL">Parcial (Sinal Pago)</option>
                <option value="PAGO">Pago Integral</option>
              </select>
            </div>
          </div>

          {/* Itens */}
          <div className="rounded-xl border bg-card p-3.5 space-y-2.5">
            <div className="flex items-center justify-between border-b pb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Serviços / Películas
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddItem}
                className="text-xs gap-1 h-7"
              >
                <Plus className="h-3 w-3" /> +Item
              </Button>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="rounded-lg border bg-muted/30 p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Item #{index + 1}</Label>
                    {services.length > 0 && (
                      <select
                        onChange={(e) => {
                          const s = services.find((srv) => srv.id === e.target.value)
                          if (s) {
                            handleItemChange(index, 'description', s.name)
                            handleItemChange(index, 'unit_price', Number(s.default_price))
                          }
                        }}
                        className="text-[11px] bg-card border rounded px-1.5 py-0.5 text-primary font-semibold cursor-pointer outline-none max-w-[200px]"
                      >
                        <option value="">✨ Puxar Catálogo...</option>
                        <optgroup label="🚗 Pacotes Automotivos">
                          {services
                            .filter((s) => s.category === 'AUTOMOTIVO')
                            .map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} ({formatCurrency(Number(s.default_price))})
                              </option>
                            ))}
                        </optgroup>
                        <optgroup label="🏠 Residencial, Comercial e m²">
                          {services
                            .filter((s) => s.category !== 'AUTOMOTIVO')
                            .map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} ({formatCurrency(Number(s.default_price))})
                              </option>
                            ))}
                        </optgroup>
                      </select>
                    )}
                  </div>
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-6">
                      <Input
                        value={item.description}
                        onChange={(e) =>
                          handleItemChange(index, 'description', e.target.value)
                        }
                        placeholder="Descrição do serviço"
                        className="text-xs h-8"
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
                        className="text-xs text-center font-mono h-8"
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
                        className="text-xs font-mono h-8"
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
                </div>
              ))}
            </div>

            <div className="pt-2 border-t flex justify-between items-center text-sm">
              <span className="font-bold">Total da OS:</span>
              <span className="text-xl font-bold text-primary">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="h-9"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="gap-1.5 font-bold h-9">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Abrindo OS...
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
