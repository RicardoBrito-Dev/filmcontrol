'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Car,
  FileText,
  ClipboardList,
  Edit,
  Plus,
  Calendar,
  DollarSign,
  User,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatPhone, formatDate } from '@/lib/utils'
import type { CustomerWithRelations } from '@/services/customer.service'
import type { VehicleWithCustomer } from '@/services/vehicle.service'
import { VehicleTable } from '@/components/vehicles/vehicle-table'
import { VehicleFormModal } from '@/components/vehicles/vehicle-form-modal'
import { CustomerFormModal } from '@/components/customers/customer-form-modal'
import { vehicleService } from '@/services/vehicle.service'
import { toast } from '@/hooks/use-toast'

interface CustomerDetailsProps {
  customer: CustomerWithRelations
  onCustomerUpdated: (customer: CustomerWithRelations) => void
}

export function CustomerDetails({
  customer,
  onCustomerUpdated,
}: CustomerDetailsProps) {
  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false)
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false)
  const [vehicleToEdit, setVehicleToEdit] = useState<VehicleWithCustomer | null>(null)
  const [vehicles, setVehicles] = useState<VehicleWithCustomer[]>(
    (customer.vehicles || []).map((v) => ({
      ...v,
      customer_name: customer.name,
      customer_phone: customer.whatsapp || customer.phone || undefined,
    }))
  )

  const cleanPhone = (customer.whatsapp || customer.phone || '').replace(/\D/g, '')
  const whatsappUrl = cleanPhone
    ? `https://wa.me/55${cleanPhone}?text=Olá%20${encodeURIComponent(
        customer.name
      )},%20tudo%20bem?`
    : null

  const fullAddress = [
    customer.address,
    customer.address_number ? `nº ${customer.address_number}` : '',
    customer.address_complement,
    customer.neighborhood,
    customer.city ? `${customer.city}/${customer.state || ''}` : '',
    customer.zip_code ? `CEP: ${customer.zip_code}` : '',
  ]
    .filter(Boolean)
    .join(', ')

  const handleVehicleCreatedOrUpdated = (vehicle: VehicleWithCustomer) => {
    setVehicles((prev) => {
      const exists = prev.some((v) => v.id === vehicle.id)
      if (exists) {
        return prev.map((v) => (v.id === vehicle.id ? vehicle : v))
      }
      return [vehicle, ...prev]
    })
  }

  const handleDeleteVehicle = async (id: string) => {
    try {
      await vehicleService.delete(id)
      setVehicles((prev) => prev.filter((v) => v.id !== id))
      toast({ title: 'Veículo excluído com sucesso!' })
    } catch {
      toast({ title: 'Erro ao excluir veículo', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with back button & quick actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon">
            <Link href="/clientes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{customer.name}</h1>
              <Badge variant="outline">Cliente</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cadastrado em {formatDate(customer.created_at)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {whatsappUrl && (
            <Button asChild variant="outline" className="gap-2 border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" /> Enviar WhatsApp
              </a>
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setIsEditCustomerOpen(true)}
            className="gap-2"
          >
            <Edit className="h-4 w-4 text-amber-500" /> Editar Cliente
          </Button>
          <Button
            onClick={() => {
              setVehicleToEdit(null)
              setIsAddVehicleOpen(true)
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> Adicionar Veículo
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Gasto
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(customer.total_spent || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Faturamento acumulado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Serviços Concluídos
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customer.services_count || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ordens de serviço
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Veículos Cadastrados
            </CardTitle>
            <Car className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicles.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Frota / Carros vinculados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Último Atendimento
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-base font-bold truncate">
              {customer.last_service_date
                ? formatDate(customer.last_service_date)
                : 'Nenhum recente'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Data da última OS</p>
          </CardContent>
        </Card>
      </div>

      {/* Info Cards Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Contato e Identificação */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> Dados de Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-xs text-muted-foreground block">WhatsApp</span>
              <span className="font-semibold text-foreground">
                {customer.whatsapp ? formatPhone(customer.whatsapp) : 'Não informado'}
              </span>
            </div>
            {customer.phone && (
              <div>
                <span className="text-xs text-muted-foreground block">Telefone Secundário</span>
                <span className="text-foreground">{formatPhone(customer.phone)}</span>
              </div>
            )}
            <div>
              <span className="text-xs text-muted-foreground block">E-mail</span>
              <span className="text-foreground">{customer.email || 'Não informado'}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">CPF / CNPJ</span>
              <span className="font-mono text-foreground">
                {customer.document || 'Não informado'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Endereço Residencial / Comercial */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> Endereço Residencial / Comercial
            </CardTitle>
            <CardDescription>
              Local para orçamentos e aplicações de película no local (residencial/comercial)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {fullAddress ? (
              <div className="rounded-lg border bg-muted/30 p-3.5 space-y-2">
                <p className="font-medium text-foreground leading-relaxed">
                  {fullAddress}
                </p>
                {customer.city && customer.address && (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                  >
                    <MapPin className="h-3.5 w-3.5" /> Abrir no Google Maps
                  </a>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground italic text-xs">
                Nenhum endereço cadastrado para este cliente.
              </p>
            )}

            {customer.notes && (
              <div className="pt-2 border-t">
                <span className="text-xs font-semibold text-muted-foreground block mb-1">
                  Observações / Preferências
                </span>
                <p className="text-xs text-foreground bg-muted/20 p-2.5 rounded-lg">
                  {customer.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Veículos do Cliente */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Car className="h-4 w-4 text-primary" /> Veículos Vinculados
            </CardTitle>
            <CardDescription>
              Veículos cadastrados para este cliente
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setVehicleToEdit(null)
              setIsAddVehicleOpen(true)
            }}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" /> Novo Veículo
          </Button>
        </CardHeader>
        <CardContent>
          <VehicleTable
            vehicles={vehicles}
            hideCustomerColumn={true}
            onEdit={(v) => {
              setVehicleToEdit(v)
              setIsAddVehicleOpen(true)
            }}
            onDelete={handleDeleteVehicle}
            onAddNew={() => {
              setVehicleToEdit(null)
              setIsAddVehicleOpen(true)
            }}
          />
        </CardContent>
      </Card>

      {/* Modais */}
      <CustomerFormModal
        open={isEditCustomerOpen}
        onOpenChange={setIsEditCustomerOpen}
        customerToEdit={customer}
        onSuccess={(updated) => {
          onCustomerUpdated(updated)
        }}
      />

      <VehicleFormModal
        open={isAddVehicleOpen}
        onOpenChange={setIsAddVehicleOpen}
        vehicleToEdit={vehicleToEdit}
        preselectedCustomerId={customer.id}
        onSuccess={handleVehicleCreatedOrUpdated}
      />
    </div>
  )
}
