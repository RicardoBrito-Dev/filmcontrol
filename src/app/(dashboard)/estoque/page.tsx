'use client'

import { useEffect, useState } from 'react'
import { Package, Plus, AlertTriangle, Layers, DollarSign, ArrowUpDown } from 'lucide-react'
import { InventoryTable } from '@/components/inventory/inventory-table'
import { ProductFormModal } from '@/components/inventory/product-form-modal'
import { MovementModal } from '@/components/inventory/movement-modal'
import { productService } from '@/services/product.service'
import type { Product } from '@/types/database.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

export default function EstoquePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [productToEdit, setProductToEdit] = useState<Product | null>(null)

  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false)
  const [productToMove, setProductToMove] = useState<Product | null>(null)

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await productService.list()
      setProducts(data)
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao carregar estoque', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const handleEdit = (product: Product) => {
    setProductToEdit(product)
    setIsProductModalOpen(true)
  }

  const handleAddNew = () => {
    setProductToEdit(null)
    setIsProductModalOpen(true)
  }

  const handleMoveStock = (product: Product) => {
    setProductToMove(product)
    setIsMovementModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await productService.delete(id)
      setProducts((prev) => prev.filter((p) => p.id !== id))
      toast({ title: 'Item removido do estoque' })
    } catch {
      toast({ title: 'Erro ao excluir item', variant: 'destructive' })
    }
  }

  const handleProductSaved = (saved: Product) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === saved.id)
      if (exists) {
        return prev.map((p) => (p.id === saved.id ? saved : p))
      }
      return [saved, ...prev]
    })
  }

  // Summary counts
  const totalStockValue = products.reduce(
    (acc, p) => acc + Number(p.quantity) * Number(p.cost),
    0
  )
  const lowStockCount = products.filter(
    (p) => Number(p.quantity) <= Number(p.min_quantity)
  ).length
  const automotiveFilms = products.filter((p) =>
    p.category?.toLowerCase().includes('auto')
  ).length
  const residentialFilms = products.filter(
    (p) =>
      p.category?.toLowerCase().includes('resid') ||
      p.category?.toLowerCase().includes('arquit')
  ).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Controle de Estoque
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitore bobinas de insulfilm, insumos, custos médios e alertas de reposição.
          </p>
        </div>

        <Button onClick={handleAddNew} className="gap-1.5">
          <Plus className="h-4 w-4" /> Novo Produto
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Total de Itens
            </CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Produtos cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Alerta: Estoque Baixo
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {lowStockCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Necessitam reposição</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Valor Total em Estoque
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalStockValue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Custo imobilizado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Bobinas Automotivo / Arq.
            </CardTitle>
            <Layers className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {automotiveFilms} / {residentialFilms}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Auto vs Residencial</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <InventoryTable
        products={products}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAddNew={handleAddNew}
        onMoveStock={handleMoveStock}
      />

      {/* Modals */}
      <ProductFormModal
        open={isProductModalOpen}
        onOpenChange={setIsProductModalOpen}
        productToEdit={productToEdit}
        onSuccess={handleProductSaved}
      />

      <MovementModal
        open={isMovementModalOpen}
        onOpenChange={setIsMovementModalOpen}
        product={productToMove}
        onSuccess={handleProductSaved}
      />
    </div>
  )
}
