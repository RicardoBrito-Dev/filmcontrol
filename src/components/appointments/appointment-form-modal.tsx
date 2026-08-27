'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, User, Car, MapPin, Loader2, Building2 } from 'lucide-react'
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
import { appointmentService, type AppointmentWithRelations } from '@/services/appointment.service'
import { customerService, type CustomerWithRelations, type QuickVehicleInput } from '@/services/customer.service'
import type { AppointmentFormData } from '@/schemas/appointment.schema'
import { toast } from '@/hooks/use-toast'

interface AppointmentFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (appointment: AppointmentWithRelations) => void
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

export function AppointmentFormModal({
  open,
  onOpenChange,
  onSuccess,
}: AppointmentFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<CustomerWithRelations[]>([])

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

  const [title, setTitle] = useState('Instalação de Película')
  const [startTime, setStartTime] = useState(
    new Date(Date.now() + 3600000).toISOString().slice(0, 16)
  )
  const [endTime, setEndTime] = useState(
    new Date(Date.now() + 7200000).toISOString().slice(0, 16)
  )
  const [address, setAddress] = useState('')
  const [status, setStatus] = useState<AppointmentFormData['status']>('CONFIRMADO')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    async function loadCustomers() {
      const data = await customerService.list()
      setCustomers(data)
      if (data.length > 0) {
        setClientMode('EXISTING')
      } else {
        setClientMode('NEW')
      }
    }
    if (open) {
      loadCustomers()
    }
  }, [open])

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId)
  const vehicles = selectedCustomer?.vehicles || []

  // Auto-fill address if customer changes
  useEffect(() => {
    if (selectedCustomer && !selectedVehicleId) {
      if (selectedCustomer.address) {
        setAddress(
          `${selectedCustomer.address}, ${selectedCustomer.address_number || ''} - ${selectedCustomer.neighborhood || ''}`
        )
      } else {
        setAddress('Na loja')
      }
    }
  }, [selectedCustomer, selectedVehicleId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast({ title: 'Informe o título do agendamento', variant: 'destructive' })
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
        activeVehicle = vehicles.find((v) => v.id === selectedVehicleId) || null
      }

      if (!activeCustomer) {
        throw new Error('Falha ao identificar cliente')
      }

      const defaultAddress =
        address ||
        (activeCustomer.address ? `${activeCustomer.address}` : 'Na loja')

      const payload: AppointmentFormData = {
        customer_id: activeCustomer.id,
        vehicle_id: activeVehicle?.id || null,
        title,
        start_time: new Date(startTime).toISOString(),
        end_time: endTime ? new Date(endTime).toISOString() : null,
        address: defaultAddress,
        status,
        notes: notes || null,
      }

      const created = await appointmentService.create(payload, activeCustomer, activeVehicle)

      toast({
        title: 'Agendamento criado!',
        description: `${title} marcado para ${activeCustomer.name}.`,
        variant: 'success' as 'default',
      })

      onSuccess(created)
      onOpenChange(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao agendar'
      toast({ title: 'Erro ao agendar', description: message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-5 w-5 text-primary" /> Novo Agendamento
          </DialogTitle>
          <DialogDescription>
            Agende serviços de instalação para clientes novos ou existentes em 1 único passo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="apt-title" className="text-xs font-semibold">
              Título do Serviço / Película <span className="text-destructive">*</span>
            </Label>
            <Input
              id="apt-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Película Nano Cerâmica / Jateado Sacada"
              className="h-9 text-sm font-medium"
              required
            />
          </div>

          {/* Seletor de Cliente: Novo vs Cadastrado */}
          <div className="rounded-xl border bg-card p-3 space-y-3">
            <div className="flex items-center justify-between border-b pb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-primary" /> Cliente
              </span>

              <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setClientMode('NEW')}
                  className={`text-[11px] px-2 py-0.5 rounded-md font-semibold transition-all ${
                    clientMode === 'NEW'
                      ? 'bg-card text-primary shadow-sm font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  ✨ Novo
                </button>
                <button
                  type="button"
                  onClick={() => setClientMode('EXISTING')}
                  className={`text-[11px] px-2 py-0.5 rounded-md font-semibold transition-all ${
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
              <div className="space-y-2.5 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">Nome do Cliente *</Label>
                    <Input
                      placeholder="Ex: Ricardo Brito"
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      className="h-8 text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">WhatsApp</Label>
                    <Input
                      placeholder="(11) 99999-9999"
                      value={newCustPhone}
                      onChange={(e) => setNewCustPhone(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Tipo</Label>
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        onClick={() => setNewCustType('AUTOMOTIVO')}
                        className={`py-1 px-1.5 rounded-md text-[11px] font-semibold border text-center ${
                          newCustType === 'AUTOMOTIVO'
                            ? 'border-primary bg-primary/10 text-primary font-bold'
                            : 'border-muted bg-background text-muted-foreground'
                        }`}
                      >
                        🚗 Auto
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewCustType('RESIDENCIAL')}
                        className={`py-1 px-1.5 rounded-md text-[11px] font-semibold border text-center ${
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
                  <div className="grid grid-cols-3 gap-2 pt-1 border-t">
                    <Input
                      placeholder="Marca (ex: Honda)"
                      value={newVBrand}
                      onChange={(e) => setNewVBrand(e.target.value)}
                      className="h-8 text-xs"
                    />
                    <Input
                      placeholder="Modelo (ex: Civic)"
                      value={newVModel}
                      onChange={(e) => setNewVModel(e.target.value)}
                      className="h-8 text-xs"
                    />
                    <Input
                      placeholder="Placa"
                      value={newVPlate}
                      onChange={(e) => setNewVPlate(e.target.value.toUpperCase())}
                      className="h-8 text-xs font-mono uppercase"
                    />
                  </div>
                ) : (
                  <div className="pt-1 border-t">
                    <Input
                      placeholder="Endereço da instalação (Rua, nº, bairro)"
                      value={newCustAddress}
                      onChange={(e) => {
                        setNewCustAddress(e.target.value)
                        setAddress(e.target.value)
                      }}
                      className="h-8 text-xs"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <Label htmlFor="apt-customer" className="text-xs">Cliente *</Label>
                  <select
                    id="apt-customer"
                    value={selectedCustomerId}
                    onChange={(e) => {
                      setSelectedCustomerId(e.target.value)
                      setSelectedVehicleId('')
                    }}
                    className="w-full rounded-lg border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring h-8"
                    required
                  >
                    <option value="">Selecione...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.whatsapp ? `(${c.whatsapp})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="apt-vehicle" className="text-xs">Veículo / Local</Label>
                  <select
                    id="apt-vehicle"
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="w-full rounded-lg border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring h-8"
                  >
                    <option value="">
                      {selectedCustomer?.address
                        ? `Aplicação: ${selectedCustomer.address}`
                        : 'Atendimento na Loja'}
                    </option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        🚗 {v.brand} {v.model} ({v.plate || 'S/ placa'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="apt-start" className="text-xs font-semibold">Data & Horário de Início *</Label>
              <Input
                id="apt-start"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-8 text-xs font-mono"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="apt-end" className="text-xs font-semibold">Previsão de Término</Label>
              <Input
                id="apt-end"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="apt-address" className="text-xs font-semibold">Local da Instalação</Label>
              <Input
                id="apt-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ex: Na Loja / Alameda Lorena 550..."
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="apt-status" className="text-xs font-semibold">Status do Agendamento</Label>
              <select
                id="apt-status"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as AppointmentFormData['status'])
                }
                className="w-full rounded-lg border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring h-8"
              >
                <option value="CONFIRMADO">Confirmado</option>
                <option value="AGENDADO">Agendado</option>
                <option value="EM_ANDAMENTO">Em Andamento</option>
                <option value="CONCLUIDO">Concluído</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="apt-notes" className="text-xs font-semibold">Observações</Label>
            <textarea
              id="apt-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Retirar veículo às 16h; cliente pediu atenção especial no parabrisa..."
              className="w-full rounded-lg border bg-background px-3 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
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
                  Agendando...
                </>
              ) : (
                'Confirmar Agendamento'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
