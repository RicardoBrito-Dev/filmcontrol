'use client'

import { useState } from 'react'
import {
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  Layers,
  ArrowUpDown,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import type { Product } from '@/types/database.types'

interface InventoryTableProps {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (id: string) => void
  onAddNew: () => void
  onMoveStock: (product: Product) => void
}

export function InventoryTable({
  products,
  onEdit,
  onDelete,
  onAddNew,
  onMoveStock,
}: InventoryTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false)

  const filtered = products.filter((p) => {
    const term = searchTerm.toLowerCase()
    const nameMatch = p.name?.toLowerCase().includes(term)
    const brandMatch = p.brand?.toLowerCase().includes(term)
    const suppMatch = p.supplier?.toLowerCase().includes(term)
    const isLowStock = Number(p.quantity) <= Number(p.min_quantity)

    const matchesSearch = nameMatch || brandMatch || suppMatch
    return filterLowStockOnly ? matchesSearch && isLowStock : matchesSearch
  })

  const lowStockCount = products.filter(
    (p) => Number(p.quantity) <= Number(p.min_quantity)
  ).length

  return (
    <div className="space-y-4">
      {/* Top filter toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={filterLowStockOnly ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
            className="text-xs gap-1.5"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            {filterLowStockOnly ? 'Filtrando: Estoque Baixo' : `Estoque Baixo (${lowStockCount})`}
          </Button>
        </div>

        <Button size="sm" onClick={onAddNew} className="gap-1.5 text-xs">
          <Plus className="h-4 w-4" /> Novo Produto
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar produto por nome, marca ou fornecedor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border bg-background pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold">Nenhum item de estoque encontrado</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            {searchTerm
              ? 'Tente buscar com outros termos.'
              : 'Cadastre suas bobinas e películas para controle de saldo.'}
          </p>
          <Button onClick={onAddNew} size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Cadastrar Produto
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Produto / Película</th>
                  <th className="px-4 py-3">Marca / Categoria</th>
                  <th className="px-4 py-3 text-right">Custo Unitário</th>
                  <th className="px-4 py-3 text-center">Saldo em Estoque</th>
                  <th className="px-4 py-3 text-center">Mínimo</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((product) => {
                  const isLow = Number(product.quantity) <= Number(product.min_quantity)

                  return (
                    <tr
                      key={product.id}
                      className="group transition-colors hover:bg-muted/30"
                    >
                      {/* Nome e Fornecedor */}
                      <td className="px-4 py-3.5 max-w-[260px]">
                        <div className="font-semibold text-foreground">
                          {product.name}
                        </div>
                        {product.supplier && (
                          <div className="text-xs text-muted-foreground">
                            Fornecedor: {product.supplier}
                          </div>
                        )}
                      </td>

                      {/* Marca e Categoria */}
                      <td className="px-4 py-3.5">
                        <div className="text-xs font-medium text-foreground">
                          {product.brand || '-'}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {product.category || 'Geral'}
                        </div>
                      </td>

                      {/* Custo */}
                      <td className="px-4 py-3.5 text-right font-mono text-xs text-muted-foreground">
                        {formatCurrency(Number(product.cost))}
                      </td>

                      {/* Saldo Atual */}
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`font-mono text-sm font-bold ${
                            isLow ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'
                          }`}
                        >
                          {product.quantity} {product.unit}
                        </span>
                      </td>

                      {/* Mínimo */}
                      <td className="px-4 py-3.5 text-center font-mono text-xs text-muted-foreground">
                        {product.min_quantity} {product.unit}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center">
                        {isLow ? (
                          <Badge variant="destructive" className="gap-1 text-xs">
                            <AlertTriangle className="h-3 w-3" /> Repor
                          </Badge>
                        ) : (
                          <Badge variant="success" className="text-xs">
                            Normal
                          </Badge>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onMoveStock(product)}
                            className="h-8 text-xs gap-1"
                          >
                            <ArrowUpDown className="h-3.5 w-3.5 text-primary" /> Movimentar
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36">
                              <DropdownMenuItem
                                onClick={() => onEdit(product)}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <Edit className="h-4 w-4 text-amber-500" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  if (
                                    confirm(
                                      `Deseja excluir "${product.name}" do estoque?`
                                    )
                                  ) {
                                    onDelete(product.id)
                                  }
                                }}
                                className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
            Mostrando {filtered.length} de {products.length} item(ns)
          </div>
        </div>
      )}
    </div>
  )
}
