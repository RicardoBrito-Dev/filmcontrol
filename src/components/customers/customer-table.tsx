'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Car,
  MessageCircle,
  Eye,
  MapPin,
  User,
  Plus,
  Building2,
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
import { formatCurrency, formatPhone } from '@/lib/utils'
import type { CustomerWithRelations } from '@/services/customer.service'

interface CustomerTableProps {
  customers: CustomerWithRelations[]
  onEdit: (customer: CustomerWithRelations) => void
  onDelete: (id: string) => void
  onAddVehicle: (customer: CustomerWithRelations) => void
  onAddNew: () => void
}

export function CustomerTable({
  customers,
  onEdit,
  onDelete,
  onAddVehicle,
  onAddNew,
}: CustomerTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'AUTO' | 'RESID'>('ALL')

  const filtered = customers.filter((c) => {
    const term = searchTerm.toLowerCase()
    const nameMatch = c.name?.toLowerCase().includes(term)
    const phoneMatch =
      c.whatsapp?.includes(term) || c.phone?.includes(term)
    const docMatch = c.document?.toLowerCase().includes(term)
    const cityMatch = c.city?.toLowerCase().includes(term)
    const addrMatch = c.address?.toLowerCase().includes(term)
    const neighMatch = c.neighborhood?.toLowerCase().includes(term)
    const vehMatch = (c.vehicles || []).some(
      (v) =>
        v.brand?.toLowerCase().includes(term) ||
        v.model?.toLowerCase().includes(term) ||
        v.plate?.toLowerCase().includes(term)
    )

    const matchesSearch =
      nameMatch ||
      phoneMatch ||
      docMatch ||
      cityMatch ||
      addrMatch ||
      neighMatch ||
      vehMatch

    if (!matchesSearch) return false

    const hasVehicles = (c.vehicles || []).length > 0
    if (categoryFilter === 'AUTO') return hasVehicles
    if (categoryFilter === 'RESID') return !hasVehicles || !!c.address
    return true
  })

  return (
    <div className="space-y-4">
      {/* Filter Tabs & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {[
            { key: 'ALL', label: 'Todos os Clientes' },
            { key: 'AUTO', label: '🚗 Automotivo' },
            { key: 'RESID', label: '🏠 Residencial / Comercial' },
          ].map(({ key, label }) => (
            <Button
              key={key}
              variant={categoryFilter === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategoryFilter(key as typeof categoryFilter)}
              className="text-xs h-8 px-3 shrink-0 font-medium"
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nome, WhatsApp, placa, carro ou endereço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border bg-background pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground transition-all"
          />
        </div>
      </div>

      {/* Table / List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-10 sm:p-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
            <User className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold">Nenhum cliente encontrado</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 mb-4">
            {searchTerm
              ? 'Tente buscar com outros termos.'
              : 'Cadastre seu primeiro cliente escolhendo atendimento automotivo ou residencial.'}
          </p>
          <Button onClick={onAddNew} size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Cadastrar Cliente
          </Button>
        </div>
      ) : (
        <>
          {/* MOBILE VIEW: Cards */}
          <div className="grid gap-3 sm:hidden">
            {filtered.map((customer) => {
              const cleanPhone = (customer.whatsapp || customer.phone || '').replace(/\D/g, '')
              const whatsappUrl = cleanPhone
                ? `https://wa.me/55${cleanPhone}?text=Olá%20${encodeURIComponent(customer.name)},%20tudo%20bem?`
                : null

              const hasVehicles = (customer.vehicles || []).length > 0
              const mainVehicle = customer.vehicles?.[0]

              const fullAddress = [
                customer.address,
                customer.address_number,
                customer.address_complement,
                customer.neighborhood,
                customer.city ? `${customer.city}/${customer.state || ''}` : '',
              ]
                .filter(Boolean)
                .join(', ')

              return (
                <div
                  key={customer.id}
                  className="rounded-xl border bg-card p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/clientes/${customer.id}`}
                        className="font-bold text-foreground text-base hover:text-primary transition-colors"
                      >
                        {customer.name}
                      </Link>
                      {customer.document && (
                        <span className="text-xs text-muted-foreground block font-mono">
                          {customer.document}
                        </span>
                      )}
                    </div>

                    {hasVehicles ? (
                      <Badge variant="outline" className="gap-1 font-mono text-[11px] border-primary/30 text-primary">
                        <Car className="h-3 w-3" />
                        {customer.vehicles?.length} carro(s)
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1 text-[11px]">
                        <Building2 className="h-3 w-3 text-blue-500" />
                        Residencial
                      </Badge>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1.5">
                    {mainVehicle && (
                      <div className="flex items-center gap-1.5 text-foreground font-medium">
                        <Car className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>
                          {mainVehicle.brand} {mainVehicle.model} {mainVehicle.plate ? `(${mainVehicle.plate})` : ''}
                        </span>
                      </div>
                    )}

                    {fullAddress && (
                      <div className="flex items-start gap-1.5 text-blue-600 dark:text-blue-400">
                        <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{fullAddress}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-1">
                      <span className="text-muted-foreground">
                        {customer.whatsapp
                          ? formatPhone(customer.whatsapp)
                          : customer.phone
                          ? formatPhone(customer.phone)
                          : 'Sem telefone'}
                      </span>

                      {customer.total_spent !== undefined && customer.total_spent > 0 && (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(customer.total_spent)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mobile Action Buttons */}
                  <div className="grid grid-cols-3 gap-1.5 pt-2 border-t text-xs">
                    <Button asChild size="sm" variant="outline" className="text-xs px-2 h-8">
                      <Link href={`/clientes/${customer.id}`}>
                        <Eye className="h-3.5 w-3.5 text-blue-500" /> Perfil
                      </Link>
                    </Button>

                    {whatsappUrl ? (
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="text-xs px-2 h-8 border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                      >
                        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                        </a>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(customer)}
                        className="text-xs px-2 h-8"
                      >
                        <Edit className="h-3.5 w-3.5 text-amber-500" /> Editar
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAddVehicle(customer)}
                      className="text-xs px-2 h-8 gap-1"
                    >
                      <Car className="h-3.5 w-3.5 text-primary" /> +Carro
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* DESKTOP VIEW: Table */}
          <div className="hidden sm:block overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Tipo / Veículo / Endereço</th>
                    <th className="px-4 py-3">Contato & WhatsApp</th>
                    <th className="px-4 py-3 text-right">Total Faturado</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((customer) => {
                    const cleanPhone = (customer.whatsapp || customer.phone || '').replace(
                      /\D/g,
                      ''
                    )
                    const whatsappUrl = cleanPhone
                      ? `https://wa.me/55${cleanPhone}?text=Olá%20${encodeURIComponent(
                          customer.name
                        )},%20tudo%20bem?`
                      : null

                    const hasVehicles = (customer.vehicles || []).length > 0
                    const mainVehicle = customer.vehicles?.[0]

                    const fullAddress = [
                      customer.address,
                      customer.address_number,
                      customer.address_complement,
                      customer.neighborhood,
                      customer.city ? `${customer.city}/${customer.state || ''}` : '',
                    ]
                      .filter(Boolean)
                      .join(', ')

                    return (
                      <tr
                        key={customer.id}
                        className="group transition-colors hover:bg-muted/30"
                      >
                        {/* Cliente */}
                        <td className="px-4 py-3.5">
                          <Link
                            href={`/clientes/${customer.id}`}
                            className="font-semibold text-foreground hover:text-primary transition-colors flex flex-col"
                          >
                            <span>{customer.name}</span>
                            {customer.document && (
                              <span className="text-xs text-muted-foreground font-normal font-mono">
                                {customer.document}
                              </span>
                            )}
                          </Link>
                        </td>

                        {/* Tipo / Veículo ou Endereço */}
                        <td className="px-4 py-3.5 max-w-[280px]">
                          {hasVehicles ? (
                            <div className="space-y-1">
                              <Badge variant="outline" className="gap-1 font-mono text-[11px] border-primary/30 text-primary">
                                <Car className="h-3 w-3" />
                                {mainVehicle?.brand} {mainVehicle?.model} ({mainVehicle?.plate || 'S/ placa'})
                              </Badge>
                              {customer.vehicles && customer.vehicles.length > 1 && (
                                <span className="text-[11px] text-muted-foreground block">
                                  + {customer.vehicles.length - 1} outro(s) veículo(s)
                                </span>
                              )}
                            </div>
                          ) : fullAddress ? (
                            <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                              <span className="line-clamp-2" title={fullAddress}>
                                {fullAddress}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              Atendimento Loja / Geral
                            </span>
                          )}
                        </td>

                        {/* Contato */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">
                              {customer.whatsapp
                                ? formatPhone(customer.whatsapp)
                                : customer.phone
                                ? formatPhone(customer.phone)
                                : 'Sem telefone'}
                            </span>
                            {whatsappUrl && (
                              <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400 transition-colors"
                                title="Abrir WhatsApp"
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        </td>

                        {/* Total Gasto */}
                        <td className="px-4 py-3.5 text-right font-medium">
                          {customer.total_spent !== undefined && customer.total_spent > 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                              {formatCurrency(customer.total_spent)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground font-mono">R$ 0,00</span>
                          )}
                        </td>

                        {/* Ações */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onAddVehicle(customer)}
                              className="h-8 text-xs gap-1"
                            >
                              <Car className="h-3.5 w-3.5 text-primary" /> +Veículo
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/clientes/${customer.id}`}
                                    className="flex items-center gap-2 cursor-pointer"
                                  >
                                    <Eye className="h-4 w-4 text-blue-500" /> Ver Perfil
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => onEdit(customer)}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <Edit className="h-4 w-4 text-amber-500" /> Editar Dados
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    if (
                                      confirm(
                                        `Tem certeza que deseja excluir ${customer.name}?`
                                      )
                                    ) {
                                      onDelete(customer.id)
                                    }
                                  }}
                                  className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4" /> Excluir Cliente
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
            <div className="border-t bg-muted/20 px-4 py-2 text-xs text-muted-foreground flex justify-between items-center">
              <span>
                Mostrando {filtered.length} de {customers.length} cliente(s)
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
