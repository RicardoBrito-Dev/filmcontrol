'use client'

import { useEffect, useState } from 'react'
import { FileText, Plus, Calculator, DollarSign, Clock, CheckCircle2 } from 'lucide-react'
import { QuoteTable } from '@/components/quotes/quote-table'
import { QuoteFormModal } from '@/components/quotes/quote-form-modal'
import { BudgetCalculatorModal } from '@/components/quotes/budget-calculator-modal'
import { quoteService, type QuoteWithRelations } from '@/services/quote.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

export default function OrcamentosPage() {
  const [quotes, setQuotes] = useState<QuoteWithRelations[]>([])
  const [loading, setLoading] = useState(true)

  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false)
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false)

  const loadQuotes = async () => {
    try {
      setLoading(true)
      const data = await quoteService.list()
      setQuotes(data)
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao carregar orçamentos', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQuotes()
  }, [])

  const handleDelete = async (id: string) => {
    try {
      await quoteService.delete(id)
      setQuotes((prev) => prev.filter((q) => q.id !== id))
      toast({ title: 'Orçamento excluído com sucesso' })
    } catch {
      toast({ title: 'Erro ao excluir orçamento', variant: 'destructive' })
    }
  }

  const handleUpdateStatus = async (
    id: string,
    status: QuoteWithRelations['status']
  ) => {
    try {
      const quoteObj = quotes.find((q) => q.id === id)
      await quoteService.updateStatus(id, status, quoteObj)
      setQuotes((prev) =>
        prev.map((q) => (q.id === id ? { ...q, status } : q))
      )
      if (status === 'APROVADO') {
        toast({
          title: 'Orçamento Aprovado!',
          description: 'O agendamento foi adicionado à sua Agenda. Acesse a Agenda para definir data/horário.',
          variant: 'success' as 'default',
        })
      } else {
        toast({ title: `Status atualizado para ${status}` })
      }
    } catch {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' })
    }
  }

  const handleQuoteSaved = (saved: QuoteWithRelations) => {
    setQuotes((prev) => [saved, ...prev])
  }

  // Summary calculations
  const pendingCount = quotes.filter(
    (q) => q.status === 'AGUARDANDO_APROVACAO' || q.status === 'ENVIADO'
  ).length
  const approvedCount = quotes.filter((q) => q.status === 'APROVADO').length
  const totalPendingValue = quotes
    .filter((q) => q.status === 'AGUARDANDO_APROVACAO' || q.status === 'ENVIADO')
    .reduce((acc, q) => acc + Number(q.total || 0), 0)
  const totalApprovedValue = quotes
    .filter((q) => q.status === 'APROVADO')
    .reduce((acc, q) => acc + Number(q.total || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Gestão de Orçamentos
          </h1>
          <p className="text-sm text-muted-foreground">
            Emita propostas comerciais para clientes com cálculo de área, PDF para impressão e envio no WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsCalculatorOpen(true)}
            className="gap-1.5"
          >
            <Calculator className="h-4 w-4" /> Calculadora de Vidros
          </Button>
          <Button onClick={() => setIsQuoteModalOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Novo Orçamento
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Total de Orçamentos
            </CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quotes.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Emitidos na plataforma</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Orçamentos Pendentes
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {pendingCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Valor: {formatCurrency(totalPendingValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Orçamentos Aprovados
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {approvedCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Faturado: {formatCurrency(totalApprovedValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Taxa de Conversão
            </CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quotes.length > 0
                ? `${((approvedCount / quotes.length) * 100).toFixed(0)}%`
                : '0%'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Propostas fechadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <QuoteTable
        quotes={quotes}
        onDelete={handleDelete}
        onAddNew={() => setIsQuoteModalOpen(true)}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
        onUpdateStatus={handleUpdateStatus}
      />

      {/* Modais */}
      <QuoteFormModal
        open={isQuoteModalOpen}
        onOpenChange={setIsQuoteModalOpen}
        onSuccess={handleQuoteSaved}
      />

      <BudgetCalculatorModal
        open={isCalculatorOpen}
        onOpenChange={setIsCalculatorOpen}
      />
    </div>
  )
}
