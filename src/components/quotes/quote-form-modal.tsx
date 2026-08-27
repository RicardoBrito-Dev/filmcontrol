'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  Trash2,
  Calculator,
  Loader2,
  FileText,
  User,
  Car,
  Calendar,
  Sparkles,
  MapPin,
} from 'lucide-react'
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
import { quoteService, type QuoteWithRelations } from '@/services/quote.service'
import { customerService, type CustomerWithRelations } from '@/services/customer.service'
import { serviceService } from '@/services/service.service'
import type { ServiceCatalog } from '@/types/database.types'
import type { QuoteFormData, QuoteItemFormData } from '@/schemas/quote.schema'
import { BudgetCalculatorModal } from '@/components/quotes/budget-calculator-modal'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

interface QuoteFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (quote: QuoteWithRelations) => void
}

export function QuoteFormModal({
  open,
  onOpenChange,
  onSuccess,
}: QuoteFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<CustomerWithRelations[]>([])
  const [services, setServices] = useState<ServiceCatalog[]>([])

  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [selectedVehicleId, setSelectedVehicleId] = useState('')
  const [status, setStatus] = useState<QuoteFormData['status']>('AGUARDANDO_APROVACAO')
  const [validUntil, setValidUntil] = useState<string>(
    new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  )
  const [discount, setDiscount] = useState<number>(0)
  const [notes, setNotes] = useState('')

  // Items in quote
  const [items, setItems] = useState<QuoteItemFormData[]>([
    {
      description: 'Película G5 Laterais e Traseiro',
      quantity: 1,
      width: null,
      height: null,
      area: null,
      unit_price: 350.0,
      subtotal: 350.0,
    },
  ])

  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false)

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

  // Calculate totals
  const subtotal = items.reduce((acc, item) => acc + (item.subtotal || 0), 0)
  const total = Math.max(0, subtotal - (discount || 0))

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        description: '',
        quantity: 1,
        width: null,
        height: null,
        area: null,
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
    field: keyof QuoteItemFormData,
    value: unknown
  ) => {
    setItems((prev) => {
      const updated = [...prev]
      const current = { ...updated[index], [field]: value }

      // If dimensions change, calculate area
      if (field === 'width' || field === 'height' || field === 'quantity') {
        const w = field === 'width' ? Number(value) : Number(current.width || 0)
        const h = field === 'height' ? Number(value) : Number(current.height || 0)
        const q = field === 'quantity' ? Number(value) : Number(current.quantity || 1)
        if (w > 0 && h > 0) {
          const area = Number((w * h * q).toFixed(2))
          current.area = area
        }
      }

      // Calculate item subtotal
      if (field === 'unit_price' || field === 'quantity') {
        const p = field === 'unit_price' ? Number(value) : Number(current.unit_price || 0)
        const q = field === 'quantity' ? Number(value) : Number(current.quantity || 1)
        current.subtotal = Number((p * q).toFixed(2))
      }

      updated[index] = current
      return updated
    })
  }

  const handleSelectServiceForIndex = (index: number, serviceId: string) => {
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

  const handleCalculationApplied = (calcItem: {
    description: string
    quantity: number
    width: number
    height: number
    area: number
    unitPrice: number
    totalPrice: number
  }) => {
    setItems((prev) => [
      ...prev,
      {
        description: calcItem.description,
        quantity: calcItem.quantity,
        width: calcItem.width,
        height: calcItem.height,
        area: calcItem.area,
        unit_price: calcItem.unitPrice,
        subtotal: calcItem.totalPrice,
      },
    ])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedCustomerId) {
      toast({ title: 'Selecione um cliente para o orçamento', variant: 'destructive' })
      return
    }

    if (items.length === 0) {
      toast({ title: 'Adicione pelo menos um item', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const payload: QuoteFormData = {
        customer_id: selectedCustomerId,
        vehicle_id: selectedVehicleId || null,
        status,
        subtotal,
        discount,
        total,
        valid_until: validUntil || null,
        notes: notes || null,
        items,
      }

      const vehicle = customerVehicles.find((v) => v.id === selectedVehicleId) || null
      const created = await quoteService.create(payload, selectedCustomer, vehicle)

      toast({
        title: 'Orçamento gerado com sucesso!',
        description: `Orçamento ${created.number} criado.`,
        variant: 'success' as 'default',
      })

      onSuccess(created)
      onOpenChange(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar orçamento'
      toast({ title: 'Erro ao criar orçamento', description: message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[95vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Novo Orçamento de Películas
            </DialogTitle>
            <DialogDescription>
              Crie orçamentos detalhados para atendimento automotivo, residencial ou comercial.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seção 1: Cliente & Destino */}
            <div className="rounded-xl border bg-card p-4 space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                1. Cliente & Local de Instalação
              </h4>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="q-customer">Cliente *</Label>
                  <select
                    id="q-customer"
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
                        {c.name} {c.whatsapp ? `(${c.whatsapp})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="q-vehicle">Veículo / Tipo de Atendimento</Label>
                  <select
                    id="q-vehicle"
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">
                      {selectedCustomer?.address
                        ? `Residencial / Comercial: ${selectedCustomer.address}`
                        : 'Atendimento no Local / Sem veículo'}
                    </option>
                    {customerVehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        🚗 {v.brand} {v.model} {v.plate ? `(${v.plate})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="q-validity">Validade do Orçamento</Label>
                  <Input
                    id="q-validity"
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="q-status">Status Inicial</Label>
                  <select
                    id="q-status"
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as QuoteFormData['status'])
                    }
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="RASCUNHO">Rascunho</option>
                    <option value="ENVIADO">Enviado</option>
                    <option value="AGUARDANDO_APROVACAO">Aguardando Aprovação</option>
                    <option value="APROVADO">Aprovado</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Seção 2: Itens do Orçamento */}
            <div className="rounded-xl border bg-card p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  2. Serviços e Películas Incluídas
                </h4>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCalculatorOpen(true)}
                    className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10 text-xs"
                  >
                    <Calculator className="h-3.5 w-3.5" /> Calculadora de Vidros (m²)
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAddItem}
                    className="gap-1 text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" /> Item Manual
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-lg border bg-muted/30 p-3 space-y-3 relative group"
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 items-end">
                      {/* Selecionar catálogo ou digitar */}
                      <div className="sm:col-span-6 space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Serviço / Película</Label>
                          {services.length > 0 && (
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleSelectServiceForIndex(index, e.target.value)
                                }
                              }}
                              className="text-[11px] bg-transparent text-primary underline cursor-pointer outline-none"
                            >
                              <option value="">Puxar do catálogo...</option>
                              {services.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name} ({formatCurrency(Number(s.default_price))})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        <Input
                          value={item.description}
                          onChange={(e) =>
                            handleItemChange(index, 'description', e.target.value)
                          }
                          placeholder="Ex: Película Nano Cerâmica ou Jateado Sacada"
                          required
                        />
                      </div>

                      {/* Quantidade */}
                      <div className="sm:col-span-2 space-y-1">
                        <Label className="text-xs">Qtd</Label>
                        <Input
                          type="number"
                          min={0.1}
                          step="0.1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(index, 'quantity', e.target.value)
                          }
                        />
                      </div>

                      {/* Preço Unitário */}
                      <div className="sm:col-span-2 space-y-1">
                        <Label className="text-xs">Unitário (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) =>
                            handleItemChange(index, 'unit_price', e.target.value)
                          }
                        />
                      </div>

                      {/* Subtotal & Remover */}
                      <div className="sm:col-span-2 flex items-center justify-between gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Subtotal</Label>
                          <div className="font-bold text-sm text-foreground">
                            {formatCurrency(item.subtotal)}
                          </div>
                        </div>

                        {items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(index)}
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Dimensões se houver */}
                    {item.width && item.height && (
                      <div className="text-[11px] text-muted-foreground flex items-center gap-2 pt-1 border-t">
                        <span>
                          Medidas: {item.width}m × {item.height}m
                        </span>
                        <span>•</span>
                        <span>Área Total: {item.area} m²</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Seção 3: Totais & Observações */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="q-notes">Observações do Orçamento / Termos</Label>
                <textarea
                  id="q-notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Garantia de 3 anos contra bolhas e desbotamento. Pagamento via PIX ou até 3x no cartão..."
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm gap-4">
                  <Label htmlFor="q-discount" className="text-muted-foreground">
                    Desconto (R$):
                  </Label>
                  <Input
                    id="q-discount"
                    type="number"
                    min={0}
                    step="5"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-28 text-right font-mono"
                  />
                </div>

                <div className="pt-2 border-t flex justify-between items-baseline">
                  <span className="font-bold text-foreground">Valor Total:</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
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
              <Button type="submit" disabled={loading} className="gap-1.5">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" /> Gerar Orçamento
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Calculadora embutida que pode alimentar o orçamento */}
      <BudgetCalculatorModal
        open={isCalculatorOpen}
        onOpenChange={setIsCalculatorOpen}
        onApplyCalculation={handleCalculationApplied}
      />
    </>
  )
}
