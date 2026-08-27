'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Car,
  MessageCircle,
  Eye,
  MapPin,
  Building,
  User,
  Phone,
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

  const filtered = customers.filter((c) => {
    const term = searchTerm.toLowerCase()
    const nameMatch = c.name?.toLowerCase().includes(term)
    const phoneMatch =
      c.whatsapp?.includes(term) || c.phone?.includes(term)
    const docMatch = c.document?.toLowerCase().includes(term)
    const cityMatch = c.city?.toLowerCase().includes(term)
    const addrMatch = c.address?.toLowerCase().includes(term)
    const neighMatch = c.neighborhood?.toLowerCase().includes(term)
    return (
      nameMatch ||
      phoneMatch ||
      docMatch ||
      cityMatch ||
      addrMatch ||
      neighMatch
    )
  })

  return (
    <div className="space-y-4">
      {/* Search & Actions toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nome, WhatsApp, CPF/CNPJ, endereço ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border bg-background pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
          />
        </div>

        <Button onClick={onAddNew} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Cliente
        </Button>
      </div>

      {/* Table / List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
            <User className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold">Nenhum cliente encontrado</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            {searchTerm
              ? 'Tente buscar com outros termos.'
              : 'Comece adicionando seu primeiro cliente.'}
          </p>
          <Button onClick={onAddNew} size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Cadastrar Cliente
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Contato & WhatsApp</th>
                  <th className="px-4 py-3">Endereço Residencial / Comercial</th>
                  <th className="px-4 py-3 text-center">Veículos</th>
                  <th className="px-4 py-3 text-right">Total Gasto</th>
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
                            <span className="text-xs text-muted-foreground font-normal">
                              {customer.document}
                            </span>
                          )}
                        </Link>
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
                        {customer.email && (
                          <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                            {customer.email}
                          </div>
                        )}
                      </td>

                      {/* Endereço Residencial / Comercial */}
                      <td className="px-4 py-3.5 max-w-[280px]">
                        {fullAddress ? (
                          <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                            <span className="line-clamp-2" title={fullAddress}>
                              {fullAddress}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            Não informado
                          </span>
                        )}
                      </td>

                      {/* Veículos */}
                      <td className="px-4 py-3.5 text-center">
                        <Badge variant="secondary" className="gap-1 font-mono">
                          <Car className="h-3 w-3" />
                          {customer.vehicles?.length || 0}
                        </Badge>
                      </td>

                      {/* Total Gasto */}
                      <td className="px-4 py-3.5 text-right font-medium">
                        {customer.total_spent !== undefined && customer.total_spent > 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            {formatCurrency(customer.total_spent)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">R$ 0,00</span>
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
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/clientes/${customer.id}`}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <Eye className="h-4 w-4 text-blue-500" /> Ver Detalhes
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onAddVehicle(customer)}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <Car className="h-4 w-4 text-primary" /> Adicionar Veículo
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
      )}
    </div>
  )
}
