'use client'

import { useEffect, useState } from 'react'
import { Car, Plus, ShieldCheck, Truck } from 'lucide-react'
import { VehicleTable } from '@/components/vehicles/vehicle-table'
import { VehicleFormModal } from '@/components/vehicles/vehicle-form-modal'
import { vehicleService, type VehicleWithCustomer } from '@/services/vehicle.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'

export default function VeiculosPage() {
  const [vehicles, setVehicles] = useState<VehicleWithCustomer[]>([])
  const [loading, setLoading] = useState(true)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [vehicleToEdit, setVehicleToEdit] = useState<VehicleWithCustomer | null>(null)

  const loadVehicles = async () => {
    try {
      setLoading(true)
      const data = await vehicleService.list()
      setVehicles(data)
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao carregar veículos', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVehicles()
  }, [])

  const handleEdit = (vehicle: VehicleWithCustomer) => {
    setVehicleToEdit(vehicle)
    setIsModalOpen(true)
  }

  const handleAddNew = () => {
    setVehicleToEdit(null)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await vehicleService.delete(id)
      setVehicles((prev) => prev.filter((v) => v.id !== id))
      toast({ title: 'Veículo excluído com sucesso!' })
    } catch {
      toast({ title: 'Erro ao excluir veículo', variant: 'destructive' })
    }
  }

  const handleVehicleSaved = (saved: VehicleWithCustomer) => {
    setVehicles((prev) => {
      const exists = prev.some((v) => v.id === saved.id)
      if (exists) {
        return prev.map((v) => (v.id === saved.id ? saved : v))
      }
      return [saved, ...prev]
    })
  }

  // Summary counts
  const carsCount = vehicles.filter((v) => v.type === 'CARRO').length
  const suvsCount = vehicles.filter((v) => v.type === 'SUV').length
  const pickupsCount = vehicles.filter((v) => v.type === 'PICKUP').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Gestão de Veículos
        </h1>
        <p className="text-sm text-muted-foreground">
          Controle a frota e veículos vinculados a cada cliente para emissão de orçamentos e ordens de serviço.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Total de Veículos
            </CardTitle>
            <Car className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicles.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Veículos cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Carros & Sedans
            </CardTitle>
            <Car className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{carsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Hatch / Sedan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              SUVs
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suvsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Crossovers e SUVs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Pickups & Caminhões
            </CardTitle>
            <Truck className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pickupsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Veículos pesados</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <VehicleTable
        vehicles={vehicles}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAddNew={handleAddNew}
      />

      {/* Modal */}
      <VehicleFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        vehicleToEdit={vehicleToEdit}
        onSuccess={handleVehicleSaved}
      />
    </div>
  )
}
