'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { CustomerDetails } from '@/components/customers/customer-details'
import { customerService, type CustomerWithRelations } from '@/services/customer.service'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface CustomerDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const resolvedParams = use(params)
  const id = resolvedParams.id
  const router = useRouter()

  const [customer, setCustomer] = useState<CustomerWithRelations | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await customerService.getById(id)
        setCustomer(data)
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
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-xl font-bold">Cliente não encontrado</h2>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          O cliente solicitado não existe ou foi removido.
        </p>
        <Button asChild variant="outline">
          <Link href="/clientes">
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para Clientes
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <CustomerDetails
      customer={customer}
      onCustomerUpdated={(updated) => setCustomer(updated)}
    />
  )
}
