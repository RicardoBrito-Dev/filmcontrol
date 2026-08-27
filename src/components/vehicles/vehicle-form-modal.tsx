'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Car, Plus, User } from 'lucide-react'
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
import { vehicleSchema, type VehicleFormData } from '@/schemas/vehicle.schema'
import { vehicleService, type VehicleWithCustomer } from '@/services/vehicle.service'
import { customerService, type CustomerWithRelations } from '@/services/customer.service'
import { toast } from '@/hooks/use-toast'

interface VehicleFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicleToEdit?: VehicleWithCustomer | null
  preselectedCustomerId?: string
  onSuccess: (vehicle: VehicleWithCustomer) => void
}

const COMMON_BRANDS = [
  'Chevrolet',
  'Volkswagen',
  'Toyota',
  'Fiat',
  'Hyundai',
  'Honda',
  'Jeep',
  'Ford',
  'BMW',
  'BYD',
  'Mercedes-Benz',
  'Audi',
  'Nissan',
  'Renault',
  'Caoa Chery',
  'Volvo',
  'Peugeot',
  'Citroën',
  'RAM',
  'Porsche',
  'Outra',
]

const VEHICLE_TYPES = [
  { value: 'CARRO', label: 'Carro / Sedan / Hatch' },
  { value: 'SUV', label: 'SUV' },
  { value: 'PICKUP', label: 'Pickup / Caminhonete' },
  { value: 'MOTO', label: 'Moto' },
  { value: 'CAMINHAO', label: 'Caminhão / Van' },
  { value: 'OUTRO', label: 'Outro' },
]

export function VehicleFormModal({
  open,
  onOpenChange,
  vehicleToEdit,
  preselectedCustomerId,
  onSuccess,
}: VehicleFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<CustomerWithRelations[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      customer_id: preselectedCustomerId || '',
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      color: '',
      plate: '',
      type: 'CARRO',
      notes: '',
    },
  })

  useEffect(() => {
    async function loadCustomers() {
      const data = await customerService.list()
      setCustomers(data)
    }
    if (open) {
      loadCustomers()
    }
  }, [open])

  useEffect(() => {
    if (vehicleToEdit) {
      reset({
        customer_id: vehicleToEdit.customer_id,
        brand: vehicleToEdit.brand || '',
        model: vehicleToEdit.model || '',
        year: vehicleToEdit.year || new Date().getFullYear(),
        color: vehicleToEdit.color || '',
        plate: vehicleToEdit.plate || '',
        type: vehicleToEdit.type || 'CARRO',
        notes: vehicleToEdit.notes || '',
      })
    } else {
      reset({
        customer_id: preselectedCustomerId || '',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        color: '',
        plate: '',
        type: 'CARRO',
        notes: '',
      })
    }
  }, [vehicleToEdit, preselectedCustomerId, reset, open])

  const onSubmit = async (data: VehicleFormData) => {
    setLoading(true)
    try {
      if (vehicleToEdit) {
        const updated = await vehicleService.update(vehicleToEdit.id, data)
        toast({
          title: 'Veículo atualizado!',
          description: `${updated.brand} ${updated.model} salvo com sucesso.`,
          variant: 'success' as 'default',
        })
        onSuccess(updated)
      } else {
        const created = await vehicleService.create(data)
        toast({
          title: 'Veículo cadastrado!',
          description: `${created.brand} ${created.model} vinculado ao cliente.`,
          variant: 'success' as 'default',
        })
        onSuccess(created)
      }
      onOpenChange(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar veículo'
      toast({
        title: 'Erro ao salvar',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            {vehicleToEdit ? 'Editar Veículo' : 'Novo Veículo'}
          </DialogTitle>
          <DialogDescription>
            Cadastre os dados do veículo para emissão de orçamentos e ordens de serviço.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Cliente Proprietário */}
          <div className="space-y-2">
            <Label htmlFor="customer_id">
              Cliente Proprietário <span className="text-destructive">*</span>
            </Label>
            <select
              id="customer_id"
              {...register('customer_id')}
              disabled={!!preselectedCustomerId}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-75"
            >
              <option value="">Selecione um cliente...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.whatsapp ? `(${c.whatsapp})` : ''}
                </option>
              ))}
            </select>
            {errors.customer_id && (
              <p className="text-xs text-destructive">{errors.customer_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Marca */}
            <div className="space-y-2">
              <Label htmlFor="brand">
                Marca / Fabricante <span className="text-destructive">*</span>
              </Label>
              <input
                id="brand"
                list="brand-suggestions"
                placeholder="Ex: Chevrolet"
                {...register('brand')}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <datalist id="brand-suggestions">
                {COMMON_BRANDS.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
              {errors.brand && (
                <p className="text-xs text-destructive">{errors.brand.message}</p>
              )}
            </div>

            {/* Modelo */}
            <div className="space-y-2">
              <Label htmlFor="model">
                Modelo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="model"
                placeholder="Ex: Onix Plus / Civic / Corolla"
                {...register('model')}
                className={errors.model ? 'border-destructive' : ''}
              />
              {errors.model && (
                <p className="text-xs text-destructive">{errors.model.message}</p>
              )}
            </div>

            {/* Placa */}
            <div className="space-y-2">
              <Label htmlFor="plate">Placa do Veículo</Label>
              <Input
                id="plate"
                placeholder="ABC-1234 ou BRA2E19"
                {...register('plate')}
                onChange={(e) => setValue('plate', e.target.value.toUpperCase())}
                className="uppercase"
              />
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <Label htmlFor="type">
                Tipo de Veículo <span className="text-destructive">*</span>
              </Label>
              <select
                id="type"
                {...register('type')}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {VEHICLE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Ano */}
            <div className="space-y-2">
              <Label htmlFor="year">Ano / Modelo</Label>
              <Input
                id="year"
                type="number"
                placeholder="2024"
                {...register('year', { valueAsNumber: true })}
              />
            </div>

            {/* Cor */}
            <div className="space-y-2">
              <Label htmlFor="color">Cor</Label>
              <Input
                id="color"
                placeholder="Ex: Prata / Preto / Branco"
                {...register('color')}
              />
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações do Veículo</Label>
            <textarea
              id="notes"
              rows={2}
              placeholder="Ex: Possui película antiga para remoção; desembaçador traseiro sensível..."
              {...register('notes')}
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
                  Salvando...
                </>
              ) : vehicleToEdit ? (
                'Salvar Alterações'
              ) : (
                'Cadastrar Veículo'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
