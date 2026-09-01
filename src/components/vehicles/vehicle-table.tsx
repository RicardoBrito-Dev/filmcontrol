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
    if (!searchTerm.trim()) return true
    const term = searchTerm.toLowerCase().trim()
    const cleanTerm = term.replace(/[^a-z0-9]/g, '')

    const brandMatch = v.brand?.toLowerCase().includes(term)
    const modelMatch = v.model?.toLowerCase().includes(term)
    const plateMatch =
      v.plate?.toLowerCase().includes(term) ||
      (cleanTerm.length >= 2 && v.plate?.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleanTerm))
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
            placeholder="Buscar por placa, modelo, marca ou cliente..."
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
          <h3 className="text-base font-semibold">
            {searchTerm ? 'Nenhum veículo encontrado' : 'Nenhum veículo cadastrado'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            {searchTerm
              ? `Nenhum resultado para "${searchTerm}". Tente buscar por outros termos.`
              : 'Cadastre o primeiro veículo e vincule ao cliente.'}
          </p>
          <Button onClick={onAddNew} size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Cadastrar Veículo
          </Button>
        </div>
      ) : (
        <>
          {/* MOBILE VIEW: Cards */}
          <div className="grid gap-3 sm:hidden">
            {filtered.map((vehicle) => (
              <div
                key={vehicle.id}
                className="rounded-xl border bg-card p-4 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-foreground text-base flex items-center gap-1.5">
                      <Car className="h-4 w-4 text-primary shrink-0" />
                      {vehicle.brand} {vehicle.model}
                    </h4>
                    {vehicle.color && (
                      <span className="text-xs text-muted-foreground block">
                        Cor: {vehicle.color} {vehicle.year ? `• Ano: ${vehicle.year}` : ''}
                      </span>
                    )}
                  </div>

                  {vehicle.plate ? (
                    <Badge variant="outline" className="font-mono text-xs font-bold uppercase bg-background">
                      {vehicle.plate}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      {vehicle.type}
                    </Badge>
                  )}
                </div>

                {!hideCustomerColumn && vehicle.customer_name && (
                  <div className="text-xs bg-muted/40 p-2.5 rounded-lg border space-y-1">
                    <span className="text-muted-foreground block text-[11px]">Proprietário:</span>
                    <div className="flex items-center justify-between">
                      <Link
                        href={vehicle.customer_id ? `/clientes/${vehicle.customer_id}` : '#'}
                        className="font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1"
                      >
                        <User className="h-3 w-3 text-primary" /> {vehicle.customer_name}
                      </Link>
                      {vehicle.customer_phone && (
                        <span className="text-muted-foreground font-mono text-[11px]">
                          {formatPhone(vehicle.customer_phone)}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {vehicle.notes && (
                  <p className="text-xs text-muted-foreground bg-muted/20 p-2 rounded">
                    {vehicle.notes}
                  </p>
                )}

                {/* Mobile Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(vehicle)}
                    className="flex-1 text-xs h-9 gap-1 font-semibold"
                  >
                    <Edit className="h-3.5 w-3.5 text-amber-500" /> Editar Veículo
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (confirm(`Excluir o veículo ${vehicle.brand} ${vehicle.model}?`)) {
                        onDelete(vehicle.id)
                      }
                    }}
                    className="text-xs h-9 gap-1 text-destructive hover:bg-destructive/10 border-destructive/20 font-semibold px-3"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Excluir
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP VIEW: Table */}
          <div className="hidden sm:block overflow-hidden rounded-xl border bg-card shadow-sm">
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
        </>
      )}
    </div>
  )
}
