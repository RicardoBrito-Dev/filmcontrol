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
  Building2,
  UserPlus,
  Edit,
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
import { customerService, type CustomerWithRelations, type QuickVehicleInput } from '@/services/customer.service'
import { serviceService } from '@/services/service.service'
import type { ServiceCatalog, VehicleType, Vehicle } from '@/types/database.types'
import type { QuoteFormData, QuoteItemFormData } from '@/schemas/quote.schema'
import { BudgetCalculatorModal } from '@/components/quotes/budget-calculator-modal'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

interface QuoteFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (quote: QuoteWithRelations) => void
  quoteToEdit?: QuoteWithRelations | null
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

export function QuoteFormModal({
  open,
  onOpenChange,
  onSuccess,
  quoteToEdit,
}: QuoteFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<CustomerWithRelations[]>([])
  const [services, setServices] = useState<ServiceCatalog[]>([])

  // Modo de Cliente: 'EXISTING' | 'NEW'
  const [clientMode, setClientMode] = useState<'EXISTING' | 'NEW'>('EXISTING')

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

      if (quoteToEdit) {
        setClientMode('EXISTING')
        setSelectedCustomerId(quoteToEdit.customer_id)
        setSelectedVehicleId(quoteToEdit.vehicle_id || '')
        setStatus(quoteToEdit.status)
        setValidUntil(
          quoteToEdit.valid_until
            ? quoteToEdit.valid_until.split('T')[0]
            : new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
        )
        setDiscount(Number(quoteToEdit.discount) || 0)
        setNotes(quoteToEdit.notes || '')
        if (quoteToEdit.items && quoteToEdit.items.length > 0) {
          setItems(
            quoteToEdit.items.map((i) => ({
              service_id: i.service_id,
              description: i.description,
              quantity: i.quantity,
              width: i.width,
              height: i.height,
              area: i.area,
              unit_price: Number(i.unit_price),
              subtotal: Number(i.subtotal),
            }))
          )
        }
      } else {
        if (c.length > 0) {
          setClientMode('EXISTING')
        } else {
          setClientMode('NEW')
        }
        setSelectedCustomerId('')
        setSelectedVehicleId('')
        setStatus('AGUARDANDO_APROVACAO')
        setValidUntil(new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0])
        setDiscount(0)
        setNotes('')
        setItems([
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
      }
    }

    if (open) {
      loadData()
    }
  }, [open, quoteToEdit])

  const selectedCustomer: CustomerWithRelations | undefined =
    customers.find((c) => c.id === selectedCustomerId) ||
    (quoteToEdit?.customer as CustomerWithRelations | undefined)
  const customerVehicles: Vehicle[] =
    selectedCustomer?.vehicles || (quoteToEdit?.vehicle ? [quoteToEdit.vehicle] : [])

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

      if (field === 'width' || field === 'height' || field === 'quantity') {
        const w = field === 'width' ? Number(value) : Number(current.width || 0)
        const h = field === 'height' ? Number(value) : Number(current.height || 0)
        const q = field === 'quantity' ? Number(value) : Number(current.quantity || 1)
        if (w > 0 && h > 0) {
          const area = Number((w * h * q).toFixed(2))
          current.area = area
        }
      }

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

    if (items.length === 0) {
      toast({ title: 'Adicione pelo menos um item ao orçamento', variant: 'destructive' })
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
          toast({ title: 'Selecione um cliente para o orçamento', variant: 'destructive' })
          setLoading(false)
          return
        }
        activeCustomer = selectedCustomer || null
        activeVehicle = customerVehicles.find((v: Vehicle) => v.id === selectedVehicleId) || null
      }

      if (!activeCustomer) {
        throw new Error('Falha ao identificar o cliente')
      }

      const payload: QuoteFormData = {
        customer_id: activeCustomer.id,
        vehicle_id: activeVehicle?.id || null,
        status,
        subtotal,
        discount,
        total,
        valid_until: validUntil || null,
        notes: notes || null,
        items,
      }

      let resultQuote: QuoteWithRelations

      if (quoteToEdit) {
        resultQuote = await quoteService.update(quoteToEdit.id, payload, activeCustomer, activeVehicle)
        toast({
          title: 'Orçamento atualizado!',
          description: `Orçamento #${resultQuote.number} salvo com sucesso.`,
          variant: 'success' as 'default',
        })
      } else {
        resultQuote = await quoteService.create(payload, activeCustomer, activeVehicle)
        toast({
          title: 'Orçamento gerado com sucesso!',
          description: `Orçamento #${resultQuote.number} gerado para ${activeCustomer.name}.`,
          variant: 'success' as 'default',
        })
      }

      onSuccess(resultQuote)
      onOpenChange(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao processar orçamento'
      toast({ title: 'Erro no orçamento', description: message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto w-full sm:max-w-3xl p-4 sm:p-6 gap-4 rounded-t-2xl sm:rounded-2xl top-auto bottom-0 sm:top-1/2 sm:bottom-auto translate-y-0 sm:-translate-y-1/2 data-[state=open]:slide-in-from-bottom-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FileText className="h-5 w-5 text-primary" />
              {quoteToEdit ? `Editar Orçamento #${quoteToEdit.number}` : 'Novo Orçamento de Películas'}
            </DialogTitle>
            <DialogDescription>
              {quoteToEdit
                ? 'Altere serviços, películas, medidas, descontos e prazos antes de aprovar.'
                : 'Crie orçamentos rápidos para clientes novos ou já cadastrados, sem sair desta tela.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Seção 1: Cliente Rápido ou Existente */}
            <div className="rounded-xl border bg-card p-4 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-primary" /> 1. Cliente & Veículo / Local
                </h4>

                {/* Alternador Rápido: Novo Cliente vs Cliente Cadastrado (desabilitado se editando orçamento existente) */}
                {!quoteToEdit && (
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
                      👤 Cliente Cadastrado ({customers.length})
                    </button>
                  </div>
                )}
              </div>

              {/* Se MODO NOVO CLIENTE */}
              {clientMode === 'NEW' && !quoteToEdit ? (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs font-semibold">Nome Completo do Cliente *</Label>
                      <Input
                        placeholder="Ex: Carlos Eduardo / Loja AutoCar"
                        value={newCustName}
                        onChange={(e) => setNewCustName(e.target.value)}
                        className="h-9 text-sm font-medium"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">WhatsApp para Envio</Label>
                      <Input
                        placeholder="(11) 99999-9999"
                        value={newCustPhone}
                        onChange={(e) => setNewCustPhone(e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Tipo de Atendimento</Label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setNewCustType('AUTOMOTIVO')}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold border text-center transition-all ${
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
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold border text-center transition-all ${
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
                        <Label className="text-xs">Marca do Carro</Label>
                        <Input
                          list="quote-brand-list"
                          placeholder="Ex: Honda, Toyota"
                          value={newVBrand}
                          onChange={(e) => setNewVBrand(e.target.value)}
                          className="h-9 text-sm"
                        />
                        <datalist id="quote-brand-list">
                          {commonBrands.map((b) => (
                            <option key={b} value={b} />
                          ))}
                        </datalist>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Modelo</Label>
                        <Input
                          placeholder="Ex: Civic, Corolla"
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
                      <Label className="text-xs">Endereço da Aplicação (Imóvel / Sacada / Fachada)</Label>
                      <Input
                        placeholder="Ex: Rua Harmonia, 120 - Apto 42, Vila Madalena"
                        value={newCustAddress}
                        onChange={(e) => setNewCustAddress(e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                  )}
                </div>
              ) : (
                /* Se MODO CLIENTE EXISTENTE */
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <Label htmlFor="q-customer" className="text-xs font-semibold">
                      Selecione o Cliente *
                    </Label>
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

                  <div className="space-y-1">
                    <Label htmlFor="q-vehicle" className="text-xs font-semibold">
                      Veículo / Destino
                    </Label>
                    <select
                      id="q-vehicle"
                      value={selectedVehicleId}
                      onChange={(e) => setSelectedVehicleId(e.target.value)}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">
                        {selectedCustomer?.address
                          ? `Residencial: ${selectedCustomer.address}`
                          : 'Atendimento no Local / Na Loja'}
                      </option>
                      {customerVehicles.map((v: Vehicle) => (
                        <option key={v.id} value={v.id}>
                          🚗 {v.brand} {v.model} {v.plate ? `(${v.plate})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Linha de Validade e Status */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-2 border-t text-xs">
                <div className="space-y-1">
                  <Label htmlFor="q-validity" className="text-xs font-semibold">Validade da Proposta</Label>
                  <Input
                    id="q-validity"
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="q-status" className="text-xs font-semibold">Status do Orçamento</Label>
                  <select
                    id="q-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as QuoteFormData['status'])}
                    className="w-full rounded-lg border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring h-8"
                  >
                    <option value="AGUARDANDO_APROVACAO">Aguardando Aprovação</option>
                    <option value="APROVADO">Aprovado (Já entra na Agenda)</option>
                    <option value="ENVIADO">Enviado ao Cliente</option>
                    <option value="RASCUNHO">Rascunho</option>
                    <option value="RECUSADO">Recusado</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Seção 2: Itens do Orçamento */}
            <div className="rounded-xl border bg-card p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  2. Serviços e Películas
                </h4>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCalculatorOpen(true)}
                    className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10 text-xs h-8"
                  >
                    <Calculator className="h-3.5 w-3.5" /> Calculadora m²
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAddItem}
                    className="gap-1 text-xs h-8"
                  >
                    <Plus className="h-3.5 w-3.5" /> +Item
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-lg border bg-muted/30 p-3 space-y-2 relative"
                  >
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12 items-end">
                      {/* Descrição e Catálogo */}
                      <div className="sm:col-span-6 space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold">Serviço / Película</Label>
                          {services.length > 0 && (
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleSelectServiceForIndex(index, e.target.value)
                                }
                              }}
                              className="text-[11px] bg-card border rounded px-1.5 py-0.5 text-primary font-semibold cursor-pointer outline-none max-w-[220px]"
                            >
                              <option value="">✨ Puxar do Catálogo Completo...</option>
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
                        <Input
                          value={item.description}
                          onChange={(e) =>
                            handleItemChange(index, 'description', e.target.value)
                          }
                          placeholder="Ex: Película Nano Cerâmica Completa ou Jateado Sacada"
                          className="h-9 text-sm"
                          required
                        />
                      </div>

                      {/* Quantidade */}
                      <div className="sm:col-span-2 space-y-1">
                        <Label className="text-xs font-semibold">Qtd (un/m²)</Label>
                        <Input
                          type="number"
                          min={0.1}
                          step="0.1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(index, 'quantity', e.target.value)
                          }
                          className="h-9 text-sm text-center font-mono"
                        />
                      </div>

                      {/* Valor do Serviço / Preço */}
                      <div className="sm:col-span-2 space-y-1">
                        <Label className="text-xs font-semibold text-foreground">
                          {Number(item.quantity || 1) > 1 ? 'Preço por Un. (R$)' : 'Valor (R$)'}
                        </Label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) =>
                              handleItemChange(index, 'unit_price', e.target.value)
                            }
                            className="h-9 text-sm font-mono pl-8"
                          />
                        </div>
                      </div>

                      {/* Total do Item & Excluir */}
                      <div className="sm:col-span-2 flex items-center justify-between gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold text-primary">Total do Item</Label>
                          <div className="font-bold text-sm text-primary">
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
                            title="Remover este item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Detalhes de cálculo / dimensões se houver */}
                    {(Number(item.quantity || 1) > 1 || (item.width && item.height)) && (
                      <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-2 pt-1 border-t">
                        {Number(item.quantity || 1) > 1 && (
                          <span className="font-medium text-foreground/80">
                            Conta: {item.quantity} × {formatCurrency(Number(item.unit_price || 0))} = {formatCurrency(item.subtotal)}
                          </span>
                        )}
                        {item.width && item.height && (
                          <>
                            <span>•</span>
                            <span>
                              Medidas: {item.width}m × {item.height}m
                            </span>
                            <span>•</span>
                            <span>Área Total: {item.area} m²</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Seção 3: Totais & Observações */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="q-notes" className="text-xs font-semibold">Observações / Garantia</Label>
                <textarea
                  id="q-notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Garantia de 5 anos contra desbotamento. Aplicação com acabamento sem bolhas..."
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
                  <Label htmlFor="q-discount" className="text-muted-foreground text-xs font-semibold">
                    Desconto (R$):
                  </Label>
                  <Input
                    id="q-discount"
                    type="number"
                    min={0}
                    step="5"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-28 text-right font-mono h-8 text-sm"
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
                    {quoteToEdit ? 'Salvando...' : 'Gerando...'}
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" /> {quoteToEdit ? 'Salvar Alterações' : 'Gerar Orçamento'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <BudgetCalculatorModal
        open={isCalculatorOpen}
        onOpenChange={setIsCalculatorOpen}
        onApplyCalculation={handleCalculationApplied}
      />
    </>
  )
}
