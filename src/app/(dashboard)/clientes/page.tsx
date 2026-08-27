'use client'

import { useEffect, useState } from 'react'
import { Users, UserPlus, MapPin, Car, DollarSign } from 'lucide-react'
import { CustomerTable } from '@/components/customers/customer-table'
import { CustomerFormModal } from '@/components/customers/customer-form-modal'
import { VehicleFormModal } from '@/components/vehicles/vehicle-form-modal'
import { customerService, type CustomerWithRelations } from '@/services/customer.service'
import type { VehicleWithCustomer } from '@/services/vehicle.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

export default function ClientesPage() {
  const [customers, setCustomers] = useState<CustomerWithRelations[]>([])
  const [loading, setLoading] = useState(true)

  // Modals state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)
  const [customerToEdit, setCustomerToEdit] = useState<CustomerWithRelations | null>(null)

  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false)
  const [selectedCustomerIdForVehicle, setSelectedCustomerIdForVehicle] = useState<string | undefined>()

  const loadCustomers = async () => {
    try {
      setLoading(true)
      const data = await customerService.list()
      setCustomers(data)
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao carregar clientes', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  const handleEdit = (customer: CustomerWithRelations) => {
    setCustomerToEdit(customer)
    setIsCustomerModalOpen(true)
  }

  const handleAddNew = () => {
    setCustomerToEdit(null)
    setIsCustomerModalOpen(true)
  }

  const handleAddVehicle = (customer: CustomerWithRelations) => {
    setSelectedCustomerIdForVehicle(customer.id)
    setIsVehicleModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await customerService.delete(id)
      setCustomers((prev) => prev.filter((c) => c.id !== id))
      toast({ title: 'Cliente excluído com sucesso!' })
    } catch {
      toast({ title: 'Erro ao excluir cliente', variant: 'destructive' })
    }
  }

  const handleCustomerSaved = (saved: CustomerWithRelations) => {
    setCustomers((prev) => {
      const exists = prev.some((c) => c.id === saved.id)
      if (exists) {
        return prev.map((c) => (c.id === saved.id ? saved : c))
      }
      return [saved, ...prev]
    })
  }

  // Quick stats
  const totalSpentAll = customers.reduce((acc, c) => acc + (c.total_spent || 0), 0)
  const residentialClientsCount = customers.filter(
    (c) => c.address && (c.notes?.toLowerCase().includes('resid') || c.address_complement?.toLowerCase().includes('apto') || c.address_complement?.toLowerCase().includes('casa'))
  ).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Gestão de Clientes
        </h1>
        <p className="text-sm text-muted-foreground">
          Cadastre clientes, controle endereços residenciais/comerciais e frotas de veículos.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Total de Clientes
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Base ativa</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Total Faturado
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalSpentAll)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Serviços executados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Endereços Cadastrados
            </CardTitle>
            <MapPin className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter((c) => !!c.address).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Atendimento no local</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Ticket Médio
            </CardTitle>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.length > 0
                ? formatCurrency(totalSpentAll / customers.length)
                : 'R$ 0,00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Por cliente</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <CustomerTable
        customers={customers}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAddVehicle={handleAddVehicle}
        onAddNew={handleAddNew}
      />

      {/* Modals */}
      <CustomerFormModal
        open={isCustomerModalOpen}
        onOpenChange={setIsCustomerModalOpen}
        customerToEdit={customerToEdit}
        onSuccess={handleCustomerSaved}
      />

      <VehicleFormModal
        open={isVehicleModalOpen}
        onOpenChange={setIsVehicleModalOpen}
        preselectedCustomerId={selectedCustomerIdForVehicle}
        onSuccess={() => {
          loadCustomers()
        }}
      />
    </div>
  )
}
