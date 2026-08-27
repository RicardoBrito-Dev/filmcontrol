'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, User, Car, MapPin, Loader2 } from 'lucide-react'
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
import { customerService, type CustomerWithRelations } from '@/services/customer.service'
import type { AppointmentFormData } from '@/schemas/appointment.schema'
import { toast } from '@/hooks/use-toast'

interface AppointmentFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (appointment: AppointmentWithRelations) => void
}

export function AppointmentFormModal({
  open,
  onOpenChange,
  onSuccess,
}: AppointmentFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<CustomerWithRelations[]>([])

  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [selectedVehicleId, setSelectedVehicleId] = useState('')
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

    if (!selectedCustomerId) {
      toast({ title: 'Selecione um cliente', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const payload: AppointmentFormData = {
        customer_id: selectedCustomerId,
        vehicle_id: selectedVehicleId || null,
        title,
        start_time: new Date(startTime).toISOString(),
        end_time: endTime ? new Date(endTime).toISOString() : null,
        address: address || 'Na loja',
        status,
        notes: notes || null,
      }

      const vehicle = vehicles.find((v) => v.id === selectedVehicleId) || null
      const created = await appointmentService.create(payload, selectedCustomer, vehicle)

      toast({
        title: 'Agendamento criado!',
        description: `${title} marcado com sucesso.`,
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
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" /> Novo Agendamento
          </DialogTitle>
          <DialogDescription>
            Agende serviços de instalação para a oficina ou atendimento no local (residencial/comercial).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apt-title">
              Título do Serviço / Película <span className="text-destructive">*</span>
            </Label>
            <Input
              id="apt-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Película Nano Cerâmica Completa / Jateado Varanda"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apt-customer">
              Cliente <span className="text-destructive">*</span>
            </Label>
            <select
              id="apt-customer"
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
            <Label htmlFor="apt-vehicle">Veículo / Local</Label>
            <select
              id="apt-vehicle"
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">
                {selectedCustomer?.address
                  ? `Aplicação no Local: ${selectedCustomer.address}`
                  : 'Atendimento na Loja'}
              </option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  🚗 {v.brand} {v.model} {v.plate ? `(${v.plate})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="apt-start">Data e Horário de Início *</Label>
              <Input
                id="apt-start"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apt-end">Horário Previsto de Término</Label>
              <Input
                id="apt-end"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apt-address">Endereço / Local da Instalação</Label>
            <Input
              id="apt-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ex: Na Loja / Alameda Lorena 550..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apt-status">Status do Agendamento</Label>
            <select
              id="apt-status"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as AppointmentFormData['status'])
              }
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="AGENDADO">Agendado</option>
              <option value="CONFIRMADO">Confirmado</option>
              <option value="EM_ANDAMENTO">Em Andamento</option>
              <option value="CONCLUIDO">Concluído</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apt-notes">Observações</Label>
            <textarea
              id="apt-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Cliente vai deixar o carro de manhã e retirar às 16h..."
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
