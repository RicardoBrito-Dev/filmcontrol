'use client'

import { useEffect, useState } from 'react'
import { ClipboardList, Plus, Clock, CheckCircle2, DollarSign, Camera } from 'lucide-react'
import { WorkOrderTable } from '@/components/work-orders/work-order-table'
import { WorkOrderFormModal } from '@/components/work-orders/work-order-form-modal'
import { workOrderService, type WorkOrderWithRelations } from '@/services/work-order.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

export default function OrdensPage() {
  const [orders, setOrders] = useState<WorkOrderWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const loadOrders = async () => {
    try {
      setLoading(true)
      const data = await workOrderService.list()
      setOrders(data)
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao carregar ordens de serviço', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const handleDelete = async (id: string) => {
    try {
      await workOrderService.delete(id)
      setOrders((prev) => prev.filter((o) => o.id !== id))
      toast({ title: 'OS excluída com sucesso' })
    } catch {
      toast({ title: 'Erro ao excluir OS', variant: 'destructive' })
    }
  }

  const handleUpdateStatus = async (
    id: string,
    status: WorkOrderWithRelations['status']
  ) => {
    try {
      await workOrderService.updateStatus(id, status)
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status } : o))
      )
      toast({ title: `OS atualizada para ${status}` })
    } catch {
      toast({ title: 'Erro ao atualizar OS', variant: 'destructive' })
    }
  }

  const handleOrderCreated = (saved: WorkOrderWithRelations) => {
    setOrders((prev) => [saved, ...prev])
  }

  // Summary counts
  const inProgressCount = orders.filter((o) => o.status === 'EM_INSTALACAO').length
  const completedCount = orders.filter((o) => o.status === 'CONCLUIDO').length
  const totalRevenue = orders
    .filter((o) => o.status === 'CONCLUIDO')
    .reduce((acc, o) => acc + Number(o.total || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Ordens de Serviço (OS)
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie instalações em andamento, ordens concluídas, pagamentos e fotos antes/depois.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Nova Ordem de Serviço
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Total de OS
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Registradas na plataforma</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Em Instalação
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {inProgressCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Sendo aplicadas agora</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Concluídas
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {completedCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Serviços finalizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Faturado em OS
            </CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">OS concluídas</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <WorkOrderTable
        orders={orders}
        onDelete={handleDelete}
        onAddNew={() => setIsModalOpen(true)}
        onUpdateStatus={handleUpdateStatus}
      />

      {/* Modal */}
      <WorkOrderFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={handleOrderCreated}
      />
    </div>
  )
}
