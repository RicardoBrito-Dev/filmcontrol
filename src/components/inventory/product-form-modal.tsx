'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Package, Layers } from 'lucide-react'
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
import { productSchema, type ProductFormData } from '@/schemas/product.schema'
import { productService } from '@/services/product.service'
import type { Product } from '@/types/database.types'
import { toast } from '@/hooks/use-toast'

interface ProductFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productToEdit?: Product | null
  onSuccess: (product: Product) => void
}

export function ProductFormModal({
  open,
  onOpenChange,
  productToEdit,
  onSuccess,
}: ProductFormModalProps) {
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      category: 'Película Automotiva',
      brand: '',
      unit: 'm',
      quantity: 0,
      min_quantity: 5,
      cost: 0,
      supplier: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (productToEdit) {
      reset({
        name: productToEdit.name,
        category: productToEdit.category || 'Película Automotiva',
        brand: productToEdit.brand || '',
        unit: productToEdit.unit,
        quantity: Number(productToEdit.quantity),
        min_quantity: Number(productToEdit.min_quantity),
        cost: Number(productToEdit.cost),
        supplier: productToEdit.supplier || '',
        notes: productToEdit.notes || '',
      })
    } else {
      reset({
        name: '',
        category: 'Película Automotiva',
        brand: '',
        unit: 'm',
        quantity: 0,
        min_quantity: 5,
        cost: 0,
        supplier: '',
        notes: '',
      })
    }
  }, [productToEdit, reset, open])

  const onSubmit = async (data: ProductFormData) => {
    setLoading(true)
    try {
      if (productToEdit) {
        const updated = await productService.update(productToEdit.id, data)
        toast({
          title: 'Produto atualizado!',
          description: `${updated.name} salvo com sucesso.`,
          variant: 'success' as 'default',
        })
        onSuccess(updated)
      } else {
        const created = await productService.create(data)
        toast({
          title: 'Produto cadastrado!',
          description: `${created.name} adicionado ao estoque.`,
          variant: 'success' as 'default',
        })
        onSuccess(created)
      }
      onOpenChange(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar produto'
      toast({ title: 'Erro ao salvar', description: message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {productToEdit ? 'Editar Item do Estoque' : 'Novo Item / Película no Estoque'}
          </DialogTitle>
          <DialogDescription>
            Cadastre bobinas, rolos de películas, produtos químicos ou ferramentas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prod-name">
              Nome do Produto / Película <span className="text-destructive">*</span>
            </Label>
            <Input
              id="prod-name"
              placeholder="Ex: Película G5 Premium 1.52m (Rolo 30m)"
              {...register('name')}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="prod-cat">Categoria</Label>
              <select
                id="prod-cat"
                {...register('category')}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="Película Automotiva">Película Automotiva</option>
                <option value="Película Arquitetura / Residencial">Película Arquitetura / Residencial</option>
                <option value="Película Premium">Película Premium (Cerâmica/Carbon)</option>
                <option value="Insumos & Ferramentas">Insumos & Ferramentas</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prod-brand">Marca / Fabricante</Label>
              <Input
                id="prod-brand"
                placeholder="Ex: 3M, Avery, Llumar, Insulfilm"
                {...register('brand')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prod-unit">Unidade</Label>
              <select
                id="prod-unit"
                {...register('unit')}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="m">Metros Lineares (m)</option>
                <option value="m²">Metros Quadrados (m²)</option>
                <option value="rolo">Rolos / Bobinas</option>
                <option value="un">Unidade (un)</option>
                <option value="L">Litros (L)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prod-cost">Custo Unitário (R$)</Label>
              <Input
                id="prod-cost"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('cost', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prod-qty">Quantidade Inicial</Label>
              <Input
                id="prod-qty"
                type="number"
                step="0.1"
                placeholder="0"
                {...register('quantity', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prod-min">Estoque Mínimo (Alerta)</Label>
              <Input
                id="prod-min"
                type="number"
                step="1"
                placeholder="5"
                {...register('min_quantity', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="prod-supp">Fornecedor Principal</Label>
              <Input
                id="prod-supp"
                placeholder="Ex: Distribuidora Nacional de Películas"
                {...register('supplier')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prod-notes">Observações</Label>
            <textarea
              id="prod-notes"
              rows={2}
              placeholder="Localização na prateleira, especificações técnicas..."
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
              ) : productToEdit ? (
                'Salvar Alterações'
              ) : (
                'Cadastrar no Estoque'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
