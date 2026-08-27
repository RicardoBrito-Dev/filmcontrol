'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { QuotePdfView } from '@/components/quotes/quote-pdf-view'
import { quoteService, type QuoteWithRelations } from '@/services/quote.service'

interface QuoteDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function QuoteDetailPage({ params }: QuoteDetailPageProps) {
  const resolvedParams = use(params)
  const id = resolvedParams.id

  const [quote, setQuote] = useState<QuoteWithRelations | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await quoteService.getById(id)
        setQuote(data)
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
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-xl font-bold">Orçamento não encontrado</h2>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          O orçamento solicitado não existe ou foi excluído.
        </p>
        <Button asChild variant="outline">
          <Link href="/orcamentos">
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para Orçamentos
          </Link>
        </Button>
      </div>
    )
  }

  return <QuotePdfView quote={quote} />
}
