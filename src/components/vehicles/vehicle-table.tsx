'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Plus, MoreVertical, Edit, Trash2, Car, User, Phone } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPhone } from '@/lib/utils'
import type { VehicleWithCustomer } from '@/services/vehicle.service'

interface VehicleTableProps {
  vehicles: VehicleWithCustomer[]
  onEdit: (vehicle: VehicleWithCustomer) => void
  onDelete: (id: string) => void
  onAddNew: () => void
  hideCustomerColumn?: boolean
}

export function VehicleTable({
  vehicles,
  onEdit,
  onDelete,
  onAddNew,
  hideCustomerColumn = false,
}: VehicleTableProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filtered = vehicles.filter((v) => {
    const term = searchTerm.toLowerCase()
    const brandMatch = v.brand?.toLowerCase().includes(term)
    const modelMatch = v.model?.toLowerCase().includes(term)
    const plateMatch = v.plate?.toLowerCase().includes(term)
    const customerMatch = v.customer_name?.toLowerCase().includes(term)
    const typeMatch = v.type?.toLowerCase().includes(term)
    return brandMatch || modelMatch || plateMatch || customerMatch || typeMatch
  })

  return (
    <div className="space-y-4">
      {/* Search toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por placa, modelo, marca ou proprietário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border bg-background pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
          />
        </div>

        <Button onClick={onAddNew} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Veículo
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
            <Car className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold">Nenhum veículo cadastrado</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            {searchTerm
              ? 'Nenhum veículo corresponde à sua busca.'
              : 'Cadastre veículos para vincular a ordens de serviço.'}
          </p>
          <Button onClick={onAddNew} size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Adicionar Veículo
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Veículo / Modelo</th>
                  <th className="px-4 py-3">Placa</th>
                  <th className="px-4 py-3">Tipo & Ano</th>
                  {!hideCustomerColumn && <th className="px-4 py-3">Proprietário</th>}
                  <th className="px-4 py-3">Observações</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((vehicle) => {
                  return (
                    <tr
                      key={vehicle.id}
                      className="group transition-colors hover:bg-muted/30"
                    >
                      {/* Veículo / Modelo */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          <Car className="h-4 w-4 text-primary shrink-0" />
                          <span>
                            {vehicle.brand} {vehicle.model}
                          </span>
                        </div>
                        {vehicle.color && (
                          <div className="text-xs text-muted-foreground ml-6">
                            Cor: {vehicle.color}
                          </div>
                        )}
                      </td>

                      {/* Placa */}
                      <td className="px-4 py-3.5">
                        {vehicle.plate ? (
                          <Badge variant="outline" className="font-mono text-xs font-bold uppercase tracking-wider bg-background">
                            {vehicle.plate}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            Sem placa
                          </span>
                        )}
                      </td>

                      {/* Tipo & Ano */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {vehicle.type}
                          </Badge>
                          {vehicle.year && (
                            <span className="text-xs text-muted-foreground font-mono">
                              {vehicle.year}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Proprietário */}
                      {!hideCustomerColumn && (
                        <td className="px-4 py-3.5">
                          {vehicle.customer_id ? (
                            <Link
                              href={`/clientes/${vehicle.customer_id}`}
                              className="font-medium text-foreground hover:text-primary transition-colors flex flex-col"
                            >
                              <span>{vehicle.customer_name || 'Cliente'}</span>
                              {vehicle.customer_phone && (
                                <span className="text-xs text-muted-foreground">
                                  {formatPhone(vehicle.customer_phone)}
                                </span>
                              )}
                            </Link>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </td>
                      )}

                      {/* Observações */}
                      <td className="px-4 py-3.5 max-w-[200px]">
                        <p className="text-xs text-muted-foreground truncate" title={vehicle.notes || ''}>
                          {vehicle.notes || '-'}
                        </p>
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3.5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                              onClick={() => onEdit(vehicle)}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <Edit className="h-4 w-4 text-amber-500" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                if (
                                  confirm(
                                    `Excluir o veículo ${vehicle.brand} ${vehicle.model}?`
                                  )
                                ) {
                                  onDelete(vehicle.id)
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
            Mostrando {filtered.length} de {vehicles.length} veículo(s)
          </div>
        </div>
      )}
    </div>
  )
}
