'use client'

import { useEffect, useState } from 'react'
import { Package, Plus, Calculator, Layers, ShieldCheck, DollarSign } from 'lucide-react'
import { ServiceTable } from '@/components/services/service-table'
import { ServiceFormModal } from '@/components/services/service-form-modal'
import { BudgetCalculatorModal } from '@/components/quotes/budget-calculator-modal'
import { serviceService } from '@/services/service.service'
import type { ServiceCatalog } from '@/types/database.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'

export default function ServicosPage() {
  const [services, setServices] = useState<ServiceCatalog[]>([])
  const [loading, setLoading] = useState(true)

  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false)
  const [serviceToEdit, setServiceToEdit] = useState<ServiceCatalog | null>(null)
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false)

  const loadServices = async () => {
    try {
      setLoading(true)
      const data = await serviceService.list()
      setServices(data)
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao carregar catálogo', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadServices()
  }, [])

  const handleEdit = (service: ServiceCatalog) => {
    setServiceToEdit(service)
    setIsServiceModalOpen(true)
  }

  const handleAddNew = () => {
    setServiceToEdit(null)
    setIsServiceModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await serviceService.delete(id)
      setServices((prev) => prev.filter((s) => s.id !== id))
      toast({ title: 'Serviço excluído do catálogo' })
    } catch {
      toast({ title: 'Erro ao excluir', variant: 'destructive' })
    }
  }

  const handleServiceSaved = (saved: ServiceCatalog) => {
    setServices((prev) => {
      const exists = prev.some((s) => s.id === saved.id)
      if (exists) {
        return prev.map((s) => (s.id === saved.id ? saved : s))
      }
      return [saved, ...prev]
    })
  }

  const autoCount = services.filter((s) => s.category === 'AUTOMOTIVO').length
  const resCount = services.filter((s) => s.category === 'RESIDENCIAL').length
  const comCount = services.filter((s) => s.category === 'COMERCIAL').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Catálogo de Serviços & Películas
          </h1>
          <p className="text-sm text-muted-foreground">
            Cadastre linhas de insulfilm automotivo, películas residenciais, comerciais e custos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsCalculatorOpen(true)}
            className="gap-1.5"
          >
            <Calculator className="h-4 w-4" /> Calculadora de Metragem
          </Button>
          <Button onClick={handleAddNew} className="gap-1.5">
            <Plus className="h-4 w-4" /> Novo Serviço
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Total no Catálogo
            </CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{services.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Serviços ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Automotivo
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{autoCount}</div>
            <p className="text-xs text-muted-foreground mt-1">G5, Cerâmica, Carbon...</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Residencial
            </CardTitle>
            <Layers className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Jateados, Sacadas, Espelhados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Comercial
            </CardTitle>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{comCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Vitrines, Escritórios</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <ServiceTable
        services={services}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAddNew={handleAddNew}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
      />

      {/* Modais */}
      <ServiceFormModal
        open={isServiceModalOpen}
        onOpenChange={setIsServiceModalOpen}
        serviceToEdit={serviceToEdit}
        onSuccess={handleServiceSaved}
      />

      <BudgetCalculatorModal
        open={isCalculatorOpen}
        onOpenChange={setIsCalculatorOpen}
      />
    </div>
  )
}
