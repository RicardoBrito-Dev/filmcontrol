'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { WorkOrderDetails } from '@/components/work-orders/work-order-details'
import { workOrderService, type WorkOrderWithRelations } from '@/services/work-order.service'

interface WorkOrderDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function WorkOrderDetailPage({ params }: WorkOrderDetailPageProps) {
  const resolvedParams = use(params)
  const id = resolvedParams.id

  const [order, setOrder] = useState<WorkOrderWithRelations | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await workOrderService.getById(id)
        setOrder(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-xl font-bold">Ordem de Serviço não encontrada</h2>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          A OS solicitada não existe ou foi excluída.
        </p>
        <Button asChild variant="outline">
          <Link href="/ordens">
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para Ordens de Serviço
          </Link>
        </Button>
      </div>
    )
  }

  return <WorkOrderDetails order={order} />
}
