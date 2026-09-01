'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Package, Sparkles } from 'lucide-react'
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
import { serviceSchema, type ServiceFormData } from '@/schemas/service.schema'
import { serviceService } from '@/services/service.service'
import type { ServiceCatalog } from '@/types/database.types'
import { toast } from '@/hooks/use-toast'

interface ServiceFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  serviceToEdit?: ServiceCatalog | null
  onSuccess: (service: ServiceCatalog) => void
}

export function ServiceFormModal({
  open,
  onOpenChange,
  serviceToEdit,
  onSuccess,
}: ServiceFormModalProps) {
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      category: 'AUTOMOTIVO',
      description: '',
      unit: 'veÃ­culo',
      default_price: 0,
      estimated_cost: 0,
      estimated_duration_minutes: 60,
      is_active: true,
    },
  })

  useEffect(() => {
    if (serviceToEdit) {
      reset({
        name: serviceToEdit.name,
        category: serviceToEdit.category,
        description: serviceToEdit.description || '',
        unit: serviceToEdit.unit,
        default_price: Number(serviceToEdit.default_price),
        estimated_cost: serviceToEdit.estimated_cost ? Number(serviceToEdit.estimated_cost) : 0,
        estimated_duration_minutes: serviceToEdit.estimated_duration_minutes || 60,
        is_active: serviceToEdit.is_active,
      })
    } else {
      reset({
        name: '',
        category: 'AUTOMOTIVO',
        description: '',
        unit: 'veÃ­culo',
        default_price: 0,
        estimated_cost: 0,
        estimated_duration_minutes: 60,
        is_active: true,
      })
    }
  }, [serviceToEdit, reset, open])

  const onSubmit = async (data: ServiceFormData) => {
    setLoading(true)
    try {
      if (serviceToEdit) {
        const updated = await serviceService.update(serviceToEdit.id, data)
        toast({
          title: 'ServiÃ§o atualizado!',
          description: `${updated.name} foi salvo.`,
          variant: 'success' as 'default',
        })
        onSuccess(updated)
      } else {
        const created = await serviceService.create(data)
        toast({
          title: 'ServiÃ§o adicionado!',
          description: `${created.name} disponÃ­vel no catÃ¡logo.`,
          variant: 'success' as 'default',
        })
        onSuccess(created)
      }
      onOpenChange(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar serviÃ§o'
      toast({ title: 'Erro ao salvar', description: message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto w-full sm:max-w-lg p-4 sm:p-6 gap-4 rounded-t-2xl sm:rounded-2xl top-auto bottom-0 sm:top-1/2 sm:bottom-auto translate-y-0 sm:-translate-y-1/2">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {serviceToEdit ? 'Editar ServiÃ§o' : 'Novo ServiÃ§o no CatÃ¡logo'}
          </DialogTitle>
          <DialogDescription>
            Configure pelÃ­culas, opÃ§Ãµes de aplicaÃ§Ã£o, preÃ§os sugeridos e tempo estimado.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Nome do ServiÃ§o / PelÃ­cula <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Ex: PelÃ­cula Nano CerÃ¢mica / Jateado Sacada"
              {...register('name')}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">
                Categoria <span className="text-destructive">*</span>
              </Label>
              <select
                id="category"
                {...register('category')}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="AUTOMOTIVO">Automotivo</option>
                <option value="RESIDENCIAL">Residencial</option>
                <option value="COMERCIAL">Comercial</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unidade de CobranÃ§a</Label>
              <select
                id="unit"
                {...register('unit')}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="veÃ­culo">Por VeÃ­culo</option>
                <option value="mÂ²">Por Metro Quadrado (mÂ²)</option>
                <option value="un">Por Unidade / Vidro</option>
                <option value="hora">Por Hora</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default_price">
                PreÃ§o PadrÃ£o de Venda (R$) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="default_price"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('default_price', { valueAsNumber: true })}
                className={errors.default_price ? 'border-destructive' : ''}
              />
              {errors.default_price && (
                <p className="text-xs text-destructive">{errors.default_price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_cost">Custo Estimado do Material (R$)</Label>
              <Input
                id="estimated_cost"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('estimated_cost', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="estimated_duration_minutes">
                Tempo Estimado de AplicaÃ§Ã£o (Minutos)
              </Label>
              <Input
                id="estimated_duration_minutes"
                type="number"
                step="15"
                placeholder="Ex: 90"
                {...register('estimated_duration_minutes', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">DescriÃ§Ã£o / BenefÃ­cios ao Cliente</Label>
            <textarea
              id="description"
              rows={2}
              placeholder="Ex: Alta proteÃ§Ã£o solar UV 99%, retenÃ§Ã£o de calor e garantia de 3 anos..."
              {...register('description')}
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
              ) : serviceToEdit ? (
                'Salvar AlteraÃ§Ãµes'
              ) : (
                'Adicionar ao CatÃ¡logo'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

