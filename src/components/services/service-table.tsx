'use client'

import { useState } from 'react'
import { Search, Plus, MoreVertical, Edit, Trash2, Package, Clock, DollarSign, Tag, Calculator } from 'lucide-react'
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
import type { ServiceCatalog } from '@/types/database.types'

interface ServiceTableProps {
  services: ServiceCatalog[]
  onEdit: (service: ServiceCatalog) => void
  onDelete: (id: string) => void
  onAddNew: () => void
  onOpenCalculator: () => void
}

const categoryColors = {
  AUTOMOTIVO: 'info' as const,
  RESIDENCIAL: 'success' as const,
  COMERCIAL: 'warning' as const,
}

export function ServiceTable({
  services,
  onEdit,
  onDelete,
  onAddNew,
  onOpenCalculator,
}: ServiceTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')

  const filtered = services.filter((s) => {
    const term = searchTerm.toLowerCase()
    const nameMatch = s.name?.toLowerCase().includes(term)
    const descMatch = s.description?.toLowerCase().includes(term)
    const categoryMatch =
      selectedCategory === 'ALL' || s.category === selectedCategory
    return (nameMatch || descMatch) && categoryMatch
  })

  return (
    <div className="space-y-4">
      {/* Category filter tabs & search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'AUTOMOTIVO', 'RESIDENCIAL', 'COMERCIAL'].map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="text-xs capitalize"
            >
              {cat === 'ALL' ? 'Todos os Serviços' : cat.toLowerCase()}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCalculator}
            className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
          >
            <Calculator className="h-4 w-4" /> Calculadora de m²
          </Button>

          <Button size="sm" onClick={onAddNew} className="gap-1.5">
            <Plus className="h-4 w-4" /> Novo Serviço
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar serviço por nome ou descrição..."
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
          <h3 className="text-base font-semibold">Nenhum serviço encontrado</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            {searchTerm
              ? 'Tente buscar com outros termos ou selecione outra categoria.'
              : 'Cadastre serviços para usar na calculadora e nos orçamentos.'}
          </p>
          <Button onClick={onAddNew} size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Adicionar Serviço
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Serviço / Película</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Unidade</th>
                  <th className="px-4 py-3">Tempo Estimado</th>
                  <th className="px-4 py-3 text-right">Custo Insumo</th>
                  <th className="px-4 py-3 text-right">Preço de Venda</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((service) => {
                  const profit =
                    Number(service.default_price) - Number(service.estimated_cost || 0)
                  const margin =
                    Number(service.default_price) > 0
                      ? (profit / Number(service.default_price)) * 100
                      : 0

                  return (
                    <tr
                      key={service.id}
                      className="group transition-colors hover:bg-muted/30"
                    >
                      {/* Serviço / Descrição */}
                      <td className="px-4 py-3.5 max-w-[280px]">
                        <div className="font-semibold text-foreground">
                          {service.name}
                        </div>
                        {service.description && (
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {service.description}
                          </div>
                        )}
                      </td>

                      {/* Categoria */}
                      <td className="px-4 py-3.5">
                        <Badge
                          variant={categoryColors[service.category] || 'default'}
                          className="text-xs"
                        >
                          {service.category}
                        </Badge>
                      </td>

                      {/* Unidade */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-mono font-medium text-muted-foreground">
                          {service.unit}
                        </span>
                      </td>

                      {/* Tempo Estimado */}
                      <td className="px-4 py-3.5">
                        {service.estimated_duration_minutes ? (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3.5 w-3.5 text-primary" />
                            <span>{service.estimated_duration_minutes} min</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>

                      {/* Custo */}
                      <td className="px-4 py-3.5 text-right font-mono text-xs text-muted-foreground">
                        {service.estimated_cost
                          ? formatCurrency(Number(service.estimated_cost))
                          : 'R$ 0,00'}
                      </td>

                      {/* Preço de Venda */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="font-bold text-foreground">
                          {formatCurrency(Number(service.default_price))}
                        </div>
                        {margin > 0 && (
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                            Margem: {margin.toFixed(0)}%
                          </div>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3.5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem
                              onClick={() => onEdit(service)}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <Edit className="h-4 w-4 text-amber-500" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                if (
                                  confirm(
                                    `Deseja excluir o serviço "${service.name}"?`
                                  )
                                ) {
                                  onDelete(service.id)
                                }
                              }}
                              className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
            Mostrando {filtered.length} de {services.length} serviço(s)
          </div>
        </div>
      )}
    </div>
  )
}
