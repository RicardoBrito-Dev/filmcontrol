'use client'

import { useState } from 'react'
import {
  Search,
  Plus,
  MoreVertical,
  Trash2,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
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
import { formatCurrency, formatDate } from '@/lib/utils'
import type { FinancialTransaction } from '@/types/database.types'

interface FinancialTableProps {
  transactions: FinancialTransaction[]
  onDelete: (id: string) => void
  onAddNew: () => void
  onUpdateStatus: (id: string, status: FinancialTransaction['status']) => void
}

const statusBadgeConfig = {
  PAGO: { label: 'Pago', variant: 'success' as const },
  PENDENTE: { label: 'Pendente', variant: 'warning' as const },
  VENCIDO: { label: 'Vencido', variant: 'destructive' as const },
}

export function FinancialTable({
  transactions,
  onDelete,
  onAddNew,
  onUpdateStatus,
}: FinancialTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('ALL')

  const filtered = transactions.filter((t) => {
    const term = searchTerm.toLowerCase()
    const descMatch = t.description?.toLowerCase().includes(term)
    const catMatch = t.category?.toLowerCase().includes(term)
    const matchesSearch = descMatch || catMatch

    if (filterType === 'ALL') return matchesSearch
    if (filterType === 'ENTRADA') return matchesSearch && t.type === 'ENTRADA'
    if (filterType === 'SAIDA') return matchesSearch && t.type === 'SAIDA'
    if (filterType === 'PENDENTE') return matchesSearch && t.status === 'PENDENTE'
    return matchesSearch
  })

  return (
    <div className="space-y-4">
      {/* Top filter toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'ENTRADA', 'SAIDA', 'PENDENTE'].map((ft) => (
            <Button
              key={ft}
              variant={filterType === ft ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType(ft)}
              className="text-xs"
            >
              {ft === 'ALL'
                ? 'Todos os Lançamentos'
                : ft === 'ENTRADA'
                ? 'Receitas (Entradas)'
                : ft === 'SAIDA'
                ? 'Despesas (Saídas)'
                : 'Pendentes'}
            </Button>
          ))}
        </div>

        <Button size="sm" onClick={onAddNew} className="gap-1.5 text-xs">
          <Plus className="h-4 w-4" /> Novo Lançamento
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por descrição ou categoria..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border bg-background pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
            <DollarSign className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold">Nenhum lançamento encontrado</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            {searchTerm
              ? 'Tente buscar com outros termos.'
              : 'Cadastre suas receitas e despesas para controle de fluxo de caixa.'}
          </p>
          <Button onClick={onAddNew} size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Criar Lançamento
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Forma de Pagto</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((t) => {
                  const isIncome = t.type === 'ENTRADA'
                  const statusInfo =
                    statusBadgeConfig[t.status] || statusBadgeConfig.PENDENTE

                  return (
                    <tr
                      key={t.id}
                      className="group transition-colors hover:bg-muted/30"
                    >
                      {/* Descrição + Ícone */}
                      <td className="px-4 py-3.5 max-w-[280px]">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                              isIncome
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                            }`}
                          >
                            {isIncome ? (
                              <ArrowDownLeft className="h-4 w-4" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">
                              {t.description}
                            </div>
                            {t.notes && (
                              <div className="text-xs text-muted-foreground line-clamp-1">
                                {t.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Categoria */}
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        {t.category}
                      </td>

                      {/* Forma de Pagamento */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-mono font-medium text-muted-foreground">
                          {t.method || '-'}
                        </span>
                      </td>

                      {/* Data */}
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        {formatDate(t.reference_date)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <Badge variant={statusInfo.variant} className="text-xs">
                          {statusInfo.label}
                        </Badge>
                      </td>

                      {/* Valor */}
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-base">
                        <span
                          className={
                            isIncome
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }
                        >
                          {isIncome ? '+ ' : '- '}
                          {formatCurrency(Number(t.amount))}
                        </span>
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
                            {t.status !== 'PAGO' && (
                              <DropdownMenuItem
                                onClick={() => onUpdateStatus(t.id, 'PAGO')}
                                className="flex items-center gap-2 cursor-pointer text-emerald-600 focus:text-emerald-600"
                              >
                                <CheckCircle2 className="h-4 w-4" /> Marcar Pago
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                if (
                                  confirm(
                                    `Deseja excluir "${t.description}"?`
                                  )
                                ) {
                                  onDelete(t.id)
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
            Mostrando {filtered.length} de {transactions.length} lançamento(s)
          </div>
        </div>
      )}
    </div>
  )
}
