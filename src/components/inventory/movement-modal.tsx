'use client'

import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, RefreshCw, Loader2, Layers } from 'lucide-react'
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
import { productService } from '@/services/product.service'
import type { Product } from '@/types/database.types'
import { toast } from '@/hooks/use-toast'

interface MovementModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onSuccess: (updated: Product) => void
}

export function MovementModal({
  open,
  onOpenChange,
  product,
  onSuccess,
}: MovementModalProps) {
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState<'ENTRADA' | 'SAIDA' | 'AJUSTE'>('ENTRADA')
  const [quantity, setQuantity] = useState<number>(1)
  const [notes, setNotes] = useState('')

  if (!product) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (quantity <= 0) {
      toast({ title: 'Quantidade deve ser maior que zero', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const updated = await productService.recordMovement({
        product_id: product.id,
        type,
        quantity,
        notes: notes || null,
      })

      toast({
        title: 'Estoque atualizado!',
        description: `Novo saldo de ${product.name}: ${updated.quantity} ${product.unit}`,
        variant: 'success' as 'default',
      })

      onSuccess(updated)
      onOpenChange(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao movimentar estoque'
      toast({ title: 'Erro', description: message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Movimentar Estoque
          </DialogTitle>
          <DialogDescription>
            {product.name} (Saldo atual: <strong>{product.quantity} {product.unit}</strong>)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de Movimentação</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={type === 'ENTRADA' ? 'default' : 'outline'}
                onClick={() => setType('ENTRADA')}
                className="gap-1 text-xs"
              >
                <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-500" /> Entrada
              </Button>

              <Button
                type="button"
                variant={type === 'SAIDA' ? 'default' : 'outline'}
                onClick={() => setType('SAIDA')}
                className="gap-1 text-xs"
              >
                <ArrowUpRight className="h-3.5 w-3.5 text-rose-500" /> Saída
              </Button>

              <Button
                type="button"
                variant={type === 'AJUSTE' ? 'default' : 'outline'}
                onClick={() => setType('AJUSTE')}
                className="gap-1 text-xs"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Ajuste
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mov-qty">
              Quantidade ({product.unit}) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="mov-qty"
              type="number"
              step="0.1"
              min="0.1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              required
              className="text-lg font-bold font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mov-notes">Motivo / Observação</Label>
            <Input
              id="mov-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Compra de novo rolo / Instalação em OS / Contagem"
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
              ) : (
                'Confirmar Movimentação'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
